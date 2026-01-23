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

import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator: (req: NextRequest) => string | Promise<string>;
  skipFailedRequests?: boolean;
  storage?: RateLimitStorage;
}

export interface RateLimitStorage {
  get(key: string): Promise<RateLimitEntry | null>;
  set(key: string, value: RateLimitEntry): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  limit: number;
}

export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig
): Promise<{ result: RateLimitResult; response?: Response }> {
  const key = await config.keyGenerator(req);
  const now = Date.now();
  const windowStart = now - config.windowMs * 1000;

  const storage = config.storage || createMemoryStorage();

  let entry = await storage.get(key);

  if (!entry || entry.resetAt < windowStart) {
    entry = {
      count: 1,
      resetAt: now + config.windowMs * 1000,
    };
    await storage.set(key, entry);
  } else {
    entry.count++;
    await storage.set(key, entry);
  }

  const result: RateLimitResult = {
    allowed: entry.count <= config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt: new Date(entry.resetAt).toISOString(),
    limit: config.maxRequests,
  };

  if (!result.allowed) {
    const response = new Response(
      JSON.stringify({
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetAt,
          'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
        },
      }
    );

    return { result, response };
  }

  return { result };
}

function createMemoryStorage(): RateLimitStorage {
  return {
    async get(key: string) {
      return memoryStore.get(key) || null;
    },
    async set(key: string, value: RateLimitEntry) {
      memoryStore.set(key, value);

      setTimeout(() => {
        if (memoryStore.get(key)?.resetAt === value.resetAt) {
          memoryStore.delete(key);
        }
      }, value.resetAt - Date.now());
    },
    async delete(key: string) {
      memoryStore.delete(key);
    },
  };
}

export function createRedisStorage(redisClient: {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<void>;
  del(key: string): Promise<void>;
}): RateLimitStorage {
  return {
    async get(key: string) {
      const data = await redisClient.get(`ratelimit:${key}`);
      return data ? JSON.parse(data) : null;
    },
    async set(key: string, value: RateLimitEntry) {
      await redisClient.setex(
        `ratelimit:${key}`,
        Math.ceil((value.resetAt - Date.now()) / 1000),
        JSON.stringify(value)
      );
    },
    async delete(key: string) {
      await redisClient.del(`ratelimit:${key}`);
    },
  };
}

export function clearMemoryStore() {
  memoryStore.clear();
}
