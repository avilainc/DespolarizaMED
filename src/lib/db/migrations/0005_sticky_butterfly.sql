ALTER TABLE "library_questions" ADD COLUMN "tema_sugerido" text;--> statement-breakpoint
ALTER TABLE "library_questions" ADD COLUMN "tema_pontos" real;--> statement-breakpoint
ALTER TABLE "library_questions" ADD COLUMN "banca" text;--> statement-breakpoint
ALTER TABLE "source_documents" ADD COLUMN "banca" text;--> statement-breakpoint
ALTER TABLE "source_documents" ADD COLUMN "banca_evidencia" text;--> statement-breakpoint
CREATE INDEX "library_questions_tags_idx" ON "library_questions" USING btree ("validada","banca","disciplina_sugerida","ano");--> statement-breakpoint
CREATE INDEX "library_questions_tema_idx" ON "library_questions" USING btree ("disciplina_sugerida","tema_sugerido");