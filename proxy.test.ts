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

import { afterAll, describe, it, expect, mock } from "bun:test";
import { NextRequest } from "next/server";
import { PERMISSIONS } from "@/lib/auth/permissions";

const previousDatabaseUrl = process.env.DATABASE_URL;
process.env.DATABASE_URL ??= "postgres://test";

mock.module("@/lib/auth/session", () => ({
  getServerSession: async (req: NextRequest) => {
    const isAuthed = req.headers.get("x-test-auth") === "1";
    if (!isAuthed) return null;
    const role = req.headers.get("x-test-role");
    return role ? { user: { id: "u_test", role } } : { user: { id: "u_test" } };
  },
}));

const { proxy } = await import("./proxy");
const { requirePermission } = await import("@/lib/middleware/rbac");

afterAll(() => {
  if (previousDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = previousDatabaseUrl;
  }
});

describe("proxy", () => {
  it("adds x-request-id to response", async () => {
    const req = new NextRequest("http://localhost/api/health");
    const res = await proxy(req);
    expect(res.headers.get("x-request-id")).toBeTruthy();
  });
});

describe("proxy auth", () => {
  it("redirects unauthenticated users from protected routes", async () => {
    const req = new NextRequest("http://localhost/dashboard");
    const res = await proxy(req);
    expect(res.headers.get("location")).toBe("http://localhost/login");
  });

  it("allows unauthenticated users on public routes", async () => {
    const req = new NextRequest("http://localhost/login");
    const res = await proxy(req);
    expect(res.headers.get("location")).toBeNull();
  });

  it("allows authenticated users on protected routes", async () => {
    const req = new NextRequest("http://localhost/dashboard", {
      headers: { "x-test-auth": "1" },
    });
    const res = await proxy(req);
    expect(res.headers.get("location")).toBeNull();
  });
});

describe("proxy locale cookie", () => {
  it("sets NEXT_LOCALE from Accept-Language when missing", async () => {
    const req = new NextRequest("http://localhost/dashboard", {
      headers: {
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
    });
    const res = await proxy(req);
    expect(res.headers.get("set-cookie")).toContain("NEXT_LOCALE=zh-CN");
  });

  it("does not override existing NEXT_LOCALE cookie", async () => {
    const req = new NextRequest("http://localhost/login", {
      headers: {
        cookie: "NEXT_LOCALE=jp",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
    });
    const res = await proxy(req);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});

describe("rbac requirePermission", () => {
  it("returns 401 when session is missing", async () => {
    const req = new NextRequest("http://localhost/api/secure");
    const res = await requirePermission(PERMISSIONS.CREATE_FEEDBACK, req);
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 401 when role is missing", async () => {
    const req = new NextRequest("http://localhost/api/secure", {
      headers: { "x-test-auth": "1" },
    });
    const res = await requirePermission(PERMISSIONS.CREATE_FEEDBACK, req);
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 403 when role lacks permission", async () => {
    const req = new NextRequest("http://localhost/api/secure", {
      headers: { "x-test-auth": "1", "x-test-role": "customer" },
    });
    const res = await requirePermission(PERMISSIONS.MANAGE_ORG, req);
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Forbidden" });
  });

  it("returns NextResponse.next when permission is allowed", async () => {
    const req = new NextRequest("http://localhost/api/secure", {
      headers: { "x-test-auth": "1", "x-test-role": "admin" },
    });
    const res = await requirePermission(PERMISSIONS.MANAGE_ORG, req);
    expect(res.status).toBe(200);
  });
});
