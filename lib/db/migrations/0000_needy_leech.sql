CREATE TABLE "ai_processing_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"feedbackId" integer NOT NULL,
	"classification" jsonb,
	"tagSuggestions" jsonb,
	"duplicateCandidates" jsonb,
	"processingTime" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"errorMessage" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"keyId" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"hashedKey" text NOT NULL,
	"prefix" text NOT NULL,
	"organizationId" text NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"lastUsed" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_hashedKey_unique" UNIQUE("hashedKey")
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"attachmentId" serial PRIMARY KEY NOT NULL,
	"feedbackId" integer NOT NULL,
	"fileName" text NOT NULL,
	"filePath" text NOT NULL,
	"fileSize" integer NOT NULL,
	"mimeType" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"commentId" serial PRIMARY KEY NOT NULL,
	"feedbackId" serial NOT NULL,
	"userId" text,
	"authorName" text,
	"authorEmail" text,
	"guestToken" text,
	"content" text NOT NULL,
	"isInternal" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "duplicate_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"originalFeedbackId" integer NOT NULL,
	"duplicateFeedbackId" integer NOT NULL,
	"similarity" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"confirmedBy" text,
	"confirmedAt" timestamp,
	CONSTRAINT "unique_duplicate_pair" UNIQUE("originalFeedbackId","duplicateFeedbackId")
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"feedbackId" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"priority" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"organizationId" text NOT NULL,
	"submittedOnBehalf" boolean DEFAULT false NOT NULL,
	"submittedBy" text,
	"customerInfo" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp,
	"autoClassified" boolean DEFAULT false NOT NULL,
	"processingStatus" text DEFAULT 'pending',
	"processedAt" timestamp,
	"githubIssueId" integer,
	"githubIssueNumber" integer,
	"githubIssueUrl" text,
	"githubSyncedAt" timestamp,
	"githubStatus" text
);
--> statement-breakpoint
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
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
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
CREATE TABLE "organization_members" (
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_members_organization_id_user_id_pk" PRIMARY KEY("organization_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"voteId" serial PRIMARY KEY NOT NULL,
	"feedbackId" serial NOT NULL,
	"visitorId" text,
	"userId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_vote" UNIQUE("feedbackId","visitorId")
);
--> statement-breakpoint
CREATE TABLE "status_history" (
	"historyId" serial PRIMARY KEY NOT NULL,
	"feedbackId" integer NOT NULL,
	"oldStatus" text NOT NULL,
	"newStatus" text NOT NULL,
	"changedBy" text,
	"changedAt" timestamp DEFAULT now() NOT NULL,
	"comment" text
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"userId" text PRIMARY KEY NOT NULL,
	"statusChange" boolean DEFAULT true NOT NULL,
	"newComment" boolean DEFAULT true NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"notificationId" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"feedbackId" serial NOT NULL,
	"data" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"sentAt" timestamp,
	"error" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"feedbackId" integer NOT NULL,
	"tagId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"tagId" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"color" text DEFAULT '#3b82f6',
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name"),
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
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
ALTER TABLE "ai_processing_results" ADD CONSTRAINT "ai_processing_results_feedbackId_feedback_feedbackId_fk" FOREIGN KEY ("feedbackId") REFERENCES "public"."feedback"("feedbackId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_feedbackId_feedback_feedbackId_fk" FOREIGN KEY ("feedbackId") REFERENCES "public"."feedback"("feedbackId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_feedbackId_feedback_feedbackId_fk" FOREIGN KEY ("feedbackId") REFERENCES "public"."feedback"("feedbackId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_feedback" ADD CONSTRAINT "duplicate_feedback_originalFeedbackId_feedback_feedbackId_fk" FOREIGN KEY ("originalFeedbackId") REFERENCES "public"."feedback"("feedbackId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_feedback" ADD CONSTRAINT "duplicate_feedback_duplicateFeedbackId_feedback_feedbackId_fk" FOREIGN KEY ("duplicateFeedbackId") REFERENCES "public"."feedback"("feedbackId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_feedback" ADD CONSTRAINT "duplicate_feedback_confirmedBy_user_id_fk" FOREIGN KEY ("confirmedBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_submittedBy_user_id_fk" FOREIGN KEY ("submittedBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_integrations" ADD CONSTRAINT "github_integrations_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_feedbackId_feedback_feedbackId_fk" FOREIGN KEY ("feedbackId") REFERENCES "public"."feedback"("feedbackId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_feedbackId_feedback_feedbackId_fk" FOREIGN KEY ("feedbackId") REFERENCES "public"."feedback"("feedbackId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_changedBy_user_id_fk" FOREIGN KEY ("changedBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_feedbackId_feedback_feedbackId_fk" FOREIGN KEY ("feedbackId") REFERENCES "public"."feedback"("feedbackId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_tags" ADD CONSTRAINT "feedback_tags_feedbackId_feedback_feedbackId_fk" FOREIGN KEY ("feedbackId") REFERENCES "public"."feedback"("feedbackId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_tags" ADD CONSTRAINT "feedback_tags_tagId_tags_tagId_fk" FOREIGN KEY ("tagId") REFERENCES "public"."tags"("tagId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_webhookId_webhooks_webhookId_fk" FOREIGN KEY ("webhookId") REFERENCES "public"."webhooks"("webhookId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_results_feedback" ON "ai_processing_results" USING btree ("feedbackId");--> statement-breakpoint
CREATE INDEX "idx_ai_results_status" ON "ai_processing_results" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_api_keys_hashedKey" ON "api_keys" USING btree ("hashedKey");--> statement-breakpoint
CREATE INDEX "idx_api_keys_orgId" ON "api_keys" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "idx_attachments_feedbackId" ON "attachments" USING btree ("feedbackId");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "idx_comments_feedbackId" ON "comments" USING btree ("feedbackId");--> statement-breakpoint
CREATE INDEX "idx_comments_isInternal" ON "comments" USING btree ("isInternal");--> statement-breakpoint
CREATE INDEX "idx_comments_internal_feedbacks" ON "comments" USING btree ("feedbackId","isInternal");--> statement-breakpoint
CREATE INDEX "idx_comments_guestToken" ON "comments" USING btree ("guestToken");--> statement-breakpoint
CREATE INDEX "idx_duplicate_original" ON "duplicate_feedback" USING btree ("originalFeedbackId");--> statement-breakpoint
CREATE INDEX "idx_duplicate_duplicate" ON "duplicate_feedback" USING btree ("duplicateFeedbackId");--> statement-breakpoint
CREATE INDEX "idx_feedback_orgId" ON "feedback" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "idx_feedback_status" ON "feedback" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_feedback_createdAt" ON "feedback" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_feedback_submittedBy" ON "feedback" USING btree ("submittedBy");--> statement-breakpoint
CREATE INDEX "idx_feedback_deletedAt" ON "feedback" USING btree ("deletedAt");--> statement-breakpoint
CREATE INDEX "idx_feedback_githubIssueId" ON "feedback" USING btree ("githubIssueId");--> statement-breakpoint
CREATE INDEX "idx_github_integrations_orgId" ON "github_integrations" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "idx_org_settings_orgId" ON "organization_settings" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "idx_votes_feedbackId" ON "votes" USING btree ("feedbackId");--> statement-breakpoint
CREATE INDEX "idx_votes_userId" ON "votes" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_status_history_feedbackId" ON "status_history" USING btree ("feedbackId");--> statement-breakpoint
CREATE INDEX "idx_status_history_changedAt" ON "status_history" USING btree ("changedAt");--> statement-breakpoint
CREATE INDEX "idx_notifications_userId" ON "notifications" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_notifications_status" ON "notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_notifications_type" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_feedback_tags_feedbackId" ON "feedback_tags" USING btree ("feedbackId");--> statement-breakpoint
CREATE INDEX "idx_feedback_tags_tagId" ON "feedback_tags" USING btree ("tagId");--> statement-breakpoint
CREATE INDEX "idx_feedback_tags_unique" ON "feedback_tags" USING btree ("feedbackId","tagId");--> statement-breakpoint
CREATE INDEX "idx_webhook_events_webhookId" ON "webhook_events" USING btree ("webhookId");--> statement-breakpoint
CREATE INDEX "idx_webhook_events_status" ON "webhook_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_webhook_events_nextRetry" ON "webhook_events" USING btree ("nextRetryAt");--> statement-breakpoint
CREATE INDEX "idx_webhooks_orgId" ON "webhooks" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "idx_webhooks_enabled" ON "webhooks" USING btree ("enabled");