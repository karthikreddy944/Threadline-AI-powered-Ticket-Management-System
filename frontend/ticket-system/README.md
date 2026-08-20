# Threadline — AI-Powered Ticket Management System (Frontend Prototype)

A polished, enterprise-style frontend prototype for a college IT ticket management system,
with an AI Analysis feature woven into the ticket workflow. This stage is UI-only — mock
data throughout, no backend or live LLM calls yet.

## Stack
React 19 · Vite · React Router · Tailwind CSS v4 · Lucide React

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL (usually http://localhost:5173).

- `/login` — student/staff sign in → redirects into `/app`
- `/app` — client dashboard, my tickets, create ticket, ticket details, notifications, settings
- `/admin/login` — admin sign in → redirects into `/admin`
- `/admin` — admin dashboard, ticket queue, ticket details (with triage controls), analytics, settings

## Design notes

- Palette: off-white canvas, near-black ink, a single restrained deep-teal accent
  (`#0E6B5C`), with muted status colors for priority/status. No gradients, no neon,
  no glassmorphism.
- Typography: Inter for UI, Inter Tight for page titles, IBM Plex Mono for ticket IDs
  and other data-like metadata (a nod to dev-tool ticket systems like Linear/GitHub issues).
- Signature element: a 3px colored "priority rail" on ticket rows instead of loud
  badges everywhere — priority is always visible at a glance without shouting.
- The AI Analysis panel is styled as an inline decision-support card (summary,
  detected category, priority, recommended action, confidence bar) — deliberately
  not a chat bubble.

## What's mocked

- Auth (`/login`, `/admin/login`) — any input "signs in", no real auth check
- All ticket data lives in `src/data/mockTickets.js`
- The AI Analysis on each ticket is precomputed mock output, not a live API call
- Ticket creation shows a simulated ~900ms "submitting" state before confirmation

## Not yet built (by design, per the brief)

- Backend / database integration
- Real LLM API call (Gemini/Claude/OpenAI) for ticket classification
- Real authentication and role-based access control
- File upload persistence (the attachment picker is UI-only)
