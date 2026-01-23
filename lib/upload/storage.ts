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

import { mkdir, unlink, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import { join } from "path";

export interface StoredFile {
  fileName: string;
  filePath: string;
  fullPath: string;
}

export function generateUniqueFileName(originalName: string): string {
  const ext = originalName.split(".").pop() ?? "";
  const uuid = randomUUID();
  return ext ? `${uuid}.${ext}` : uuid;
}

export async function saveFile(
  file: File,
  uploadDir: string = "public/uploads",
): Promise<StoredFile> {
  await mkdir(uploadDir, { recursive: true });

  const uniqueFileName = generateUniqueFileName(file.name);
  const fullPath = join(uploadDir, uniqueFileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buffer);

  return {
    fileName: file.name,
    filePath: fullPath.replace(/^public\//, ""),
    fullPath,
  };
}

export async function deleteFile(fullPath: string): Promise<void> {
  try {
    await unlink(fullPath);
  } catch (error) {
    console.error("Failed to delete file:", fullPath, error);
  }
}
