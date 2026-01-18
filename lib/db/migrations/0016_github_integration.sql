-- Add GitHub fields to feedback table
ALTER TABLE "feedback" ADD COLUMN IF NOT EXISTS "githubIssueId" INTEGER;
ALTER TABLE "feedback" ADD COLUMN IF NOT EXISTS "githubIssueNumber" INTEGER;
ALTER TABLE "feedback" ADD COLUMN IF NOT EXISTS "githubIssueUrl" TEXT;
ALTER TABLE "feedback" ADD COLUMN IF NOT EXISTS "githubSyncedAt" TIMESTAMP;
ALTER TABLE "feedback" ADD COLUMN IF NOT EXISTS "githubStatus" TEXT;

-- Create index for GitHub issue lookups
CREATE INDEX IF NOT EXISTS "idx_feedback_githubIssueId" ON "feedback" ("githubIssueId");

-- Create GitHub integrations table
CREATE TABLE IF NOT EXISTS "github_integrations" (
  "id" SERIAL PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "organization" ("id") ON DELETE CASCADE,
  "accessToken" TEXT NOT NULL,
  "owner" TEXT NOT NULL,
  "repo" TEXT NOT NULL,
  "labelMapping" JSONB,
  "statusMapping" JSONB,
  "autoSync" BOOLEAN NOT NULL DEFAULT true,
  "webhookSecret" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for organization lookup
CREATE INDEX IF NOT EXISTS "idx_github_integrations_orgId" ON "github_integrations" ("organizationId");

-- Unique constraint: one GitHub integration per organization
CREATE UNIQUE INDEX IF NOT EXISTS "idx_github_integrations_org_unique" ON "github_integrations" ("organizationId");
