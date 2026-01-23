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
import { buildUploadHandler } from "./handler";
import { db } from "@/lib/db";
import { saveFile } from "@/lib/upload/storage";
import { validateFile } from "@/lib/upload/file-validator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured", code: "DATABASE_NOT_CONFIGURED" },
      { status: 500 },
    );
  }

  const handler = buildUploadHandler({ db, saveFile, validateFile });
  return handler(req);
}
