import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL;

function createMissingDatabaseUrlPrisma(): PrismaClient {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get() {
      throw new Error(
        "Database URL is not defined (set DATABASE_URL or POSTGRES_PRISMA_URL/POSTGRES_URL_NON_POOLING/POSTGRES_URL)"
      );
    },
  };

  return new Proxy({}, handler) as unknown as PrismaClient;
}

export const prisma =
  globalForPrisma.prisma ??
  (databaseUrl
    ? new PrismaClient({
        adapter: new PrismaPg({ connectionString: databaseUrl }),
        log:
          process.env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
      })
    : createMissingDatabaseUrlPrisma());

if (process.env.NODE_ENV !== "production" && databaseUrl) {
  globalForPrisma.prisma = prisma;
}
