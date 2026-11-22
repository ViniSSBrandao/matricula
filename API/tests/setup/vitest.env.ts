import { resolveTestDatabaseUrl } from "./test-db.utils";

const testDatabaseUrl = resolveTestDatabaseUrl();
process.env.DATABASE_URL = testDatabaseUrl;
process.env.NODE_ENV = "test";
