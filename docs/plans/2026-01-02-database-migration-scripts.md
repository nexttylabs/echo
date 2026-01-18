# Database Migration Scripts Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Drizzle Kit migration tooling, runnable scripts, docs, CI workflow, and a docker-compose migration service.

**Architecture:** Move the database module into `lib/db/` so we can add `schema/` and `migrations/` subfolders, configure Drizzle Kit at repo root, and provide a typed migration runner plus CLI scripts that reuse the logger. Migrations run via `drizzle-orm/bun-sql/migrator` against Bun SQL, with optional pre-deploy checks and manual rollback hooks.

**Tech Stack:** Bun, Drizzle ORM/Kit, Next.js App Router, GitHub Actions, Docker Compose

---

### Task 1: Restructure DB module + schema layout

**Files:**
- Move: `lib/db.ts` → `lib/db/index.ts`
- Create: `lib/db/schema/index.ts`
- Create: `lib/db/migrations/.gitkeep`

**Step 1: Move the DB module**
- Move file to `lib/db/index.ts` without changing exports.

**Step 2: Create empty schema entrypoint**
```ts
// lib/db/schema/index.ts
// Placeholder schema module for Drizzle Kit. Add tables here in future stories.
export {};
```

**Step 3: Add migrations directory placeholder**
- Create `lib/db/migrations/.gitkeep` (empty file).

**Step 4: Run lint**
Run: `bun run lint`
Expected: Same existing warning about `components/component-example.tsx` and no new errors.

**Step 5: Commit**
```bash
git add lib/db/index.ts lib/db/schema/index.ts lib/db/migrations/.gitkeep
# include rename info automatically
git commit -m "chore: restructure db module for migrations"
```

---

### Task 2: Add Drizzle Kit config + package scripts

**Files:**
- Create: `drizzle.config.ts`
- Modify: `package.json`

**Step 1: Add dev dependencies**
Run: `bun add -d drizzle-kit dotenv`
Expected: `drizzle-kit` and `dotenv` added to `devDependencies`.

**Step 2: Create Drizzle config**
```ts
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

export default defineConfig({
  schema: "./lib/db/schema",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

**Step 3: Add db scripts**
Update `package.json` scripts to include:
```json
"db:generate": "drizzle-kit generate:pg",
"db:migrate": "drizzle-kit migrate",
"db:push": "drizzle-kit push:pg",
"db:studio": "drizzle-kit studio",
"db:introspect": "drizzle-kit introspect:pg",
"db:check": "drizzle-kit check"
```

**Step 4: Run lint**
Run: `bun run lint`
Expected: Same existing warning about `components/component-example.tsx` and no new errors.

**Step 5: Commit**
```bash
git add drizzle.config.ts package.json bun.lock

git commit -m "chore: add drizzle kit config and scripts"
```

---

### Task 3: Migration runner with tests (@superpowers:test-driven-development)

**Files:**
- Create: `lib/db/migrate.ts`
- Create: `lib/db/migrate.test.ts`

**Step 1: Write failing tests**
```ts
// lib/db/migrate.test.ts
import { describe, expect, it } from "bun:test";
import { runMigrations } from "./migrate";

describe("runMigrations", () => {
  it("throws when database is missing", async () => {
    await expect(runMigrations({ database: null })).rejects.toThrow(
      "Database connection not configured"
    );
  });

  it("calls migrator with default migrations folder", async () => {
    let called = false;
    const migrateFn = async (_db: unknown, config: { migrationsFolder: string }) => {
      called = true;
      expect(config.migrationsFolder).toBe("./lib/db/migrations");
    };

    await runMigrations({
      database: {} as unknown,
      migrateFn,
    });

    expect(called).toBe(true);
  });
});
```

**Step 2: Run tests to see failure**
Run: `bun test lib/db/migrate.test.ts`
Expected: FAIL (module not found or `runMigrations` not implemented).

**Step 3: Implement migration runner**
```ts
// lib/db/migrate.ts
import { migrate } from "drizzle-orm/bun-sql/migrator";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

type Database = NonNullable<typeof db>;

type RunMigrationsOptions = {
  database?: Database | null;
  migrateFn?: typeof migrate;
  migrationsFolder?: string;
};

export async function runMigrations(options: RunMigrationsOptions = {}) {
  const database = options.database ?? db;
  const migrateFn = options.migrateFn ?? migrate;
  const migrationsFolder = options.migrationsFolder ?? "./lib/db/migrations";

  if (!database || !process.env.DATABASE_URL) {
    logger.error("Database connection not configured");
    throw new Error("Database connection not configured");
  }

  logger.info("Running database migrations...");

  try {
    await migrateFn(database, { migrationsFolder });
    logger.info("Migrations completed successfully");
  } catch (error) {
    logger.error({ err: error }, "Migration failed");
    throw error;
  }
}

if (import.meta.main) {
  runMigrations()
    .then(() => {
      console.log("✅ Migrations completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration failed:", error);
      process.exit(1);
    });
}
```

**Step 4: Run tests to confirm pass**
Run: `bun test lib/db/migrate.test.ts`
Expected: PASS (2 tests).

**Step 5: Commit**
```bash
git add lib/db/migrate.ts lib/db/migrate.test.ts

git commit -m "feat: add migration runner"
```

---

### Task 4: Helper scripts (migration, pre-deploy, rollback)

**Files:**
- Create: `scripts/migration-helper.ts`
- Create: `scripts/pre-deploy.ts`
- Create: `scripts/rollback.ts`

**Step 1: Create migration helper**
```ts
// scripts/migration-helper.ts
import { execSync } from "child_process";
import { logger } from "@/lib/logger";

export function generateMigration(name: string) {
  logger.info({ name }, "Generating migration");
  execSync("bun run db:generate", { stdio: "inherit" });
}

export function applyMigrations() {
  logger.info("Applying migrations...");
  execSync("bun run db:migrate", { stdio: "inherit" });
}

export function pushSchema() {
  logger.info("Pushing schema to database...");
  execSync("bun run db:push", { stdio: "inherit" });
}

export function checkSchema() {
  logger.info("Checking schema consistency...");
  execSync("bun run db:check", { stdio: "inherit" });
}
```

**Step 2: Create pre-deploy script**
```ts
// scripts/pre-deploy.ts
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { runMigrations } from "@/lib/db/migrate";
import { logger } from "@/lib/logger";

async function verifyMigrations() {
  if (!db) {
    throw new Error("Database connection not configured");
  }

  const tables = await db.execute(sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);

  logger.info({ tables: (tables as { rows?: unknown[] }).rows ?? [] }, "Database tables");

  const rowCount = Array.isArray((tables as { rows?: unknown[] }).rows)
    ? (tables as { rows?: unknown[] }).rows!.length
    : 0;

  if (rowCount < 1) {
    throw new Error("Unexpected number of tables, migration may have failed");
  }
}

async function createBackup() {
  // Implemented in Story 8.5
  logger.warn("DB backup step skipped (Story 8.5)");
}

async function preDeploy() {
  logger.info("Starting pre-deployment migration...");

  if (!db) {
    throw new Error("Database connection not configured");
  }

  await db.execute(sql`SELECT 1`);

  if (process.env.DB_BACKUP_BEFORE_MIGRATE === "true") {
    await createBackup();
  }

  await runMigrations();
  await verifyMigrations();

  logger.info("Pre-deployment completed successfully");
}

preDeploy()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error({ err: error }, "Pre-deployment failed");
    process.exit(1);
  });
```

**Step 3: Create rollback script**
```ts
// scripts/rollback.ts
import { readFileSync } from "fs";
import { join } from "path";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

async function executeRollback(migration: { name: string; hash: string }) {
  const rollbackFile = join(
    process.cwd(),
    "lib/db/migrations",
    `${migration.name}-rollback.sql`
  );

  const rawSql = readFileSync(rollbackFile, "utf8");
  await db!.execute(sql.raw(rawSql));
}

async function rollback(steps = 1) {
  if (!db) {
    throw new Error("Database connection not configured");
  }

  logger.info({ steps }, "Rolling back migrations...");

  const appliedMigrations = await db.execute(sql`
    SELECT * FROM drizzle_migrations
    ORDER BY created_at DESC
    LIMIT ${steps}
  `);

  const rows = (appliedMigrations as { rows?: Array<{ name: string; hash: string }> }).rows ?? [];

  for (const migration of rows) {
    logger.info({ migration }, "Rolling back migration");
    await executeRollback(migration);
    await db.execute(sql`
      DELETE FROM drizzle_migrations
      WHERE hash = ${migration.hash}
    `);
    logger.info({ migration: migration.name }, "Rolled back");
  }

  logger.info("Rollback completed");
}

const stepsArg = Number.parseInt(process.argv[2] ?? "1", 10);
rollback(Number.isNaN(stepsArg) ? 1 : stepsArg)
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error({ err: error }, "Rollback failed");
    process.exit(1);
  });
```

**Step 4: Run lint**
Run: `bun run lint`
Expected: Same existing warning about `components/component-example.tsx` and no new errors.

**Step 5: Commit**
```bash
git add scripts/migration-helper.ts scripts/pre-deploy.ts scripts/rollback.ts

git commit -m "feat: add migration helper scripts"
```

---

### Task 5: Migration documentation

**Files:**
- Create: `docs/database-migrations.md`

**Step 1: Write docs**
Include sections: generating migrations, applying migrations (dev vs prod), schema checks, Drizzle Studio, rollback convention, and best practices.

**Step 2: Commit**
```bash
git add docs/database-migrations.md

git commit -m "docs: add database migration guide"
```

---

### Task 6: CI workflow for migrations

**Files:**
- Create: `.github/workflows/migrate.yml`

**Step 1: Add workflow**
```yaml
name: Database Migration

on:
  workflow_dispatch:
  deployment:
    environment: production

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
      - name: Install dependencies
        run: bun install
      - name: Run migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: bun run db:migrate
      - name: Verify migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: bun run db:check
```

**Step 2: Commit**
```bash
git add .github/workflows/migrate.yml

git commit -m "ci: add migration workflow"
```

---

### Task 7: Docker compose migration service

**Files:**
- Create or Modify: `docker-compose.yml`

**Step 1: Add migrate service**
If `docker-compose.yml` does not exist, create a minimal file with `postgres` + `migrate`:
```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-echo}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme}
      POSTGRES_DB: ${POSTGRES_DB:-echo}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-echo} -d ${POSTGRES_DB:-echo}"]
      interval: 10s
      timeout: 5s
      retries: 5
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - echo-network

  migrate:
    build: .
    command: ["bun", "run", "db:migrate"]
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-echo}:${POSTGRES_PASSWORD:-changeme}@postgres:5432/${POSTGRES_DB:-echo}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - echo-network
    profiles:
      - migrate

volumes:
  postgres_data:

networks:
  echo-network:
    driver: bridge
```
If `docker-compose.yml` exists, add just the `migrate` service block to match the above.

**Step 2: Commit**
```bash
git add docker-compose.yml

git commit -m "chore: add docker migration service"
```

---

### Final verification (@superpowers:verification-before-completion)

**Step 1: Lint**
Run: `bun run lint`
Expected: same existing warning, no errors.

**Step 2: Targeted tests**
Run: `bun test lib/db/migrate.test.ts`
Expected: PASS (2 tests).
