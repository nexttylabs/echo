# Database Migration Guide

## Generating Migrations

After changing the schema in `lib/db/schema/`, run:

```bash
bun run db:generate
```

This creates a new migration in `lib/db/migrations/`.

## Applying Migrations

**Development:**

```bash
bun run db:push
```

`db:push` applies schema changes directly and is useful for local iteration.

**Production:**

```bash
bun run db:migrate
```

`db:migrate` applies generated migration files in order.

## Checking Schema

```bash
bun run db:check
```

Verifies the database schema matches your Drizzle schema.

## Database Studio

```bash
bun run db:studio
```

Opens Drizzle Studio (default: http://localhost:4983).

## Rollback

Drizzle does not generate down migrations automatically. To rollback:

1. Create a rollback SQL file alongside the migration:
   `lib/db/migrations/<migration-name>-rollback.sql`
2. Run the rollback script:

```bash
bun run scripts/rollback.ts 1
```

## Pre-deploy Migration

Use the pre-deploy script in CI/CD or release automation to verify connectivity,
optionally run backups, apply migrations, and validate the resulting schema:

```bash
bun run scripts/pre-deploy.ts
```

Set `DB_BACKUP_BEFORE_MIGRATE=true` to enable backup integration (Story 8.5).

## Best Practices

1. Test migrations on a production-like copy first
2. Keep migrations small and reversible when possible
3. Prefer additive changes (`ADD COLUMN` with defaults) to avoid data loss
4. Avoid long-running migrations during peak traffic
5. Document any manual steps in the PR description
