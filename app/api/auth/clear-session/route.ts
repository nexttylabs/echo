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

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Clear potentially corrupted better-auth session cookies.
 * This is useful when session cookies become invalid due to secret changes
 * or format incompatibilities.
 */
export async function POST() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  const clearedCookies: string[] = [];
  
  for (const cookie of allCookies) {
    if (cookie.name.includes("better-auth") || cookie.name.includes("session")) {
      cookieStore.delete(cookie.name);
      clearedCookies.push(cookie.name);
    }
  }
  
  return NextResponse.json({ 
    success: true, 
    cleared: clearedCookies 
  });
}
