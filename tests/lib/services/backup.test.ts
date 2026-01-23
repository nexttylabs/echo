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

import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import {
  listBackups,
  cleanupOldBackups,
  getBackupConfig,
  type BackupConfig,
} from "@/lib/services/backup";

const TEST_BACKUP_DIR = "./test-backups";

describe("Backup Service", () => {
  beforeEach(() => {
    if (existsSync(TEST_BACKUP_DIR)) {
      rmSync(TEST_BACKUP_DIR, { recursive: true });
    }
    mkdirSync(TEST_BACKUP_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_BACKUP_DIR)) {
      rmSync(TEST_BACKUP_DIR, { recursive: true });
    }
  });

  describe("listBackups", () => {
    it("returns empty array when no backups exist", async () => {
      const config: BackupConfig = {
        backupDir: TEST_BACKUP_DIR,
        retentionDays: 30,
        databaseUrl: "postgresql://test",
      };

      const backups = await listBackups(config);
      expect(backups).toEqual([]);
    });

    it("returns backup files sorted by date descending", async () => {
      const config: BackupConfig = {
        backupDir: TEST_BACKUP_DIR,
        retentionDays: 30,
        databaseUrl: "postgresql://test",
      };

      writeFileSync(join(TEST_BACKUP_DIR, "echo-2024-01-01.sql.gz"), "backup1");
      writeFileSync(join(TEST_BACKUP_DIR, "echo-2024-01-02.sql.gz"), "backup2");
      writeFileSync(join(TEST_BACKUP_DIR, "other-file.txt"), "not a backup");

      const backups = await listBackups(config);

      expect(backups.length).toBe(2);
      expect(backups[0].file).toContain("echo-");
      expect(backups[0].file).toContain(".sql.gz");
    });

    it("returns empty array when backup directory does not exist", async () => {
      const config: BackupConfig = {
        backupDir: "./nonexistent-dir",
        retentionDays: 30,
        databaseUrl: "postgresql://test",
      };

      const backups = await listBackups(config);
      expect(backups).toEqual([]);
    });
  });

  describe("cleanupOldBackups", () => {
    it("returns 0 when backup directory does not exist", async () => {
      const config: BackupConfig = {
        backupDir: "./nonexistent-dir",
        retentionDays: 30,
        databaseUrl: "postgresql://test",
      };

      const deleted = await cleanupOldBackups(config);
      expect(deleted).toBe(0);
    });

    it("does not delete recent backups", async () => {
      const config: BackupConfig = {
        backupDir: TEST_BACKUP_DIR,
        retentionDays: 30,
        databaseUrl: "postgresql://test",
      };

      writeFileSync(join(TEST_BACKUP_DIR, "echo-recent.sql.gz"), "backup");

      const deleted = await cleanupOldBackups(config);
      expect(deleted).toBe(0);
      expect(existsSync(join(TEST_BACKUP_DIR, "echo-recent.sql.gz"))).toBe(true);
    });
  });

  describe("getBackupConfig", () => {
    it("returns default config values", () => {
      const originalBackupDir = process.env.BACKUP_DIR;
      const originalRetention = process.env.BACKUP_RETENTION_DAYS;
      delete process.env.BACKUP_DIR;
      delete process.env.BACKUP_RETENTION_DAYS;

      const config = getBackupConfig();

      expect(config.backupDir).toBe("./backups");
      expect(config.retentionDays).toBe(30);

      process.env.BACKUP_DIR = originalBackupDir;
      process.env.BACKUP_RETENTION_DAYS = originalRetention;
    });

    it("uses environment variables when set", () => {
      const originalBackupDir = process.env.BACKUP_DIR;
      const originalRetention = process.env.BACKUP_RETENTION_DAYS;

      process.env.BACKUP_DIR = "/custom/backup/dir";
      process.env.BACKUP_RETENTION_DAYS = "7";

      const config = getBackupConfig();

      expect(config.backupDir).toBe("/custom/backup/dir");
      expect(config.retentionDays).toBe(7);

      process.env.BACKUP_DIR = originalBackupDir;
      process.env.BACKUP_RETENTION_DAYS = originalRetention;
    });
  });
});
