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
import { buildUploadHandler } from "@/app/api/upload/handler";
import { attachments } from "@/lib/db/schema";

const makeDeps = () => {
  const inserted: Record<string, unknown>[] = [];
  const db = {
    insert: (table?: unknown) => ({
      values: (values: Record<string, unknown>) => {
        if (table === attachments) {
          inserted.push(values);
        }
        return {
          returning: async () => [
            {
              attachmentId: 1,
              ...values,
              createdAt: new Date(),
            },
          ],
        };
      },
    }),
  };

  const saveFile = async (file: File) => ({
    fileName: file.name,
    filePath: `uploads/${file.name}`,
    fullPath: `/tmp/${file.name}`,
  });

  const validateFile = (file: File) =>
    file.type === "text/plain"
      ? { valid: false, error: "不支持的文件类型", code: "INVALID_FILE_TYPE" as const }
      : { valid: true, mimeType: file.type as "image/png" };

  return { db, saveFile, validateFile, inserted };
};

describe("POST /api/upload", () => {
  it("rejects invalid file types", async () => {
    const deps = makeDeps();
    deps.validateFile = () => ({
      valid: false,
      error: "不支持的文件类型",
      code: "INVALID_FILE_TYPE",
    });
    const handler = buildUploadHandler(deps);

    const form = new FormData();
    form.append("files", new File(["x"], "bad.txt", { type: "text/plain" }));
    form.append("feedbackId", "1");

    const res = await handler(
      new Request("http://localhost/api/upload", {
        method: "POST",
        body: form,
      }),
    );

    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.code).toBe("VALIDATION_ERROR");
  });

  it("uploads valid files", async () => {
    const deps = makeDeps();
    const handler = buildUploadHandler(deps);

    const form = new FormData();
    form.append("files", new File(["x"], "good.png", { type: "image/png" }));
    form.append("feedbackId", "1");

    const res = await handler(
      new Request("http://localhost/api/upload", {
        method: "POST",
        body: form,
      }),
    );

    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.data[0].attachmentId).toBe(1);
    expect(deps.inserted.length).toBe(1);
  });
});
