const crypto = require("crypto");
const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; const TAG_BYTES = 16;
function getKey() { const raw = process.env.GITHUB_TOKEN_ENCRYPTION_KEY; if (!raw) throw new Error("GITHUB_TOKEN_ENCRYPTION_KEY is not configured."); const key = Buffer.from(raw, /^[0-9a-fA-F]{64}$/.test(raw) ? "hex" : "base64"); if (key.length !== 32) throw new Error("GITHUB_TOKEN_ENCRYPTION_KEY must decode to 32 bytes."); return key; }
function encryptText(value) { const iv=crypto.randomBytes(IV_BYTES); const cipher=crypto.createCipheriv(ALGORITHM,getKey(),iv); const encrypted=Buffer.concat([cipher.update(String(value),"utf8"),cipher.final()]); const tag=cipher.getAuthTag(); return Buffer.concat([iv,tag,encrypted]).toString("base64"); }
function decryptText(payload) { const raw=Buffer.from(payload,"base64"); if(raw.length<=IV_BYTES+TAG_BYTES) throw new Error("Invalid encrypted payload."); const iv=raw.subarray(0,IV_BYTES), tag=raw.subarray(IV_BYTES,IV_BYTES+TAG_BYTES), encrypted=raw.subarray(IV_BYTES+TAG_BYTES); const decipher=crypto.createDecipheriv(ALGORITHM,getKey(),iv); decipher.setAuthTag(tag); return Buffer.concat([decipher.update(encrypted),decipher.final()]).toString("utf8"); }
module.exports={encryptText,decryptText};
