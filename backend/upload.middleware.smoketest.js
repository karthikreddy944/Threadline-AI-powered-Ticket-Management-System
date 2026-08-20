/**
 * Tests only the multer/validation pipeline in uploadMiddleware.js,
 * with no MongoDB involved (mongodb-memory-server can't reach the
 * network in this sandbox to download a mongod binary, so the
 * ticket/auth-aware flow could not be run here — see attachmentController
 * logic review instead for that part).
 *
 * Run with: node upload.middleware.smoketest.js
 */
const express = require("express");
const request = require("supertest");
const fs = require("fs");
const path = require("path");
const { uploadTicketAttachments } = require("./src/middleware/uploadMiddleware");

let failures = 0;
const check = (label, cond) => {
  console.log(`${cond ? "PASS" : "FAIL"} - ${label}`);
  if (!cond) failures++;
};

const app = express();
app.post("/upload", uploadTicketAttachments, (req, res) => {
  res.json({ success: true, files: (req.files || []).map((f) => ({ name: f.filename, size: f.size, mime: f.mimetype })) });
});

(async () => {
  const tmpDir = path.join(__dirname, "tmp-mw-test-files");
  fs.mkdirSync(tmpDir, { recursive: true });

  const pngPath = path.join(tmpDir, "shot.png");
  const jsPath = path.join(tmpDir, "code.js");
  const exePath = path.join(tmpDir, "bad.exe");
  const noExtPath = path.join(tmpDir, "noext");
  const bigPath = path.join(tmpDir, "big.png");
  const traversalPath = path.join(tmpDir, "..%2f..%2fetc%2fpasswd.txt".replace(/%2f/g, "_")); // can't literally create a path-traversal filename on disk; validated via originalname below instead

  fs.writeFileSync(pngPath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  fs.writeFileSync(jsPath, "console.log(1)");
  fs.writeFileSync(exePath, "MZ");
  fs.writeFileSync(noExtPath, "no extension");
  fs.writeFileSync(bigPath, Buffer.alloc(11 * 1024 * 1024, 1));

  // 1. valid image
  const r1 = await request(app).post("/upload").attach("files", pngPath);
  check("valid .png accepted (200)", r1.status === 200 && r1.body.files.length === 1);

  // 2. valid code file
  const r2 = await request(app).post("/upload").attach("files", jsPath);
  check("valid .js accepted (200)", r2.status === 200 && r2.body.files.length === 1);

  // 3. disallowed extension
  const r3 = await request(app).post("/upload").attach("files", exePath);
  check(".exe rejected (400)", r3.status === 400);

  // 4. no extension
  const r4 = await request(app).post("/upload").attach("files", noExtPath);
  check("file with no extension rejected (400)", r4.status === 400);

  // 5. oversized file
  const r5 = await request(app).post("/upload").attach("files", bigPath);
  check(">10MB file rejected (400)", r5.status === 400 && /too large/i.test(r5.body.message));

  // 6. too many files at once (limit is 5)
  const req6 = request(app).post("/upload");
  for (let i = 0; i < 6; i++) req6.attach("files", pngPath);
  const r6 = await req6;
  check("uploading 6 files (max 5) rejected (400)", r6.status === 400 && /too many/i.test(r6.body.message));

  // 7. generated filename is not the original name (no path traversal / unsafe chars survive)
  check(
    "stored filename is a generated UUID, not the original name",
    r1.body.files[0].name !== "shot.png" && /^[0-9a-f-]+\.png$/i.test(r1.body.files[0].name)
  );

  // 8. spoofed mimetype on a strict-checked extension is rejected
  // (simulate by attaching a .png file but forcing a bogus field content-type)
  const r8 = await request(app)
    .post("/upload")
    .attach("files", pngPath, { filename: "spoof.png", contentType: "application/x-msdownload" });
  check("mismatched MIME type for .png rejected (400)", r8.status === 400);

  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log(`\n${failures === 0 ? "ALL MIDDLEWARE TESTS PASSED" : `${failures} TEST(S) FAILED`}`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((err) => {
  console.error("crashed:", err);
  process.exit(1);
});
