const express = require("express");
const { getPrisma } = require("../../config/prisma");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "AutoCore API",
    database: "postgresql",
    timestamp: new Date().toISOString(),
  });
});

router.get("/db", async (req, res, next) => {
  try {
    await getPrisma().$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
