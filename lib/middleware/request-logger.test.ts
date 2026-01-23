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

import { describe, it, expect } from "bun:test";
import { logRequest, logResponse } from "./request-logger";

describe("request logger", () => {
  it("returns reqId and logger with bindings", () => {
    const req = new Request("http://localhost/api/health", {
      headers: { "x-request-id": "req-123" },
    });

    const { log, reqId } = logRequest(req);

    expect(reqId).toBe("req-123");
    expect(log.bindings().reqId).toBe("req-123");
  });

  it("logs response without throwing", () => {
    expect(() => logResponse("req-123", 200, 12)).not.toThrow();
  });
});
