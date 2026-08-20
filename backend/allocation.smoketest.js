/**
 * Standalone smoke test for the automatic ticket assignment engine
 * (Round Robin, Priority Wise, FIFO). Exercises the pure
 * selection/ordering functions directly — no database required.
 * Run manually with:
 *   node allocation.smoketest.js
 */
const assert = require("assert");
const mongoose = require("mongoose");
process.env.MONGO_URI = "mongodb://127.0.0.1:27017/test"; // not connected, fine for pure fn test
const {
  chooseRoundRobinIndex,
  chooseByWorkload,
  orderTicketsForAssignment,
} = require("./src/services/allocationService");

// ---- Round Robin ----
const emp = (id) => ({ _id: new mongoose.Types.ObjectId(id) });
const A = emp("000000000000000000000001");
const B = emp("000000000000000000000002");
const C = emp("000000000000000000000003");
const employees = [A, B, C];

// No prior assignment -> starts at A (index 0)
assert.strictEqual(chooseRoundRobinIndex(employees, null), 0);
// Last assigned A -> next is B
assert.strictEqual(chooseRoundRobinIndex(employees, A._id), 1);
// Last assigned C (end of list) -> wraps to A
assert.strictEqual(chooseRoundRobinIndex(employees, C._id), 0);
// Last-assigned employee no longer active -> restart at 0
const ghost = new mongoose.Types.ObjectId("000000000000000000000099");
assert.strictEqual(chooseRoundRobinIndex(employees, ghost), 0);
console.log("Round robin: OK");

// Simulate 5 sequential tickets against A,B,C -> A,B,C,A,B
let last = null;
const seq = [];
for (let i = 0; i < 5; i++) {
  const idx = chooseRoundRobinIndex(employees, last);
  seq.push(["A","B","C"][idx]);
  last = employees[idx]._id;
}
assert.deepStrictEqual(seq, ["A","B","C","A","B"]);
console.log("Round robin sequence A,B,C,A,B: OK ->", seq.join(","));

// ---- Workload-based selection (Priority/FIFO employee pick) ----
const workloadMap = new Map([
  [A._id.toString(), { open: 3 }],
  [B._id.toString(), { open: 1 }],
  [C._id.toString(), { open: 1 }],
]);
// B and C tie at 1 open; B has no lastAssignedAt (0), C assigned recently -> B should win (older/never assigned first)
B.lastAssignedAt = null;
C.lastAssignedAt = new Date();
const idx = chooseByWorkload(employees, workloadMap);
assert.strictEqual(idx, 1); // B
console.log("Workload-based selection picks least-loaded (tie -> longest waiting): OK");

// ---- FIFO / Priority ticket ordering ----
const t = (id, priority, createdAt) => ({ _id: id, ticketId: id, priority, createdAt });
const tickets = [
  t("T-C", "Medium", "2026-08-19T10:10:00Z"),
  t("T-A", "Low", "2026-08-19T10:00:00Z"),
  t("T-B", "High", "2026-08-19T10:05:00Z"),
];

const fifoOrder = orderTicketsForAssignment(tickets, "fifo").map(x=>x.ticketId);
assert.deepStrictEqual(fifoOrder, ["T-A", "T-B", "T-C"]); // pure creation-time order, NOT FILO
console.log("FIFO order (oldest first, not FILO): OK ->", fifoOrder.join(","));

const priorityOrder = orderTicketsForAssignment(tickets, "priority").map(x=>x.ticketId);
assert.deepStrictEqual(priorityOrder, ["T-B", "T-C", "T-A"]); // High, Medium, Low
console.log("Priority order (Critical/High > Medium > Low): OK ->", priorityOrder.join(","));

console.log("\nAll allocation unit tests passed.");
