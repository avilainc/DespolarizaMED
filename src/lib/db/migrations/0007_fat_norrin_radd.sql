CREATE TABLE "library_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"reviewer_id" text NOT NULL,
	"acao" text NOT NULL,
	"antes" jsonb,
	"depois" jsonb,
	"nota" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "library_questions" ADD COLUMN "rejeitada" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "library_questions" ADD COLUMN "revisada_por" text;--> statement-breakpoint
ALTER TABLE "library_questions" ADD COLUMN "revisada_em" timestamp;--> statement-breakpoint
ALTER TABLE "library_reviews" ADD CONSTRAINT "library_reviews_question_id_library_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."library_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_reviews" ADD CONSTRAINT "library_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "library_reviews_question_idx" ON "library_reviews" USING btree ("question_id","created_at");--> statement-breakpoint
CREATE INDEX "library_reviews_reviewer_idx" ON "library_reviews" USING btree ("reviewer_id","created_at");--> statement-breakpoint
ALTER TABLE "library_questions" ADD CONSTRAINT "library_questions_revisada_por_users_id_fk" FOREIGN KEY ("revisada_por") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;