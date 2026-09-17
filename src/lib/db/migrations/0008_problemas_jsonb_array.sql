-- O loader (scripts/pdf-ingest/10_load_questions.mjs) gravava `problemas` como
-- string JSON ('"[]"') em vez de array jsonb ('[]'), e jsonb_array_length()
-- falha com escalar. Converte o que está em string para o array que ela contém.
UPDATE "library_questions"
SET "problemas" = ("problemas" #>> '{}')::jsonb
WHERE jsonb_typeof("problemas") = 'string';
