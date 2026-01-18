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

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { hasPermission, PERMISSIONS, type UserRole } from "@/lib/auth/permissions";
import {
  backupDatabase,
  listBackups,
  getBackupConfig,
} from "@/lib/services/backup";
import { apiError } from "@/lib/api/errors";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as { role: UserRole }).role;
    if (!role || !hasPermission(role, PERMISSIONS.BACKUP_CREATE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const config = getBackupConfig();

    backupDatabase(config).catch(console.error);

    return NextResponse.json({
      success: true,
      message: "Backup started",
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as { role: UserRole }).role;
    if (!role || !hasPermission(role, PERMISSIONS.BACKUP_VIEW)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const config = getBackupConfig();
    const backups = await listBackups(config);

    return NextResponse.json({ backups });
  } catch (error) {
    return apiError(error);
  }
}
