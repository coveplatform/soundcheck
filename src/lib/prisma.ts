import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createMissingDatabaseUrlPrisma(): PrismaClient {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get() {
      throw new Error("DATABASE_URL is not defined");
    },
  };

  return new Proxy({}, handler) as unknown as PrismaClient;
}

export const prisma =
  globalForPrisma.prisma ??
  (process.env.DATABASE_URL
    ? new PrismaClient({
        adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
        log:
          process.env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
      })
    : createMissingDatabaseUrlPrisma());

if (process.env.NODE_ENV !== "production" && process.env.DATABASE_URL) {
  globalForPrisma.prisma = prisma;
}
