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
ALTER TABLE "duplicate_feedback" ADD CONSTRAINT "duplicate_feedback_originalFeedbackId_feedback_feedbackId_fk" FOREIGN KEY ("originalFeedbackId") REFERENCES "public"."feedback"("feedbackId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_feedback" ADD CONSTRAINT "duplicate_feedback_duplicateFeedbackId_feedback_feedbackId_fk" FOREIGN KEY ("duplicateFeedbackId") REFERENCES "public"."feedback"("feedbackId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_feedback" ADD CONSTRAINT "duplicate_feedback_confirmedBy_user_id_fk" FOREIGN KEY ("confirmedBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_duplicate_original" ON "duplicate_feedback" USING btree ("originalFeedbackId");--> statement-breakpoint
CREATE INDEX "idx_duplicate_duplicate" ON "duplicate_feedback" USING btree ("duplicateFeedbackId");