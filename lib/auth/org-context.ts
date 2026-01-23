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

import { assertOrganizationAccess } from "@/lib/auth/organization";
import type { db as database } from "@/lib/db";

type Database = NonNullable<typeof database>;

type OrgContextSource = "query" | "header" | "cookie" | "explicit";

export type OrgContext = {
  organizationId: string;
  memberRole: string | null;
  source: OrgContextSource;
};

type OrgContextRequest = {
  nextUrl: URL;
  headers: Headers;
  cookies?: { get: (name: string) => { value: string } | undefined };
};

export async function getOrgContext(options: {
  request: OrgContextRequest;
  db: Pick<Database, "select">;
  userId?: string | null;
  organizationId?: string | null;
  requireMembership?: boolean;
}): Promise<OrgContext> {
  const { request, db, userId, organizationId, requireMembership } = options;
  const queryOrgId = request.nextUrl.searchParams.get("organizationId");
  const headerOrgId = request.headers.get("x-organization-id");
  const cookieOrgId = request.cookies?.get("orgId")?.value ?? null;

  const resolved = organizationId || queryOrgId || headerOrgId || cookieOrgId;
  const source: OrgContextSource = organizationId
    ? "explicit"
    : queryOrgId
      ? "query"
      : headerOrgId
        ? "header"
        : "cookie";

  if (!resolved) {
    throw new Error("Missing organization");
  }

  let memberRole: string | null = null;
  if (userId) {
    const member = await assertOrganizationAccess(db, userId, resolved);
    memberRole = member.role;
  } else if (requireMembership) {
    throw new Error("Access denied");
  }

  return { organizationId: resolved, memberRole, source };
}
