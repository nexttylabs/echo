CREATE TABLE "github_integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"accessToken" text NOT NULL,
	"owner" text NOT NULL,
	"repo" text NOT NULL,
	"labelMapping" jsonb,
	"statusMapping" jsonb,
	"autoSync" boolean DEFAULT true NOT NULL,
	"webhookSecret" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "githubIssueId" integer;--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "githubIssueNumber" integer;--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "githubIssueUrl" text;--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "githubSyncedAt" timestamp;--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "githubStatus" text;--> statement-breakpoint
ALTER TABLE "github_integrations" ADD CONSTRAINT "github_integrations_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_github_integrations_orgId" ON "github_integrations" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "idx_feedback_githubIssueId" ON "feedback" USING btree ("githubIssueId");