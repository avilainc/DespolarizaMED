CREATE TABLE "library_figures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"pagina" integer NOT NULL,
	"indice" integer NOT NULL,
	"questao_numero" integer,
	"arquivo" text NOT NULL,
	"bbox" jsonb NOT NULL,
	"largura_px" integer,
	"altura_px" integer
);
--> statement-breakpoint
ALTER TABLE "library_questions" ADD COLUMN "depende_de_contexto" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "library_questions" ADD COLUMN "contexto_numero" integer;--> statement-breakpoint
ALTER TABLE "library_questions" ADD COLUMN "contexto_fonte" text;--> statement-breakpoint
ALTER TABLE "library_questions" ADD COLUMN "duplicata_de" text;--> statement-breakpoint
ALTER TABLE "library_questions" ADD COLUMN "copias" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "library_questions" ADD COLUMN "confirmada_por_duplicata" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "library_questions" ADD COLUMN "conflito_duplicata" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "library_questions" ADD COLUMN "disciplina_sugerida" text;--> statement-breakpoint
ALTER TABLE "library_questions" ADD COLUMN "disciplina_fonte" text;--> statement-breakpoint
ALTER TABLE "library_questions" ADD COLUMN "disciplina_pontos" real;--> statement-breakpoint
ALTER TABLE "library_figures" ADD CONSTRAINT "library_figures_document_id_source_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."source_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "library_figures_uq" ON "library_figures" USING btree ("document_id","pagina","indice");--> statement-breakpoint
CREATE INDEX "library_figures_questao_idx" ON "library_figures" USING btree ("document_id","questao_numero");