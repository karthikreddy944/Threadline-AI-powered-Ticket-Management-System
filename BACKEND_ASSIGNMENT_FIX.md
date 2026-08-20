# Assignment engine — manual + automatic (Round Robin / Priority Wise / FIFO)

## Root cause of the original bug
Two separate problems in the pre-existing code:

1. **New tickets always auto-assigned, even in "Manual" mode.**
   `ticketController.createTicket` called `autoAssignTicket(ticket)`
   unconditionally on every ticket creation, with no check on the
   admin's selected Assignment Mode. There was no `mode` field on
   `AllocationSettings` at all — only a `strategy` field — so there
   was no way to turn automatic assignment off.

2. **Round Robin state was a raw index (`cursor`) into `User.find()`
   ordered by `createdAt`.** If an employee was added, removed, or
   deactivated between assignments, the numeric cursor would silently
   point at the wrong employee (or skip/repeat one), and FIFO strategy
   was actually selecting by *employee* `lastAssignedAt` — never using
   the ticket's own creation timestamp — so it wasn't really FIFO by
   ticket age at all.

## What changed

### Backend
- `models/AllocationSettings.js` — added `mode: "manual" | "automatic"`
  (persisted, survives restart/logout per the requirement) and
  replaced the numeric `cursor` with `lastAssignedEmployeeId`, which
  is resilient to employees joining/leaving the active pool.
- `services/allocationService.js` — rewritten. Pure, unit-tested
  selection/ordering functions:
  - `chooseRoundRobinIndex` — rotates through ACTIVE employees only,
    resuming from whoever was assigned last.
  - `chooseByWorkload` — picks the ACTIVE employee with the fewest
    open tickets (real MongoDB aggregation, not a frontend counter),
    tie-broken by who's waited longest since their last assignment.
    Used for Priority Wise and FIFO employee selection.
  - `orderTicketsForAssignment` — decides the *processing order* for
    a batch of unassigned tickets: FIFO sorts oldest `createdAt`
    first (confirmed not FILO — see test below); Priority Wise sorts
    Critical → High → Medium → Low, then oldest first within a tier.
  - DB orchestration: `autoAssignOnCreate` (gated on mode ===
    "automatic"), `assignTicketAutomatically` (single ticket),
    `assignAllUnassigned` (bulk button).
- `controllers/allocationController.js` / `routes/allocationRoutes.js`
  — new endpoints:
  - `GET /api/allocation` — current mode + strategy
  - `PUT /api/allocation` — save mode + strategy (persists to Mongo)
  - `POST /api/allocation/assign/:ticketId` — automatic assignment for one ticket
  - `POST /api/allocation/assign-all` — automatic assignment for every
    unassigned, unresolved ticket, in strategy order
- `controllers/ticketController.js` — `createTicket` now only
  auto-assigns when Assignment Mode is "automatic"; manual assignment
  activity now logs `"Manual assignment: <name>"` for a clean method
  distinction in the audit trail (automatic assignments log
  `"Automatic assignment: <name> (<Strategy>)"`).

### Frontend
- `pages/admin/AdminSettings.jsx` — Manual / Automatic radio toggle;
  the strategy picker (Round Robin / Priority Wise / FIFO) only shows
  in Automatic mode, matching the requested UI.
- `pages/admin/AdminTicketDetails.jsx` — the assignee dropdown now
  only lists ACTIVE employees; in Automatic mode it's replaced with
  an "Automatically assign" button that calls the backend.
- `pages/admin/TicketQueue.jsx` — "Automatically Assign Unassigned
  Tickets" button (visible only in Automatic mode) that calls the
  bulk endpoint and refreshes the queue; shows
  "No active employees available for automatic assignment." if none
  are eligible, per spec.
- `lib/api.js` — `autoAssignTicket(ticketId)`,
  `autoAssignAllUnassigned()`.

## Verification performed
- `node --check` on every changed backend file — all pass.
- `backend/allocation.smoketest.js` — dependency-free unit test of
  the pure selection/ordering functions (`node allocation.smoketest.js`):
  - Round Robin sequence over 3 active employees: `A, B, C, A, B` ✅
  - Round Robin recovers correctly when the last-assigned employee is
    no longer active ✅
  - Workload-based tie-break picks whoever's waited longest ✅
  - FIFO order is oldest-created-first, confirmed **not** FILO ✅
  - Priority order is Critical/High → Medium → Low ✅
- `npm run build` in `frontend/ticket-system` — builds clean.
- `npx oxlint src` — 0 errors (10 pre-existing warnings unrelated to
  this change, e.g. an unused catch param in the original `api.js`).
- **Not verified in this sandbox:** a full live run against a real
  MongoDB + both dev servers. This environment has no local MongoDB
  and its network egress is restricted to package registries, so
  `mongodb-memory-server` cannot download a `mongod` binary here. The
  step-by-step manual test plan below is written so you (or CI) can
  run it against your own MongoDB instance in under 10 minutes.

## Manual test plan
1. `cd backend && npm install && npm run seed && npm run dev`
2. `cd frontend/ticket-system && npm install && npm run dev`
3. Log in as admin (`admin@ticketsystem.test` / `Admin@123`).
4. Employees → add three employees (or reactivate seeded ones).
5. Settings → Assignment mode → Automatic → strategy → Round Robin → Save.
6. As the seeded client, create 3 tickets (each needs a connected
   GitHub repo per existing ticket-creation validation).
7. Ticket queue → confirm they assigned to Employee A, B, C in order
   automatically on creation.
8. Switch strategy to Priority Wise, create tickets of mixed
   priority, use "Automatically Assign Unassigned Tickets" if any are
   unassigned, confirm Critical/High are processed before Low.
9. Switch strategy to FIFO, create tickets a few seconds apart,
   confirm the oldest is assigned first.
10. Switch mode to Manual, create a ticket, confirm it stays
    unassigned until you pick an employee on the ticket detail page.
11. Deactivate an employee (Employees page) and confirm they no
    longer appear in the manual dropdown or receive automatic
    assignments.
12. Reassign an already-assigned ticket to a different employee and
    confirm the previous assignee gets a reassignment notification.
