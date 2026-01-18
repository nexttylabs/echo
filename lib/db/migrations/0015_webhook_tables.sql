CREATE TABLE "webhook_events" (
	"eventId" serial PRIMARY KEY NOT NULL,
	"webhookId" integer NOT NULL,
	"eventType" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"responseStatus" integer,
	"responseBody" text,
	"retryCount" integer DEFAULT 0 NOT NULL,
	"maxRetries" integer DEFAULT 3 NOT NULL,
	"nextRetryAt" timestamp,
	"deliveredAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhooks" (
	"webhookId" serial PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"secret" text,
	"events" jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_webhookId_webhooks_webhookId_fk" FOREIGN KEY ("webhookId") REFERENCES "public"."webhooks"("webhookId") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_webhook_events_webhookId" ON "webhook_events" USING btree ("webhookId");
--> statement-breakpoint
CREATE INDEX "idx_webhook_events_status" ON "webhook_events" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "idx_webhook_events_nextRetry" ON "webhook_events" USING btree ("nextRetryAt");
--> statement-breakpoint
CREATE INDEX "idx_webhooks_orgId" ON "webhooks" USING btree ("organizationId");
--> statement-breakpoint
CREATE INDEX "idx_webhooks_enabled" ON "webhooks" USING btree ("enabled");
