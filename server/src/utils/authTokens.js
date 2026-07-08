const crypto = require("crypto");

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_TOKEN_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 30);
const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || "autocore_refresh";
const REFRESH_COOKIE_NAMES = {
  CUSTOMER: `${REFRESH_COOKIE_NAME}_customer`,
  ADMIN: `${REFRESH_COOKIE_NAME}_admin`,
};

const normalizeRole = (role = "CUSTOMER") => (role === "ADMIN" ? "ADMIN" : "CUSTOMER");

const getRefreshCookieName = (role = "CUSTOMER") =>
  REFRESH_COOKIE_NAMES[normalizeRole(role)];

const getAccessTokenSecret = () => {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new Error("ACCESS_TOKEN_SECRET is required.");
  }

  return process.env.ACCESS_TOKEN_SECRET;
};

const base64UrlEncode = (value) =>
  Buffer.from(value).toString("base64url");

const base64UrlJson = (value) => base64UrlEncode(JSON.stringify(value));

const parseDurationSeconds = (duration) => {
  if (typeof duration === "number" && Number.isFinite(duration)) {
    return duration;
  }

  const match = String(duration).trim().match(/^(\d+)([smhd])?$/i);
  if (!match) {
    throw new Error("ACCESS_TOKEN_EXPIRES_IN must use seconds, m, h, or d.");
  }

  const amount = Number(match[1]);
  const unit = (match[2] || "s").toLowerCase();
  const multipliers = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  };

  return amount * multipliers[unit];
};

const signJwt = (header, payload, secret) => {
  const encodedHeader = base64UrlJson(header);
  const encodedPayload = base64UrlJson(payload);
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(signingInput)
    .digest("base64url");

  return `${signingInput}.${signature}`;
};

const generateAccessToken = (user) => {
  const now = Math.floor(Date.now() / 1000);
  const expiresInSeconds = parseDurationSeconds(ACCESS_TOKEN_EXPIRES_IN);

  return signJwt(
    { alg: "HS256", typ: "JWT" },
    {
      sub: user.id,
      role: user.role,
      email: user.email,
      iat: now,
      exp: now + expiresInSeconds,
    },
    getAccessTokenSecret()
  );
};

const timingSafeEqual = (actual, expected) => {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  );
};

const verifyAccessToken = (token) => {
  const [encodedHeader, encodedPayload, signature] = String(token || "").split(".");
  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error("Invalid token.");
  }

  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = crypto
    .createHmac("sha256", getAccessTokenSecret())
    .update(signingInput)
    .digest("base64url");

  if (!timingSafeEqual(signature, expectedSignature)) {
    throw new Error("Invalid token signature.");
  }

  const header = JSON.parse(Buffer.from(encodedHeader, "base64url").toString("utf8"));
  if (header.alg !== "HS256" || header.typ !== "JWT") {
    throw new Error("Unsupported token.");
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  const now = Math.floor(Date.now() / 1000);

  if (!payload.sub || !payload.exp || payload.exp <= now) {
    throw new Error("Expired or invalid token.");
  }

  return payload;
};

const generateRefreshToken = () => crypto.randomBytes(64).toString("hex");

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const getRefreshTokenExpiry = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);
  return expiresAt;
};

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.AUTH_COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
  sameSite: process.env.AUTH_COOKIE_SAMESITE || "lax",
  maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
  path: "/api/v1/auth",
});

const setRefreshCookie = (res, token, role = "CUSTOMER") => {
  res.cookie(getRefreshCookieName(role), token, getRefreshCookieOptions());
};

const clearRefreshCookie = (res, role = "CUSTOMER") => {
  res.clearCookie(getRefreshCookieName(role), {
    ...getRefreshCookieOptions(),
    maxAge: undefined,
  });
};

module.exports = {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_COOKIE_NAME,
  getRefreshCookieName,
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
  getRefreshCookieOptions,
  setRefreshCookie,
  clearRefreshCookie,
};
