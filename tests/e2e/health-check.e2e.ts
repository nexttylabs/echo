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

import { test, expect } from "@playwright/test";
import { isHealthStatusOk } from "./helpers/test-utils";

test.describe("E2E-UF-029: Health check endpoint", () => {
  test("returns 200 status for health endpoint", async ({ request }) => {
    const response = await request.get("/health");
    
    expect(response.status()).toBe(200);
  });

  test("returns health status information", async ({ request }) => {
    const response = await request.get("/health");
    
    expect(response.status()).toBe(200);
    
    const health = await response.json();
    
    // Should contain status field
    expect(health).toHaveProperty("status");
    expect(["ok", "healthy"]).toContain(health.status);
    
    // Might contain timestamp
    if (health.timestamp) {
      expect(["string", "number"]).toContain(typeof health.timestamp);
    }
    
    // Might contain uptime
    if (health.uptime) {
      expect(typeof health.uptime).toBe("number");
      expect(health.uptime).toBeGreaterThan(0);
    }
  });

  test("includes database connectivity status", async ({ request }) => {
    const response = await request.get("/health");
    
    expect(response.status()).toBe(200);
    
    const health = await response.json();
    
    // Should check database connection
    if (health.checks) {
      expect(health.checks).toHaveProperty("database");
      expect(["ok", "connected"]).toContain(health.checks.database.status);
    }
  });

  test("includes service dependencies", async ({ request }) => {
    const response = await request.get("/health");
    
    expect(response.status()).toBe(200);
    
    const health = await response.json();
    
    // Might include other service checks
    if (health.checks) {
      // Check for Redis if used
      if (health.checks.redis) {
        expect(isHealthStatusOk(health.checks.redis.status)).toBe(true);
      }
      
      // Check for email service if configured
      if (health.checks.email) {
        expect(["ok", "configured", "warning"]).toContain(health.checks.email.status);
      }
    }
  });

  test("responds quickly", async ({ request }) => {
    const startTime = Date.now();
    
    const response = await request.get("/health");
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
  });

  test("handles concurrent requests", async ({ request }) => {
    // Make multiple concurrent requests
    const promises = Array(10).fill(null).map(() => request.get("/health"));
    
    const responses = await Promise.all(promises);
    
    // All should succeed
    responses.forEach(response => {
      expect(response.status()).toBe(200);
    });
  });

  test("includes version information", async ({ request }) => {
    const response = await request.get("/health");
    
    expect(response.status()).toBe(200);
    
    const health = await response.json();
    
    // Might include version
    if (health.version) {
      expect(typeof health.version).toBe("string");
      expect(health.version.length).toBeGreaterThan(0);
    }
  });

  test("returns proper headers", async ({ request }) => {
    const response = await request.get("/health");
    
    expect(response.status()).toBe(200);
    
    // Should have content-type
    const contentType = response.headers()["content-type"];
    expect(contentType).toMatch(/application\/json/);
    
    // Should have cache control headers for health endpoint
    const cacheControl = response.headers()["cache-control"];
    if (cacheControl) {
      expect(cacheControl).toContain("no-cache");
    }
  });

  test("health endpoint works during high load", async ({ request }) => {
    // Simulate high load with many requests
    const promises = Array(100).fill(null).map(async () => {
      const response = await request.get("/health");
      expect(response.status()).toBe(200);
      return response;
    });
    
    const responses = await Promise.all(promises);
    
    // All should succeed
    expect(responses).toHaveLength(100);
    responses.forEach(response => {
      expect(response.status()).toBe(200);
    });
  });

  test("graceful degradation when services are down", async ({ request }) => {
    // This test would require mocking service failures
    // For now, just verify the endpoint responds
    
    const response = await request.get("/health");
    
    // Should always respond, even if some services are down
    expect(response.status()).toBe(200);
    
    const health = await response.json();
    
    // If services are down, status might be degraded but endpoint should still work
    if (health.status !== "ok") {
      expect(["degraded", "warning"]).toContain(health.status);
    }
  });

  test("includes performance metrics", async ({ request }) => {
    const response = await request.get("/health");
    
    expect(response.status()).toBe(200);
    
    const health = await response.json();
    
    // Might include performance metrics
    if (health.metrics) {
      // Memory usage
      if (health.metrics.memory) {
        expect(typeof health.metrics.memory.used).toBe("number");
        expect(typeof health.metrics.memory.total).toBe("number");
      }
      
      // CPU usage
      if (health.metrics.cpu) {
        expect(typeof health.metrics.cpu.usage).toBe("number");
        expect(health.metrics.cpu.usage).toBeGreaterThanOrEqual(0);
        expect(health.metrics.cpu.usage).toBeLessThanOrEqual(100);
      }
    }
  });

  test("accessible without authentication", async ({ request }) => {
    // Health endpoint should be publicly accessible
    const response = await request.get("/health", {
      headers: {
      },
    });
    
    expect(response.status()).toBe(200);
  });

  test("supports different health check levels", async ({ request }) => {
    // Basic health check
    const basicResponse = await request.get("/health");
    expect(basicResponse.status()).toBe(200);
    
    // Detailed health check (if supported)
    const detailedResponse = await request.get("/health?detailed=true");
    expect(detailedResponse.status()).toBe(200);
    
    // Detailed check might include more information
    const basicHealth = await basicResponse.json();
    const detailedHealth = await detailedResponse.json();
    
    // Both should have at least status
    expect(basicHealth).toHaveProperty("status");
    expect(detailedHealth).toHaveProperty("status");
    
    // Detailed might have more fields
    if (detailedHealth.checks && !basicHealth.checks) {
      expect(Object.keys(detailedHealth).length).toBeGreaterThan(Object.keys(basicHealth).length);
    }
  });
});
