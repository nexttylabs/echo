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

import { logger } from "@/lib/logger";

export function logRequest(req: Request) {
  const reqId = req.headers.get("x-request-id") || "unknown";
  const log = logger.child({ reqId });

  log.info(
    {
      method: req.method,
      url: req.url,
      userAgent: req.headers.get("user-agent"),
      referer: req.headers.get("referer"),
    },
    "Incoming request",
  );

  return { log, reqId };
}

export function logResponse(reqId: string, status: number, duration: number) {
  const log = logger.child({ reqId });
  log.info({ status, duration }, "Request completed");
  return log;
}
