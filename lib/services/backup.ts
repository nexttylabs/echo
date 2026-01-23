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

import { execSync } from "child_process";
import { readdirSync, statSync, unlinkSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { logger } from "@/lib/logger";

export interface BackupConfig {
  backupDir: string;
  retentionDays: number;
  databaseUrl: string;
}

export interface BackupInfo {
  file: string;
  size: string;
  date: Date;
}

export async function createBackup(config: BackupConfig): Promise<string> {
  const { backupDir, databaseUrl } = config;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const backupFile = join(backupDir, `echo-${timestamp}.sql`);

  logger.info({ backupFile }, "Creating database backup...");

  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }

  try {
    execSync(`pg_dump "${databaseUrl}" > "${backupFile}"`, {
      stdio: "inherit",
    });

    execSync(`gzip "${backupFile}"`, {
      stdio: "inherit",
    });

    const compressedFile = `${backupFile}.gz`;
    const stats = statSync(compressedFile);

    logger.info(
      {
        backupFile: compressedFile,
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
      },
      "Backup created successfully"
    );

    return compressedFile;
  } catch (error) {
    logger.error({ err: error }, "Backup failed");
    throw error;
  }
}

export async function cleanupOldBackups(config: BackupConfig): Promise<number> {
  const { backupDir, retentionDays } = config;
  const now = Date.now();
  const maxAge = retentionDays * 24 * 60 * 60 * 1000;

  let deletedCount = 0;

  try {
    if (!existsSync(backupDir)) {
      return 0;
    }

    const files = readdirSync(backupDir);
    const backupFiles = files.filter(
      (f) => f.startsWith("echo-") && f.endsWith(".sql.gz")
    );

    for (const file of backupFiles) {
      const filePath = join(backupDir, file);
      const stats = statSync(filePath);
      const age = now - stats.mtimeMs;

      if (age > maxAge) {
        unlinkSync(filePath);
        deletedCount++;
        logger.info(
          { file, age: `${Math.floor(age / 86400000)} days` },
          "Deleted old backup"
        );
      }
    }

    if (deletedCount > 0) {
      logger.info({ deletedCount }, "Cleanup completed");
    }

    return deletedCount;
  } catch (error) {
    logger.error({ err: error }, "Cleanup failed");
    return 0;
  }
}

export async function listBackups(config: BackupConfig): Promise<BackupInfo[]> {
  const { backupDir } = config;

  try {
    if (!existsSync(backupDir)) {
      return [];
    }

    const files = readdirSync(backupDir);
    const backupFiles = files.filter(
      (f) => f.startsWith("echo-") && f.endsWith(".sql.gz")
    );

    return backupFiles
      .map((file) => {
        const filePath = join(backupDir, file);
        const stats = statSync(filePath);
        return {
          file,
          size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
          date: stats.mtime,
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  } catch (error) {
    logger.error({ err: error }, "Failed to list backups");
    return [];
  }
}

export async function backupDatabase(config: BackupConfig): Promise<void> {
  logger.info("Starting backup process...");

  try {
    await createBackup(config);
    await cleanupOldBackups(config);

    const backups = await listBackups(config);
    logger.info(
      {
        totalBackups: backups.length,
        backups: backups.slice(0, 5),
      },
      "Backup process completed"
    );
  } catch (error) {
    logger.error({ err: error }, "Backup process failed");
    throw error;
  }
}

export function getBackupConfig(): BackupConfig {
  return {
    backupDir: process.env.BACKUP_DIR || "./backups",
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || "30"),
    databaseUrl: process.env.DATABASE_URL!,
  };
}
