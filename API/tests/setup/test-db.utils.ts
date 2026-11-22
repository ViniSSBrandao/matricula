import "dotenv/config";

const DEFAULT_TEST_DB_NAME = "matricula_test_db";

/**
 * Resolve a URL do banco dedicado de testes (matricula_test_db),
 * garantindo que os testes nunca alterem o banco principal.
 */
export function resolveTestDatabaseUrl(): string {
  const customUrl = process.env.TEST_DATABASE_URL?.trim();
  if (customUrl) {
    return customUrl;
  }

  const baseUrl =
    process.env.DATABASE_URL?.trim() ||
    "postgresql://postgres:postgres@localhost:5432/matricula_db?schema=public";

  const parsed = new URL(baseUrl);
  parsed.pathname = `/${DEFAULT_TEST_DB_NAME}`;
  return parsed.toString();
}

/**
 * Resolve a URL do banco administrativo "postgres" para criar o banco de testes se necessário.
 */
export function resolveAdminDatabaseUrl(testDatabaseUrl: string): string {
  const parsed = new URL(testDatabaseUrl);
  parsed.pathname = "/postgres";
  return parsed.toString();
}
