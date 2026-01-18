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

import { NextResponse } from "next/server";
import { attachments } from "@/lib/db/schema";
import { apiError, validationError } from "@/lib/api/errors";
import type { FileValidationResult } from "@/lib/upload/file-validator";
import type { db as database } from "@/lib/db";

type Database = NonNullable<typeof database>;

type UploadDeps = {
  db: {
    insert: Database["insert"];
  };
  validateFile: (file: File) => FileValidationResult;
  saveFile: (file: File) => Promise<{ fileName: string; filePath: string; fullPath: string }>;
};

export function buildUploadHandler(deps: UploadDeps) {
  return async function POST(req: Request) {
    try {
      const formData = await req.formData();
      const feedbackIdRaw = formData.get("feedbackId");
      const feedbackId = Number(feedbackIdRaw);

      if (!feedbackIdRaw || Number.isNaN(feedbackId)) {
        return validationError(undefined, "feedbackId is required");
      }

      const files = formData.getAll("files").filter(Boolean) as File[];

      if (!files.length) {
        return validationError(undefined, "No files provided");
      }

      const validationResults = files.map(deps.validateFile);
      const invalid = validationResults.filter((result) => !result.valid);
      if (invalid.length) {
        return validationError(invalid, "Validation failed");
      }

      const saved = await Promise.all(
        files.map(async (file) => {
          const stored = await deps.saveFile(file);
          const [attachment] = await deps.db
            .insert(attachments)
            .values({
              feedbackId,
              fileName: stored.fileName,
              filePath: stored.filePath,
              fileSize: file.size,
              mimeType: file.type,
            })
            .returning();
          return attachment;
        }),
      );

      return NextResponse.json({ data: saved }, { status: 201 });
    } catch (error) {
      return apiError(error);
    }
  };
}
