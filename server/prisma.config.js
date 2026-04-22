require("dotenv").config();
const { defineConfig } = require("prisma/config");

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DIRECT_URL or DATABASE_URL must be set before running Prisma commands.");
}

module.exports = defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    path: "prisma/migrations",
  },
});
