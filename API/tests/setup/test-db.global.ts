import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { resolveAdminDatabaseUrl, resolveTestDatabaseUrl } from "./test-db.utils";

/**
 * Garante a existência do banco de testes dedicado e aplica as migrations antes da suíte.
 */
export default async function setup(): Promise<void> {
  const testDatabaseUrl = resolveTestDatabaseUrl();
  const parsed = new URL(testDatabaseUrl);
  const dbName = parsed.pathname.replace(/^\//, "");

  if (!/^[a-zA-Z0-9_]+$/.test(dbName)) {
    throw new Error(`Nome de banco de testes inválido: "${dbName}"`);
  }

  const adminClient = new PrismaClient({
    datasources: {
      db: { url: resolveAdminDatabaseUrl(testDatabaseUrl) },
    },
  });

  try {
    const existing = await adminClient.$queryRawUnsafe<Array<{ exists: boolean }>>(
      `SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = '${dbName}') AS "exists"`,
    );

    if (!existing[0]?.exists) {
      await adminClient.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
    }
  } finally {
    await adminClient.$disconnect();
  }

  execSync("npx prisma migrate deploy", {
    stdio: "pipe",
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl,
    },
  });
}
