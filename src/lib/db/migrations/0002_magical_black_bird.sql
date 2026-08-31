CREATE TABLE "library_question_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"letra" text NOT NULL,
	"texto" text NOT NULL,
	"correta" boolean,
	"ordem" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"numero" integer,
	"numero_forca" text,
	"pagina" integer,
	"enunciado" text NOT NULL,
	"instituicao_slug" text,
	"ano" integer,
	"fase" text,
	"curso" text,
	"gabarito_letra" text,
	"gabarito_document_id" uuid,
	"cobertura_gabarito" real,
	"motivo_ligacao" text,
	"anulada" boolean DEFAULT false NOT NULL,
	"problemas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"validada" boolean DEFAULT false NOT NULL,
	"search" "tsvector" GENERATED ALWAYS AS (to_tsvector('portuguese', coalesce(enunciado, ''))) STORED
);
--> statement-breakpoint
ALTER TABLE "library_question_options" ADD CONSTRAINT "library_question_options_question_id_library_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."library_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_questions" ADD CONSTRAINT "library_questions_document_id_source_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."source_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_questions" ADD CONSTRAINT "library_questions_gabarito_document_id_source_documents_id_fk" FOREIGN KEY ("gabarito_document_id") REFERENCES "public"."source_documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "library_question_options_uq" ON "library_question_options" USING btree ("question_id","letra");--> statement-breakpoint
CREATE INDEX "library_questions_doc_idx" ON "library_questions" USING btree ("document_id","numero");--> statement-breakpoint
CREATE INDEX "library_questions_inst_ano_idx" ON "library_questions" USING btree ("instituicao_slug","ano");--> statement-breakpoint
CREATE INDEX "library_questions_validada_idx" ON "library_questions" USING btree ("validada");--> statement-breakpoint
CREATE INDEX "library_questions_search_idx" ON "library_questions" USING gin ("search");