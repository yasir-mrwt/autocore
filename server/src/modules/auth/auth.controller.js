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

const SALT_ROUNDS = Number(process.env.PASSWORD_SALT_ROUNDS || 12);

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

module.exports = {
  register,
  login: loginWithRole(),
  adminLogin: loginWithRole("ADMIN"),
  refresh: refreshWithRole("CUSTOMER"),
  adminRefresh: refreshWithRole("ADMIN"),
  logout: logoutWithRole("CUSTOMER"),
  adminLogout: logoutWithRole("ADMIN"),
  me,
  updateProfile,
  changePassword,
};
