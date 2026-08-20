/**
 * Standalone smoke test for the ticket-attachment feature.
 * Not part of the app — run manually with:
 *   node attachment.smoketest.js
 * Uses an in-memory MongoDB, so it does not touch the real Atlas DB.
 */
process.env.JWT_SECRET = "test-secret";
process.env.JWT_EXPIRES_IN = "1h";
process.env.NODE_ENV = "test";

const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const request = require("supertest");
const fs = require("fs");
const path = require("path");

let failures = 0;
const check = (label, cond) => {
  console.log(`${cond ? "PASS" : "FAIL"} - ${label}`);
  if (!cond) failures++;
};

(async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();

  await mongoose.connect(process.env.MONGO_URI);
  const app = require("./src/app");
  const User = require("./src/models/User");
  const Ticket = require("./src/models/Ticket");

  // --- seed two clients + one admin ---
  const clientA = await User.create({ name: "Client A", email: "a@test.com", password: "Password1", role: "client" });
  const clientB = await User.create({ name: "Client B", email: "b@test.com", password: "Password1", role: "client" });
  const admin = await User.create({ name: "Admin", email: "admin@test.com", password: "Password1", role: "admin" });

  const loginAs = async (email) => {
    const res = await request(app).post("/api/auth/login").send({ email, password: "Password1" });
    return res.body.data.token;
  };

  const tokenA = await loginAs("a@test.com");
  const tokenB = await loginAs("b@test.com");
  const tokenAdmin = await loginAs("admin@test.com");

  // --- Client A creates a ticket (existing JSON flow, unchanged) ---
  const createRes = await request(app)
    .post("/api/tickets")
    .set("Authorization", `Bearer ${tokenA}`)
    .send({ title: "Wifi issue", description: "desc", category: "Network", priority: "Medium" });
  check("create ticket (JSON, no attachments) still works", createRes.status === 201);
  const ticketId = createRes.body.data._id;

  // --- prepare test files ---
  const tmpDir = path.join(__dirname, "tmp-test-files");
  fs.mkdirSync(tmpDir, { recursive: true });
  const pngPath = path.join(tmpDir, "shot.png");
  const pdfPath = path.join(tmpDir, "doc.pdf");
  const jsPath = path.join(tmpDir, "code.js");
  const exePath = path.join(tmpDir, "virus.exe");
  const bigPath = path.join(tmpDir, "big.png");
  // Minimal valid-enough headers so content sniffing (if any) doesn't matter for this test
  fs.writeFileSync(pngPath, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  fs.writeFileSync(pdfPath, Buffer.from("%PDF-1.4 test"));
  fs.writeFileSync(jsPath, "console.log('hi')");
  fs.writeFileSync(exePath, "MZ fake exe");
  fs.writeFileSync(bigPath, Buffer.alloc(11 * 1024 * 1024, 1)); // 11MB > 10MB limit

  // --- 1. Client A uploads valid attachments to their own ticket ---
  const uploadRes = await request(app)
    .post(`/api/tickets/${ticketId}/attachments`)
    .set("Authorization", `Bearer ${tokenA}`)
    .attach("files", pngPath)
    .attach("files", pdfPath)
    .attach("files", jsPath);
  check("upload png+pdf+js as owner succeeds (201)", uploadRes.status === 201);
  check("upload returns 3 attachment records", uploadRes.body.data?.length === 3);

  const attachmentId = uploadRes.body.data?.[0]?.id;
  check("attachment record has no raw filesystem path", uploadRes.body.data?.[0]?.filename === undefined);

  // --- 2. reject disallowed extension ---
  const badExtRes = await request(app)
    .post(`/api/tickets/${ticketId}/attachments`)
    .set("Authorization", `Bearer ${tokenA}`)
    .attach("files", exePath);
  check("uploading .exe is rejected (400)", badExtRes.status === 400);

  // --- 3. reject oversized file ---
  const bigRes = await request(app)
    .post(`/api/tickets/${ticketId}/attachments`)
    .set("Authorization", `Bearer ${tokenA}`)
    .attach("files", bigPath);
  check("uploading >10MB file is rejected (400)", bigRes.status === 400);

  // --- 4. owner can download their own attachment ---
  const dlRes = await request(app)
    .get(`/api/tickets/${ticketId}/attachments/${attachmentId}`)
    .set("Authorization", `Bearer ${tokenA}`);
  check("owner can download own attachment (200)", dlRes.status === 200);
  check("download has correct content-type", dlRes.headers["content-type"] === "image/png");

  // --- 5. unauthenticated request is rejected ---
  const noAuthRes = await request(app).get(`/api/tickets/${ticketId}/attachments/${attachmentId}`);
  check("unauthenticated download is rejected (401)", noAuthRes.status === 401);

  // --- 6. a different client cannot access this ticket's attachment ---
  const otherClientRes = await request(app)
    .get(`/api/tickets/${ticketId}/attachments/${attachmentId}`)
    .set("Authorization", `Bearer ${tokenB}`);
  check("Client B cannot access Client A's attachment (403)", otherClientRes.status === 403);

  const otherClientUploadRes = await request(app)
    .post(`/api/tickets/${ticketId}/attachments`)
    .set("Authorization", `Bearer ${tokenB}`)
    .attach("files", pdfPath);
  check("Client B cannot upload to Client A's ticket (403)", otherClientUploadRes.status === 403);

  // --- 7. admin CAN access any ticket's attachments ---
  const adminDlRes = await request(app)
    .get(`/api/tickets/${ticketId}/attachments/${attachmentId}`)
    .set("Authorization", `Bearer ${tokenAdmin}`);
  check("admin can download any attachment (200)", adminDlRes.status === 200);

  // --- 8. ticket details include attachments (existing GET /:id) ---
  const ticketDoc = await request(app)
    .get(`/api/tickets/${ticketId}`)
    .set("Authorization", `Bearer ${tokenA}`);
  check("GET ticket by id includes attachments array", Array.isArray(ticketDoc.body.data.attachments) && ticketDoc.body.data.attachments.length === 3);

  // --- 9. delete attachment, then re-download should 404 ---
  const delRes = await request(app)
    .delete(`/api/tickets/${ticketId}/attachments/${attachmentId}`)
    .set("Authorization", `Bearer ${tokenA}`);
  check("owner can delete their attachment (200)", delRes.status === 200);
  check("attachment list shrinks after delete", delRes.body.data?.length === 2);

  const dlAfterDeleteRes = await request(app)
    .get(`/api/tickets/${ticketId}/attachments/${attachmentId}`)
    .set("Authorization", `Bearer ${tokenA}`);
  check("downloading a deleted attachment 404s", dlAfterDeleteRes.status === 404);

  // --- 10. regression: ticket creation without any files still returns clean ticket ---
  const plainTicket = await request(app)
    .post("/api/tickets")
    .set("Authorization", `Bearer ${tokenA}`)
    .send({ title: "No attachments", description: "desc", category: "Software", priority: "Low" });
  check("ticket with zero attachments has attachments: []", Array.isArray(plainTicket.body.data.attachments) && plainTicket.body.data.attachments.length === 0);

  // --- 11. regression: existing activity + status update flow still works ---
  const activityRes = await request(app)
    .post(`/api/tickets/${ticketId}/activity`)
    .set("Authorization", `Bearer ${tokenA}`)
    .send({ message: "still works" });
  check("existing activity endpoint still works", activityRes.status === 201);

  const updateRes = await request(app)
    .put(`/api/tickets/${ticketId}`)
    .set("Authorization", `Bearer ${tokenAdmin}`)
    .send({ status: "In Progress" });
  check("existing admin status-update endpoint still works", updateRes.status === 200 && updateRes.body.data.status === "In Progress");

  fs.rmSync(tmpDir, { recursive: true, force: true });
  await mongoose.disconnect();
  await mongod.stop();

  console.log(`\n${failures === 0 ? "ALL TESTS PASSED" : `${failures} TEST(S) FAILED`}`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
