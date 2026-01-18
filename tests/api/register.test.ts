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
import { APIError } from "better-auth/api";
import { buildRegisterHandler } from "@/app/api/auth/register/handler";

type FakeDeps = Parameters<typeof buildRegisterHandler>[0];

const makeDeps = () => {
  const auth: FakeDeps["auth"] = {
    api: {
      signUpEmail: async () => ({
        headers: new Headers({
          "set-cookie": "session=token; Path=/; HttpOnly",
        }),
        response: {
          token: "token",
          user: { id: "user_1", email: "john@example.com", name: "John" },
        },
      }),
    },
  };

  const db: FakeDeps["db"] = {
    transaction: async (fn) =>
      fn({
        insert: () => ({ values: () => ({ execute: async () => {} }) }),
      }),
    delete: () => ({ where: () => ({ execute: async () => {} }) }),
  };

  return { auth, db } satisfies FakeDeps;
};

describe("POST /api/auth/register", () => {
  it("registers a user and sets cookie", async () => {
    const handler = buildRegisterHandler(makeDeps());
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "John",
        email: "john@example.com",
        password: "Password123",
      }),
    });

    const res = await handler(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.user.email).toBe("john@example.com");
    expect(res.headers.get("set-cookie")).toContain("session=");
  });

  it("returns 409 when email exists", async () => {
    const deps = makeDeps();
    deps.auth.api.signUpEmail = async () => {
      throw new APIError("UNPROCESSABLE_ENTITY", {
        message: "User already exists. Use another email.",
      });
    };

    const handler = buildRegisterHandler(deps);
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "John",
        email: "john@example.com",
        password: "Password123",
      }),
    });

    const res = await handler(req);
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.code).toBe("EMAIL_EXISTS");
  });

  it("validates email and password", async () => {
    const handler = buildRegisterHandler(makeDeps());
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "John",
        email: "bad-email",
        password: "weak",
      }),
    });

    const res = await handler(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.code).toBe("VALIDATION_ERROR");
  });
});
