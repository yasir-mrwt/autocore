const crypto = require("crypto");
const jwt = require("jsonwebtoken");

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

const generateAccessToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
    },
    getAccessTokenSecret(),
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );

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
  generateRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
  getRefreshCookieOptions,
  setRefreshCookie,
  clearRefreshCookie,
};
