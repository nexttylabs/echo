ALTER TABLE "comments" DROP CONSTRAINT "comments_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "userId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "authorName" text;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "authorEmail" text;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "guestToken" text;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_comments_guestToken" ON "comments" USING btree ("guestToken");