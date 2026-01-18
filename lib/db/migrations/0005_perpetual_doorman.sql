ALTER TABLE "feedback" ADD COLUMN "submittedOnBehalf" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "submittedBy" text;--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "customerInfo" jsonb;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_submittedBy_user_id_fk" FOREIGN KEY ("submittedBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_feedback_submittedBy" ON "feedback" USING btree ("submittedBy");