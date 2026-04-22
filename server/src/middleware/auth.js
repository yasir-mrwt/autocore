const jwt = require("jsonwebtoken");
const { getPrisma } = require("../config/prisma");

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
};

const requireAuth = async (req, res, next) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await getPrisma().user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || user.status !== "ACTIVE") {
      return res.status(401).json({ message: "Invalid or inactive account." });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required." });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You are not allowed to perform this action." });
  }

  return next();
};

const requireAdmin = requireRole("ADMIN");
const requireCustomer = requireRole("CUSTOMER");

module.exports = {
  requireAuth,
  requireRole,
  requireAdmin,
  requireCustomer,
};
