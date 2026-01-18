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
ALTER TABLE "feedback" ADD COLUMN "processingStatus" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "processedAt" timestamp;--> statement-breakpoint
ALTER TABLE "ai_processing_results" ADD CONSTRAINT "ai_processing_results_feedbackId_feedback_feedbackId_fk" FOREIGN KEY ("feedbackId") REFERENCES "public"."feedback"("feedbackId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_results_feedback" ON "ai_processing_results" USING btree ("feedbackId");--> statement-breakpoint
CREATE INDEX "idx_ai_results_status" ON "ai_processing_results" USING btree ("status");