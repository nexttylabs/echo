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

import { describe, it, expect } from "bun:test";
import { createLogger, createRequestLogger } from "./logger";

describe("logger", () => {
  it("creates child logger with context", () => {
    const log = createLogger({ component: "test" });
    expect(log.bindings().component).toBe("test");
  });

  it("creates request logger with reqId", () => {
    const log = createRequestLogger("req-123");
    expect(log.bindings().reqId).toBe("req-123");
  });
});
