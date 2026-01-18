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

import { db } from "@/lib/db";
import { tags, PREDEFINED_TAGS } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

async function seedTags() {
  if (!db) {
    throw new Error("Database connection not configured");
  }

  logger.info("Seeding predefined tags...");

  for (const tag of PREDEFINED_TAGS) {
    await db
      .insert(tags)
      .values({
        name: tag.name,
        slug: tag.slug,
        color: "#3b82f6",
      })
      .onConflictDoNothing();
  }

  logger.info(`Seeded ${PREDEFINED_TAGS.length} tags successfully`);
}

seedTags()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error(error, "Failed to seed tags");
    process.exit(1);
  });
