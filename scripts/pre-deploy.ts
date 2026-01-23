/*
 * Copyright (c) 2026 Nexttylabs Team
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

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { runMigrations } from "@/lib/db/migrate";
import { logger } from "@/lib/logger";
import { backupDatabase, getBackupConfig } from "@/lib/services/backup";

async function verifyMigrations() {
  if (!db) {
    throw new Error("Database connection not configured");
  }

  const tables = await db.execute(sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);

  const rows = (tables as { rows?: unknown[] }).rows ?? [];
  logger.info({ tables: rows }, "Database tables");

  if (rows.length < 1) {
    throw new Error("Unexpected number of tables, migration may have failed");
  }
}

async function createBackup() {
  logger.info("Creating pre-migration backup...");
  const config = getBackupConfig();
  await backupDatabase(config);
  logger.info("Pre-migration backup completed");
}

async function preDeploy() {
  logger.info("Starting pre-deployment migration...");

  if (!db) {
    throw new Error("Database connection not configured");
  }

  await db.execute(sql`SELECT 1`);

  if (process.env.DB_BACKUP_BEFORE_MIGRATE === "true") {
    await createBackup();
  }

  await runMigrations();
  await verifyMigrations();

  logger.info("Pre-deployment completed successfully");
}

preDeploy()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error({ err: error }, "Pre-deployment failed");
    process.exit(1);
  });
