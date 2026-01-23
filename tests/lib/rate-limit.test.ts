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

import { describe, expect, it, beforeEach } from 'bun:test';
import { NextRequest } from 'next/server';
import {
  rateLimit,
  clearMemoryStore,
  RateLimitConfig,
} from '@/lib/middleware/rate-limit';

function createMockRequest(url = 'http://localhost:3000/api/test'): NextRequest {
  return new NextRequest(url);
}

describe('Rate Limiter', () => {
  beforeEach(() => {
    clearMemoryStore();
  });

  it('should allow requests within limit', async () => {
    const config: RateLimitConfig = {
      windowMs: 10,
      maxRequests: 5,
      keyGenerator: () => 'test-key-1',
    };

    const req = createMockRequest();

    for (let i = 0; i < 5; i++) {
      const result = await rateLimit(req, config);
      expect(result.result.allowed).toBe(true);
      expect(result.response).toBeUndefined();
    }
  });

  it('should block requests exceeding limit', async () => {
    const config: RateLimitConfig = {
      windowMs: 10,
      maxRequests: 2,
      keyGenerator: () => 'test-key-2',
    };

    const req = createMockRequest();

    await rateLimit(req, config);
    await rateLimit(req, config);

    const result = await rateLimit(req, config);
    expect(result.result.allowed).toBe(false);
    expect(result.response).toBeDefined();
    expect(result.response!.status).toBe(429);
  });

  it('should return correct remaining count', async () => {
    const config: RateLimitConfig = {
      windowMs: 10,
      maxRequests: 5,
      keyGenerator: () => 'test-key-3',
    };

    const req = createMockRequest();

    const result1 = await rateLimit(req, config);
    expect(result1.result.remaining).toBe(4);

    const result2 = await rateLimit(req, config);
    expect(result2.result.remaining).toBe(3);

    const result3 = await rateLimit(req, config);
    expect(result3.result.remaining).toBe(2);
  });

  it('should include rate limit headers in 429 response', async () => {
    const config: RateLimitConfig = {
      windowMs: 60,
      maxRequests: 1,
      keyGenerator: () => 'test-key-4',
    };

    const req = createMockRequest();

    await rateLimit(req, config);
    const result = await rateLimit(req, config);

    expect(result.response).toBeDefined();
    expect(result.response!.headers.get('X-RateLimit-Limit')).toBe('1');
    expect(result.response!.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(result.response!.headers.get('X-RateLimit-Reset')).toBeTruthy();
    expect(result.response!.headers.get('Retry-After')).toBeTruthy();
  });

  it('should use different limits for different keys', async () => {
    let keyValue = 'key-a';
    const config: RateLimitConfig = {
      windowMs: 60,
      maxRequests: 2,
      keyGenerator: () => keyValue,
    };

    const req = createMockRequest();

    await rateLimit(req, config);
    await rateLimit(req, config);
    const resultA = await rateLimit(req, config);
    expect(resultA.result.allowed).toBe(false);

    keyValue = 'key-b';
    const resultB = await rateLimit(req, config);
    expect(resultB.result.allowed).toBe(true);
  });

  it('should support async key generator', async () => {
    const config: RateLimitConfig = {
      windowMs: 60,
      maxRequests: 2,
      keyGenerator: async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return 'async-key';
      },
    };

    const req = createMockRequest();

    const result = await rateLimit(req, config);
    expect(result.result.allowed).toBe(true);
  });
});
