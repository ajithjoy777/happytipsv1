import path from "node:path";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// The DATABASE_URL in .env is "file:./dev.db", which the Prisma CLI resolves
// relative to prisma/schema.prisma — but the Next.js runtime resolves relative
// paths against process.cwd(). Pin the runtime client to the same file explicitly.
const dbPath = path.join(process.cwd(), "prisma", "dev.db");

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: `file:${dbPath}` });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
