CREATE TABLE "votes" (
	"voteId" serial PRIMARY KEY NOT NULL,
	"feedbackId" serial NOT NULL,
	"visitorId" text,
	"userId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_vote" UNIQUE("feedbackId","visitorId")
);
--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_feedbackId_feedback_feedbackId_fk" FOREIGN KEY ("feedbackId") REFERENCES "public"."feedback"("feedbackId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_votes_feedbackId" ON "votes" USING btree ("feedbackId");--> statement-breakpoint
CREATE INDEX "idx_votes_userId" ON "votes" USING btree ("userId");