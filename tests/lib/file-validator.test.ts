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
import { MAX_FILE_SIZE, validateFile } from "@/lib/upload/file-validator";

describe("validateFile", () => {
  it("rejects files over max size", () => {
    const file = new File([new ArrayBuffer(MAX_FILE_SIZE + 1)], "big.png", {
      type: "image/png",
    });

    const result = validateFile(file);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe("FILE_TOO_LARGE");
    }
  });

  it("rejects unsupported types", () => {
    const file = new File(["hello"], "note.txt", { type: "text/plain" });
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe("INVALID_FILE_TYPE");
    }
  });

  it("accepts allowed types within size", () => {
    const file = new File(["data"], "image.png", { type: "image/png" });
    const result = validateFile(file);
    expect(result.valid).toBe(true);
  });
});
