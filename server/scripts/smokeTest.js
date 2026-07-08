process.env.ACCESS_TOKEN_SECRET ||= "smoke-test-secret";

const assert = require("assert");
const app = require("../app");
const { generateAccessToken, verifyAccessToken } = require("../src/utils/authTokens");

assert.equal(typeof app.handle, "function", "Express app should be importable");

const token = generateAccessToken({
  id: "00000000-0000-4000-8000-000000000001",
  role: "ADMIN",
  email: "admin@example.test",
});
const payload = verifyAccessToken(token);

assert.equal(payload.sub, "00000000-0000-4000-8000-000000000001");
assert.equal(payload.role, "ADMIN");
assert.equal(payload.email, "admin@example.test");
assert.throws(() => verifyAccessToken(`${token}tampered`), /Invalid token/);

console.log("Smoke tests passed.");
