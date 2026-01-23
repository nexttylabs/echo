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

/**
 * Migration script to backfill slugs for organizations that don't have one.
 * 
 * Run with: bun run scripts/backfill-org-slugs.ts
 */

import { eq, isNull, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { organizations } from "../lib/db/schema";
import { generateSlug } from "../lib/utils/slug";

const { Pool } = pg;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  console.log("Finding organizations without slugs...");

  // Find all organizations with null or empty slug
  const orgsWithoutSlug = await db
    .select({ id: organizations.id, name: organizations.name, slug: organizations.slug })
    .from(organizations)
    .where(or(isNull(organizations.slug), eq(organizations.slug, "")));

  console.log(`Found ${orgsWithoutSlug.length} organizations without slugs`);

  for (const org of orgsWithoutSlug) {
    let slug = generateSlug(org.name);
    
    // Check for uniqueness
    let counter = 0;
    while (true) {
      const existing = await db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, slug))
        .limit(1);
      if (!existing.length) break;
      counter += 1;
      slug = `${generateSlug(org.name)}-${counter}`;
    }

    // Update the organization
    await db
      .update(organizations)
      .set({ slug })
      .where(eq(organizations.id, org.id));

    console.log(`Updated org "${org.name}" with slug: ${slug}`);
  }

  console.log("Migration complete!");
  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
