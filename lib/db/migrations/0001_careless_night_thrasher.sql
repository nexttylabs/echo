ALTER TABLE "github_integrations" ADD COLUMN "refreshToken" text;--> statement-breakpoint
ALTER TABLE "github_integrations" ADD COLUMN "tokenExpiresAt" timestamp;--> statement-breakpoint
ALTER TABLE "github_integrations" ADD COLUMN "syncTriggerStatuses" jsonb DEFAULT '["in-progress","planned"]'::jsonb;--> statement-breakpoint
ALTER TABLE "github_integrations" ADD COLUMN "syncStatusChanges" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "github_integrations" ADD COLUMN "syncComments" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "github_integrations" ADD COLUMN "autoAddLabels" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "github_integrations" ADD COLUMN "connectedBy" text;--> statement-breakpoint
ALTER TABLE "github_integrations" ADD COLUMN "lastSyncAt" timestamp;