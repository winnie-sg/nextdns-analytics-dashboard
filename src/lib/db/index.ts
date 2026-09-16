import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    const databasePath = process.env.DATABASE_PATH || "./data/nextdns.sqlite";
    _db = drizzle({
      connection: {
        source: databasePath,
        create: true,
      },
      schema,
    });

    _db.$client.exec("PRAGMA journal_mode = WAL;");
    _db.$client.exec("PRAGMA foreign_keys = ON;");
    _db.$client.exec("PRAGMA busy_timeout = 5000;");
  }
  return _db;
}

export async function closeDb() {
  if (_db) {
    _db.$client.close();
    _db = null;
  }
}
