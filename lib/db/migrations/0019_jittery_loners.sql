CREATE TABLE "organization_settings" (
	"organizationId" text PRIMARY KEY NOT NULL,
	"widgetConfig" jsonb,
	"portalConfig" jsonb,
	"customDomain" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_org_custom_domain" UNIQUE("customDomain")
);
--> statement-breakpoint
ALTER TABLE "feedback" DROP CONSTRAINT "feedback_projectId_projects_projectId_fk";
--> statement-breakpoint
DROP INDEX "idx_feedback_projectId";--> statement-breakpoint
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_org_settings_orgId" ON "organization_settings" USING btree ("organizationId");--> statement-breakpoint
ALTER TABLE "feedback" DROP COLUMN "projectId";