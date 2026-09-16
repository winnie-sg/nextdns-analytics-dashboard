import { getDb } from "./index";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { createLogger } from "@/lib/logger";

const log = createLogger("db");

export async function runMigrations() {
  const db = getDb();
  migrate(db, { migrationsFolder: "./drizzle" });
  log.info("Migrations complete");
}
