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
CREATE TABLE "feedback" (
	"feedbackId" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"priority" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"organizationId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_feedbackId_feedback_feedbackId_fk" FOREIGN KEY ("feedbackId") REFERENCES "public"."feedback"("feedbackId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_attachments_feedbackId" ON "attachments" USING btree ("feedbackId");--> statement-breakpoint
CREATE INDEX "idx_feedback_orgId" ON "feedback" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "idx_feedback_status" ON "feedback" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_feedback_createdAt" ON "feedback" USING btree ("createdAt");