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

import { NextRequest } from 'next/server';
import { RateLimitConfig } from '@/lib/middleware/rate-limit';
import { apiKeyKeyGenerator } from '@/lib/middleware/rate-limit-keys';

export const RATE_LIMITS = {
  public: {
    windowMs: 60 * 15,
    maxRequests: 100,
    keyGenerator: (req: NextRequest) => {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
      return Promise.resolve(`public:${ip}`);
    },
  },

  authenticated: {
    windowMs: 60,
    maxRequests: 60,
    keyGenerator: (req: NextRequest) => {
      const userId = req.headers.get('x-user-id') || 'unknown';
      return Promise.resolve(`user:${userId}`);
    },
  },

  apiKey: {
    windowMs: 60,
    maxRequests: 100,
    keyGenerator: (req: NextRequest) => Promise.resolve(apiKeyKeyGenerator(req)),
  },

  write: {
    windowMs: 60,
    maxRequests: 20,
    keyGenerator: (req: NextRequest) => Promise.resolve(apiKeyKeyGenerator(req)),
  },

  webhook: {
    windowMs: 60,
    maxRequests: 200,
    keyGenerator: (req: NextRequest) => {
      const orgId = req.headers.get('x-organization-id') || 'unknown';
      return Promise.resolve(`webhook:${orgId}`);
    },
  },
} satisfies Record<
  string,
  Omit<RateLimitConfig, 'skipFailedRequests' | 'storage'>
>;
