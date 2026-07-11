require("dotenv").config();
const bcrypt = require("bcrypt");
const { getPrisma, disconnectPrisma } = require("../src/config/prisma");

const SALT_ROUNDS = Number(process.env.PASSWORD_SALT_ROUNDS || 12);

const main = async () => {
  const name = process.env.ADMIN_NAME || "AutoCore Admin";
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required to seed an admin.");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const prisma = getPrisma();

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
    create: {
      name,
      email,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  await prisma.refreshToken.updateMany({
    where: {
      userId: admin.id,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  console.log("Admin user ready:", admin);
  console.log("Existing admin refresh sessions revoked. Sign in again with ADMIN_EMAIL and ADMIN_PASSWORD.");
};

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPrisma();
  });
