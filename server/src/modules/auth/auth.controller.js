const bcrypt = require("bcrypt");
const {
  clearRefreshCookie,
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  hashToken,
  REFRESH_COOKIE_NAME,
  getRefreshCookieName,
  setRefreshCookie,
} = require("../../utils/authTokens");
const { parseCookies } = require("../../utils/cookies");
const { getPrisma } = require("../../config/prisma");
const { sendMail } = require("../../../Utils/mailer");

const SALT_ROUNDS = Number(process.env.PASSWORD_SALT_ROUNDS || 12);
const RESET_OTP_TTL_MS = Number(process.env.PASSWORD_RESET_OTP_MINUTES || 10) * 60 * 1000;
const RESET_OTP_RESEND_MS = Number(process.env.PASSWORD_RESET_RESEND_SECONDS || 60) * 1000;
const passwordResetOtps = new Map();

const selectSafeUser = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  emailVerifiedAt: true,
  createdAt: true,
  updatedAt: true,
};

const formatUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  status: user.status,
  emailVerifiedAt: user.emailVerifiedAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const createOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const buildPasswordResetEmail = ({ name, otp }) => ({
  subject: "Reset your AutoCore password",
  html: `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#0f172a">
      <div style="padding:24px;border-bottom:1px solid #e2e8f0">
        <h1 style="margin:0;color:#1572D3">AutoCore</h1>
        <p style="margin:8px 0 0;color:#64748b">Password reset</p>
      </div>
      <div style="padding:24px">
        <h2 style="margin:0 0 12px">Use this OTP to reset your password</h2>
        <p style="line-height:1.6;color:#475569">Hi ${name || "there"}, enter this code in AutoCore to choose a new password.</p>
        <div style="font-size:32px;letter-spacing:8px;font-weight:800;color:#1572D3;background:#E8F1FB;border-radius:10px;padding:16px;text-align:center">${otp}</div>
        <p style="line-height:1.6;color:#64748b">This code expires in ${Math.round(RESET_OTP_TTL_MS / 60000)} minutes and can be used once.</p>
      </div>
      <div style="padding:16px 24px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px">
        If you did not request this, you can ignore this email.
      </div>
    </div>
  `,
  text: `Your AutoCore password reset OTP is ${otp}. It expires in ${Math.round(RESET_OTP_TTL_MS / 60000)} minutes.`,
});

const getRefreshTokenFromRequest = (req, role = "CUSTOMER") => {
  const cookies = parseCookies(req.headers.cookie);
  return (
    cookies[getRefreshCookieName(role)] ||
    cookies[REFRESH_COOKIE_NAME] ||
    req.body?.refreshToken ||
    null
  );
};

const issueSession = async (res, req, user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  await getPrisma().refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  setRefreshCookie(res, refreshToken, user.role);

  return {
    accessToken,
    refreshToken,
    user: formatUser(user),
  };
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const prisma = getPrisma();
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        passwordHash,
        role: "CUSTOMER",
      },
      select: selectSafeUser,
    });

    const session = await issueSession(res, req, user);
    return res.status(201).json({
      message: "Account created successfully.",
      ...session,
    });
  } catch (error) {
    return next(error);
  }
};

const loginWithRole = (requiredRole) => async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.status !== "ACTIVE") {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (requiredRole && user.role !== requiredRole) {
      return res.status(403).json({ message: "This account cannot use this login." });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const safeUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: selectSafeUser,
    });

    const session = await issueSession(res, req, safeUser);
    return res.status(200).json({
      message: "Logged in successfully.",
      ...session,
    });
  } catch (error) {
    return next(error);
  }
};

const refreshWithRole = (requiredRole = "CUSTOMER") => async (req, res, next) => {
  try {
    const refreshToken = getRefreshTokenFromRequest(req, requiredRole);

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token is required." });
    }

    const prisma = getPrisma();
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        tokenHash: hashToken(refreshToken),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (
      !storedToken ||
      storedToken.user.status !== "ACTIVE" ||
      storedToken.user.role !== requiredRole
    ) {
      clearRefreshCookie(res, requiredRole);
      return res.status(401).json({ message: "Invalid refresh token." });
    }

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const safeUser = await prisma.user.findUnique({
      where: { id: storedToken.userId },
      select: selectSafeUser,
    });

    const session = await issueSession(res, req, safeUser);
    return res.status(200).json({
      message: "Session refreshed.",
      ...session,
    });
  } catch (error) {
    return next(error);
  }
};

const logoutWithRole = (requiredRole = "CUSTOMER") => async (req, res, next) => {
  try {
    const refreshToken = getRefreshTokenFromRequest(req, requiredRole);

    if (refreshToken) {
      await getPrisma().refreshToken.updateMany({
        where: {
          tokenHash: hashToken(refreshToken),
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    }

    clearRefreshCookie(res, requiredRole);
    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    return next(error);
  }
};

const me = async (req, res) =>
  res.status(200).json({
    user: formatUser(req.user),
  });

const updateProfile = async (req, res, next) => {
  try {
    const data = {};

    if (req.body.name !== undefined) data.name = String(req.body.name).trim();
    if (req.body.phone !== undefined) {
      const phone = String(req.body.phone || "").trim();
      data.phone = phone || null;
    }

    const user = await getPrisma().user.update({
      where: { id: req.user.id },
      data,
      select: selectSafeUser,
    });

    return res.status(200).json({
      message: "Profile updated.",
      user: formatUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordMatches) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.user.id },
        data: { passwordHash },
      }),
      prisma.refreshToken.updateMany({
        where: {
          userId: req.user.id,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      }),
    ]);

    clearRefreshCookie(res, req.user.role);

    return res.status(200).json({
      message: "Password changed. Please sign in again.",
    });
  } catch (error) {
    return next(error);
  }
};

const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { email } });
    const genericMessage = "If the email exists, a password reset OTP has been sent.";

    if (!user || user.status !== "ACTIVE") {
      return res.status(200).json({ message: genericMessage });
    }

    const existing = passwordResetOtps.get(email);
    if (existing && existing.lastSentAt && Date.now() - existing.lastSentAt < RESET_OTP_RESEND_MS) {
      return res.status(429).json({
        message: `Please wait ${Math.ceil((RESET_OTP_RESEND_MS - (Date.now() - existing.lastSentAt)) / 1000)} seconds before requesting another OTP.`,
      });
    }

    const otp = createOtp();
    passwordResetOtps.set(email, {
      otpHash: hashToken(otp),
      expiresAt: Date.now() + RESET_OTP_TTL_MS,
      used: false,
      attempts: 0,
      lastSentAt: Date.now(),
    });

    const emailBody = buildPasswordResetEmail({ name: user.name, otp });
    await sendMail({
      to: user.email,
      subject: emailBody.subject,
      html: emailBody.html,
      text: emailBody.text,
    });

    return res.status(200).json({ message: genericMessage });
  } catch (error) {
    return next(error);
  }
};

const confirmPasswordReset = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    const record = passwordResetOtps.get(email);

    if (!record || record.used) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    if (Date.now() > record.expiresAt) {
      passwordResetOtps.delete(email);
      return res.status(400).json({ message: "OTP has expired. Request a new code." });
    }

    if (record.attempts >= 5) {
      passwordResetOtps.delete(email);
      return res.status(429).json({ message: "Too many invalid OTP attempts. Request a new code." });
    }

    if (hashToken(otp) !== record.otpHash) {
      record.attempts += 1;
      passwordResetOtps.set(email, record);
      return res.status(400).json({ message: "Invalid OTP." });
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.status !== "ACTIVE") {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    passwordResetOtps.set(email, { ...record, used: true });
    return res.status(200).json({ message: "Password reset successfully. Please sign in with your new password." });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  confirmPasswordReset,
  register,
  login: loginWithRole(),
  adminLogin: loginWithRole("ADMIN"),
  refresh: refreshWithRole("CUSTOMER"),
  adminRefresh: refreshWithRole("ADMIN"),
  logout: logoutWithRole("CUSTOMER"),
  adminLogout: logoutWithRole("ADMIN"),
  me,
  requestPasswordReset,
  updateProfile,
  changePassword,
};
