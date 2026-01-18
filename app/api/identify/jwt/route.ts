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

import { parseJwtIdentity } from "@/lib/auth/jwt-identity";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const token = body.token as string;
  const identity = parseJwtIdentity(token);
  if (!identity) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }
  return NextResponse.json(identity);
}
