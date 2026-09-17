/**
 * Aplica as migrations do Drizzle. Roda DENTRO da imagem, no start do
 * container, antes do servidor subir (ver `docker-entrypoint.sh`).
 *
 * Por que aqui e não no workflow de deploy: o deploy é um workflow reutilizável
 * de `avilaops/infra` que só entrega a imagem ao host — a app não tem onde
 * pendurar um passo próprio sem duplicar acesso SSH. E a imagem é o único lugar
 * que tem, ao mesmo tempo, os arquivos de migration e a `DATABASE_URL` do
 * ambiente de destino.
 *
 * Usa o migrator do `drizzle-orm` (dependência de runtime, já na imagem), e
 * NÃO o `drizzle-kit`, que é devDependency e traria o pacote inteiro para o
 * runtime. É o mesmo código que `pnpm db:migrate` executa por baixo.
 *
 * Só cuida do Drizzle: o Payload tem a própria cadeia (`src/migrations/`), e
 * hoje não há migration de Payload pendente além da `init`, já aplicada. Se um
 * dia houver, ela entra aqui — ver docs/roadmap.md, seção 3.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const PASTA = process.env.MIGRATIONS_DIR ?? path.join(process.cwd(), "migrations");

if (!process.env.DATABASE_URL) {
  console.error("migrar: DATABASE_URL não está definida");
  process.exit(1);
}

if (!existsSync(path.join(PASTA, "meta", "_journal.json"))) {
  console.error(`migrar: sem journal em ${PASTA} — a imagem foi montada sem as migrations`);
  process.exit(1);
}

// max: 1 — é um processo de vida curta aplicando DDL em série; um pool aqui só
// deixaria conexões ociosas presas enquanto o ALTER TABLE segura o lock.
const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });

try {
  const inicio = Date.now();
  await migrate(drizzle(sql), { migrationsFolder: PASTA });
  console.log(`migrar: banco em dia (${Date.now() - inicio} ms)`);
} catch (erro) {
  // Sai diferente de zero de propósito: o entrypoint aborta e o container não
  // sobe. Um container que não sobe é visível; um que sobe com o schema errado
  // responde 200 e engana o healthcheck.
  console.error("migrar: FALHOU —", erro instanceof Error ? erro.message : erro);
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
