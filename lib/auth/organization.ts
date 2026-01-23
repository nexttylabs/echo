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

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import type { db as database } from "@/lib/db";
import { organizationMembers, organizations } from "@/lib/db/schema";
import type { UserRole } from "@/lib/auth/permissions";

type Database = NonNullable<typeof database>;

export interface UserOrganization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  role: string;
}

export async function getUserOrganizations(
  db: Database,
  userId: string
): Promise<UserOrganization[]> {
  return db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      description: organizations.description,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
    .where(eq(organizationMembers.userId, userId));
}

export async function getUserOrganization(
  db: Database,
  userId: string
): Promise<UserOrganization | null> {
  const result = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      description: organizations.description,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
    .where(eq(organizationMembers.userId, userId))
    .limit(1);

  return result[0] || null;
}

export interface OrganizationMember {
  organizationId: string;
  userId: string;
  role: string;
}

type MinimalDb = {
  select: Database["select"];
};

export async function assertOrganizationAccess(
  db: MinimalDb,
  userId: string,
  organizationId: string
): Promise<OrganizationMember> {
  const [member] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId)
      )
    )
    .limit(1);

  if (!member) {
    throw new Error("Access denied");
  }

  return member;
}

export async function getCurrentOrganizationId(userId: string): Promise<string | null> {
  if (!db) return null;
  const org = await getUserOrganization(db, userId);
  return org?.id || null;
}

export async function getUserRoleInOrganization(
  db: Database,
  userId: string,
  organizationId: string
): Promise<UserRole | null> {
  const [member] = await db
    .select({ role: organizationMembers.role })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId)
      )
    )
    .limit(1);

  return (member?.role as UserRole) || null;
}
