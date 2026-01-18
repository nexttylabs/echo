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
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_feedbackId_feedback_feedbackId_fk" FOREIGN KEY ("feedbackId") REFERENCES "public"."feedback"("feedbackId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_changedBy_user_id_fk" FOREIGN KEY ("changedBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_status_history_feedbackId" ON "status_history" USING btree ("feedbackId");--> statement-breakpoint
CREATE INDEX "idx_status_history_changedAt" ON "status_history" USING btree ("changedAt");