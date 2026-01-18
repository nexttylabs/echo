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
ALTER TABLE "feedback" ADD COLUMN "autoClassified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "feedback_tags" ADD CONSTRAINT "feedback_tags_feedbackId_feedback_feedbackId_fk" FOREIGN KEY ("feedbackId") REFERENCES "public"."feedback"("feedbackId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_tags" ADD CONSTRAINT "feedback_tags_tagId_tags_tagId_fk" FOREIGN KEY ("tagId") REFERENCES "public"."tags"("tagId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_feedback_tags_feedbackId" ON "feedback_tags" USING btree ("feedbackId");--> statement-breakpoint
CREATE INDEX "idx_feedback_tags_tagId" ON "feedback_tags" USING btree ("tagId");--> statement-breakpoint
CREATE INDEX "idx_feedback_tags_unique" ON "feedback_tags" USING btree ("feedbackId","tagId");