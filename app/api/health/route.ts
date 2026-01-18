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

import { NextRequest, NextResponse } from "next/server";
import { createRequestLogger } from "@/lib/logger";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface HealthStatus {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  uptime: number;
  version?: string;
  checks: {
    database: {
      status: "pass" | "fail";
      latency?: number;
      error?: string;
    };
  };
}

export async function GET(req: NextRequest) {
  const reqId = req.headers.get("x-request-id") || "unknown";
  const log = createRequestLogger(reqId);
  const startTime = Date.now();

  const health: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || process.env.APP_VERSION || "0.0.0",
    checks: {
      database: { status: "pass" },
    },
  };

  if (!process.env.DATABASE_URL || !db) {
    health.status = "unhealthy";
    health.checks.database = {
      status: "fail",
      error: "DATABASE_URL not set",
    };
  } else {
    try {
      const dbStart = Date.now();
      await db.execute(sql`SELECT 1`);
      const dbLatency = Date.now() - dbStart;
      health.checks.database.latency = dbLatency;

      if (dbLatency > 500) {
        health.status = "degraded";
      }
    } catch (error) {
      health.status = "unhealthy";
      health.checks.database = {
        status: "fail",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  const checkTime = Date.now() - startTime;
  const statusCode = health.status === "unhealthy" ? 503 : 200;

  log.info({ status: health.status, durationMs: checkTime }, "Health check");

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Health-Check-Duration": `${checkTime}ms`,
    },
  });
}
