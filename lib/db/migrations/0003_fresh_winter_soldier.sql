CREATE TABLE "external_issues" (
	"id" serial PRIMARY KEY NOT NULL,
	"feedbackId" integer NOT NULL,
	"integrationId" integer NOT NULL,
	"externalId" text NOT NULL,
	"externalNumber" integer,
	"externalUrl" text,
	"externalStatus" text,
	"lastSyncedAt" timestamp,
	"syncError" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"type" text NOT NULL,
	"name" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"tokenExpiresAt" timestamp,
	"config" jsonb,
	"syncSettings" jsonb,
	"connectedBy" text,
	"lastSyncAt" timestamp,
	"webhookSecret" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "external_issues" ADD CONSTRAINT "external_issues_feedbackId_feedback_feedbackId_fk" FOREIGN KEY ("feedbackId") REFERENCES "public"."feedback"("feedbackId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_issues" ADD CONSTRAINT "external_issues_integrationId_integrations_id_fk" FOREIGN KEY ("integrationId") REFERENCES "public"."integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_external_issues_feedbackId" ON "external_issues" USING btree ("feedbackId");--> statement-breakpoint
CREATE INDEX "idx_external_issues_integrationId" ON "external_issues" USING btree ("integrationId");--> statement-breakpoint
CREATE INDEX "idx_external_issues_externalId" ON "external_issues" USING btree ("externalId");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_external_issues_feedback_integration" ON "external_issues" USING btree ("feedbackId","integrationId");--> statement-breakpoint
CREATE INDEX "idx_integrations_orgId" ON "integrations" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "idx_integrations_type" ON "integrations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_integrations_org_type" ON "integrations" USING btree ("organizationId","type");