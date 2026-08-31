CREATE TABLE "document_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"page_number" integer NOT NULL,
	"source" text NOT NULL,
	"layout" text,
	"ordem" text,
	"chars" integer DEFAULT 0 NOT NULL,
	"ocr_conf" real,
	"content" text DEFAULT '' NOT NULL,
	"search" "tsvector" GENERATED ALWAYS AS (to_tsvector('portuguese', coalesce(content, ''))) STORED
);
--> statement-breakpoint
CREATE TABLE "source_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sha256" text NOT NULL,
	"rel_path" text NOT NULL,
	"all_paths" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"filename" text NOT NULL,
	"categoria" text,
	"instituicao" text,
	"instituicao_slug" text,
	"ano" integer,
	"ano_fonte" text,
	"subpasta" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"fase" text,
	"curso" text,
	"tipo" text NOT NULL,
	"tipo_fonte" text DEFAULT 'nome' NOT NULL,
	"sinais" jsonb,
	"size_bytes" bigint NOT NULL,
	"pages" integer NOT NULL,
	"chars" integer DEFAULT 0 NOT NULL,
	"pages_nativas" integer DEFAULT 0 NOT NULL,
	"pages_ocr" integer DEFAULT 0 NOT NULL,
	"pages_sem_texto" integer DEFAULT 0 NOT NULL,
	"ocr_conf_media" real,
	"pdf_metadata" jsonb,
	"ingested_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_pages" ADD CONSTRAINT "document_pages_document_id_source_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."source_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "document_pages_doc_page_uq" ON "document_pages" USING btree ("document_id","page_number");--> statement-breakpoint
CREATE INDEX "document_pages_search_idx" ON "document_pages" USING gin ("search");--> statement-breakpoint
CREATE UNIQUE INDEX "source_documents_sha256_uq" ON "source_documents" USING btree ("sha256");--> statement-breakpoint
CREATE INDEX "source_documents_inst_ano_idx" ON "source_documents" USING btree ("instituicao_slug","ano");--> statement-breakpoint
CREATE INDEX "source_documents_tipo_idx" ON "source_documents" USING btree ("tipo");