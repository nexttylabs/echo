ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'admin';--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "projectId" uuid;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "customDomain" text;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_projectId_projects_projectId_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("projectId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_feedback_projectId" ON "feedback" USING btree ("projectId");--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "unique_custom_domain" UNIQUE("customDomain");