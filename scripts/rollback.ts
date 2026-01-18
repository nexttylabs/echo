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

import { readFileSync } from "fs";
import { join } from "path";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

async function executeRollback(migration: { name: string; hash: string }) {
  const rollbackFile = join(
    process.cwd(),
    "lib/db/migrations",
    `${migration.name}-rollback.sql`
  );

  const rawSql = readFileSync(rollbackFile, "utf8");
  await db!.execute(sql.raw(rawSql));
}

async function rollback(steps = 1) {
  if (!db) {
    throw new Error("Database connection not configured");
  }

  logger.info({ steps }, "Rolling back migrations...");

  const appliedMigrations = await db.execute(sql`
    SELECT * FROM drizzle_migrations
    ORDER BY created_at DESC
    LIMIT ${steps}
  `);

  const rows =
    (appliedMigrations as unknown as {
      rows?: Array<{ name: string; hash: string }>;
    }).rows ?? [];

  for (const migration of rows) {
    logger.info({ migration }, "Rolling back migration");
    await executeRollback(migration);
    await db.execute(sql`
      DELETE FROM drizzle_migrations
      WHERE hash = ${migration.hash}
    `);
    logger.info({ migration: migration.name }, "Rolled back");
  }

  logger.info("Rollback completed");
}

const stepsArg = Number.parseInt(process.argv[2] ?? "1", 10);
rollback(Number.isNaN(stepsArg) ? 1 : stepsArg)
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error({ err: error }, "Rollback failed");
    process.exit(1);
  });
