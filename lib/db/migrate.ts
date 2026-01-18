/*
 * Copyright (c) 2026 Echo Team
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

type Database = NonNullable<typeof db>;

type RunMigrationsOptions = {
  database?: Database | null;
  migrateFn?: typeof migrate;
  migrationsFolder?: string;
};

export async function runMigrations(options: RunMigrationsOptions = {}) {
  const database = options.database === undefined ? db : options.database;
  const migrateFn = options.migrateFn ?? migrate;
  const migrationsFolder = options.migrationsFolder ?? "./lib/db/migrations";

  if (!database || !process.env.DATABASE_URL) {
    logger.error("Database connection not configured");
    throw new Error("Database connection not configured");
  }

  logger.info("Running database migrations...");

  try {
    await migrateFn(database, { migrationsFolder });
    logger.info("Migrations completed successfully");
  } catch (error) {
    logger.error({ err: error }, "Migration failed");
    throw error;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((import.meta as any).main) {
  runMigrations()
    .then(() => {
      console.log("✅ Migrations completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration failed:", error);
      process.exit(1);
    });
}
