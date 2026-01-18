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

export function ipKeyGenerator(req: NextRequest): string {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  return `ip:${ip}`;
}

export function apiKeyKeyGenerator(req: NextRequest): string {
  const apiKey =
    req.headers.get('X-API-Key') ||
    req.headers.get('Authorization')?.replace('Bearer ', '');
  return apiKey ? `apikey:${apiKey}` : ipKeyGenerator(req);
}

export function userKeyGenerator(req: NextRequest): string {
  const session = req.headers.get('x-session');
  return session ? `user:${session}` : ipKeyGenerator(req);
}

export function endpointKeyGenerator(
  req: NextRequest,
  endpoint: string
): string {
  const apiKey = req.headers.get('X-API-Key');
  const key = apiKey ? `apikey:${apiKey}` : ipKeyGenerator(req);
  return `${key}:${endpoint}`;
}
