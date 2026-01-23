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
import { rateLimit, RateLimitConfig } from '@/lib/middleware/rate-limit';
import { RATE_LIMITS } from '@/lib/config/rate-limits';

export function withRateLimit(type: keyof typeof RATE_LIMITS) {
  return async (req: NextRequest) => {
    const config = RATE_LIMITS[type];
    return rateLimit(req, config);
  };
}

export function withCustomRateLimit(config: RateLimitConfig) {
  return async (req: NextRequest) => {
    return rateLimit(req, config);
  };
}
