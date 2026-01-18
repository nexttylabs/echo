CREATE TABLE "comments" (
	"commentId" serial PRIMARY KEY NOT NULL,
	"feedbackId" serial NOT NULL,
	"userId" text NOT NULL,
	"content" text NOT NULL,
	"isInternal" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"projectId" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizationId" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"widgetConfig" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_slug_org" UNIQUE("slug","organizationId")
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_feedbackId_feedback_feedbackId_fk" FOREIGN KEY ("feedbackId") REFERENCES "public"."feedback"("feedbackId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_comments_feedbackId" ON "comments" USING btree ("feedbackId");--> statement-breakpoint
CREATE INDEX "idx_comments_isInternal" ON "comments" USING btree ("isInternal");--> statement-breakpoint
CREATE INDEX "idx_comments_internal_feedbacks" ON "comments" USING btree ("feedbackId","isInternal");--> statement-breakpoint
CREATE INDEX "idx_projects_orgId" ON "projects" USING btree ("organizationId");