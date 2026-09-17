CREATE TABLE "practice_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" text NOT NULL,
	"question_id" uuid NOT NULL,
	"attempt_id" uuid,
	"letra" text NOT NULL,
	"correta" boolean NOT NULL,
	"answered_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" text NOT NULL,
	"document_id" uuid NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"total_questoes" integer DEFAULT 0 NOT NULL,
	"acertos" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "practice_answers" ADD CONSTRAINT "practice_answers_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_answers" ADD CONSTRAINT "practice_answers_question_id_library_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."library_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_answers" ADD CONSTRAINT "practice_answers_attempt_id_practice_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."practice_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_document_id_source_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."source_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "practice_answers_student_question_idx" ON "practice_answers" USING btree ("student_id","question_id");--> statement-breakpoint
CREATE INDEX "practice_answers_attempt_idx" ON "practice_answers" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "practice_attempts_student_idx" ON "practice_attempts" USING btree ("student_id","document_id");