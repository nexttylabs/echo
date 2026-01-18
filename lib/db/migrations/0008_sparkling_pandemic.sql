ALTER TABLE "feedback" ADD COLUMN "deletedAt" timestamp;--> statement-breakpoint
CREATE INDEX "idx_feedback_deletedAt" ON "feedback" USING btree ("deletedAt");