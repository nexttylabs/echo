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

import { describe, expect, it } from "bun:test";
import { runMigrations } from "./migrate";

describe("runMigrations", () => {
  it("throws when database is missing", async () => {
    await expect(runMigrations({ database: null })).rejects.toThrow(
      "Database connection not configured"
    );
  });

  it("calls migrator with default migrations folder", async () => {
    const previousUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "postgres://test";
    let called = false;
    const migrateFn = async (_db: unknown, config: { migrationsFolder: string }) => {
      called = true;
      expect(config.migrationsFolder).toBe("./lib/db/migrations");
    };

    await runMigrations({
      database: {} as unknown,
      migrateFn,
    });

    expect(called).toBe(true);
    if (previousUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousUrl;
    }
  });
});
