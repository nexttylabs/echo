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

import { describe, expect, it } from "bun:test";

describe("Visitor ID Generation", () => {
  it("generates consistent visitor ID from IP and user agent", () => {
    const generateVisitorId = (ip: string, userAgent: string | null): string => {
      const raw = `${ip}-${userAgent || "unknown"}`;
      let hash = 0;
      for (let i = 0; i < raw.length; i++) {
        const char = raw.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(36);
    };

    const visitorId1 = generateVisitorId("192.168.1.1", "Mozilla/5.0");
    const visitorId2 = generateVisitorId("192.168.1.1", "Mozilla/5.0");
    const visitorId3 = generateVisitorId("192.168.1.2", "Mozilla/5.0");

    expect(visitorId1).toBe(visitorId2);
    expect(visitorId1).not.toBe(visitorId3);
  });

  it("handles null user agent", () => {
    const generateVisitorId = (ip: string, userAgent: string | null): string => {
      const raw = `${ip}-${userAgent || "unknown"}`;
      let hash = 0;
      for (let i = 0; i < raw.length; i++) {
        const char = raw.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(36);
    };

    const visitorId = generateVisitorId("192.168.1.1", null);
    expect(typeof visitorId).toBe("string");
    expect(visitorId.length).toBeGreaterThan(0);
  });
});

describe("Client IP Extraction", () => {
  it("extracts IP from x-forwarded-for header", () => {
    const getClientIp = (headers: Headers): string => {
      const forwardedFor = headers.get("x-forwarded-for");
      if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
      }
      const realIp = headers.get("x-real-ip");
      if (realIp) {
        return realIp;
      }
      return headers.get("x-client-ip") || "unknown";
    };

    const headers1 = new Headers({ "x-forwarded-for": "10.0.0.1, 192.168.1.1" });
    expect(getClientIp(headers1)).toBe("10.0.0.1");

    const headers2 = new Headers({ "x-real-ip": "172.16.0.1" });
    expect(getClientIp(headers2)).toBe("172.16.0.1");

    const headers3 = new Headers({});
    expect(getClientIp(headers3)).toBe("unknown");
  });
});
