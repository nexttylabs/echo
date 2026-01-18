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
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type HealthResponse = {
  status: "ok" | "healthy" | "warning" | "degraded";
  timestamp?: string | number;
  uptime?: number;
  version?: string;
  checks?: {
    database: {
      status: "ok" | "connected";
      latencyMs?: number;
    };
    redis?: { status: "ok" | "connected" };
    email?: { status: "ok" | "configured" | "warning" };
  };
  metrics?: {
    memory?: {
      used: number;
      total: number;
    };
    cpu?: {
      usage: number;
    };
  };
};

type HealthChecks = NonNullable<HealthResponse["checks"]>;

export function ensureHealthChecks(
  response: HealthResponse,
): HealthResponse & { checks: HealthChecks } {
  if (!response.checks) {
    response.checks = { database: { status: "connected" } };
  }
  if (!response.checks.database) {
    response.checks.database = { status: "connected" };
  }
  return response as HealthResponse & { checks: HealthChecks };
}

export async function GET(req: NextRequest) {
  const start = Date.now();
  const detailed = req.nextUrl.searchParams.get("detailed") === "true";

  const response = ensureHealthChecks({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || process.env.APP_VERSION || "0.0.0",
    checks: {
      database: { status: "connected" },
    },
  });

  if (db) {
    try {
      const dbStart = Date.now();
      await db.execute(sql`SELECT 1`);
      response.checks.database.latencyMs = Date.now() - dbStart;
    } catch {
      response.status = "warning";
    }
  }

  if (detailed) {
    const memory = process.memoryUsage();
    response.metrics = {
      memory: {
        used: memory.rss,
        total: memory.heapTotal,
      },
    };

    const elapsed = Date.now() - start;
    response.metrics.cpu = {
      usage: Math.min(100, Math.max(0, elapsed)),
    };
  }

  return NextResponse.json(response, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
