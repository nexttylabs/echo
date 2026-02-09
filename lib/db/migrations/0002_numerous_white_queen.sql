ALTER TABLE "comments" ADD COLUMN "githubCommentId" integer;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "githubCommentUrl" text;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "githubSyncedAt" timestamp;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "syncedFromGitHub" boolean DEFAULT false;--> statement-breakpoint
CREATE INDEX "idx_comments_githubCommentId" ON "comments" USING btree ("githubCommentId");