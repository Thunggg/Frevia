import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config({ path: "apps/api/.env" });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
});

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, status: true, isEmailVerified: true },
    take: 10,
  });
  console.log("Users in DB:", users);
  await prisma.$disconnect();
}

main().catch(console.error);
