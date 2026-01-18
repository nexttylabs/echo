DROP TABLE IF EXISTS "projects" CASCADE;
ALTER TABLE "feedback" DROP COLUMN IF EXISTS "projectId";
DROP INDEX IF EXISTS "idx_feedback_projectId";

CREATE TABLE "organization_settings" (
  "organizationId" text PRIMARY KEY REFERENCES "organizations"("id") ON DELETE cascade,
  "widgetConfig" jsonb,
  "portalConfig" jsonb,
  "customDomain" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX "idx_org_settings_orgId" ON "organization_settings" ("organizationId");
ALTER TABLE "organization_settings" ADD CONSTRAINT "unique_org_custom_domain" UNIQUE ("customDomain");
