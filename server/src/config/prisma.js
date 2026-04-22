require("dotenv").config();

let prisma;

const getPrisma = () => {
  if (!prisma) {
    const { PrismaClient } = require("@prisma/client");
    const { PrismaPg } = require("@prisma/adapter-pg");

    const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL or DIRECT_URL is required for Prisma Client.");
    }

    const adapter = new PrismaPg({ connectionString });

    prisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  return prisma;
};

const connectPrisma = async () => {
  await getPrisma().$connect();
};

const disconnectPrisma = async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
};

module.exports = {
  getPrisma,
  connectPrisma,
  disconnectPrisma,
};
