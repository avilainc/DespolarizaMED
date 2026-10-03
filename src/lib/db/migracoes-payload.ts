import { sql } from "drizzle-orm";

/**
 * Estado das migrations do PAYLOAD: o que a imagem carrega × o que o banco já
 * aplicou. Par de `./migracoes.ts`, que mede a cadeia do Drizzle.
 *
 * São duas cadeias independentes no mesmo Postgres (ver docs/roadmap.md,
 * seção 2), e cada uma tem a própria tabela de controle e a própria regra:
 *
 * - Drizzle decide por TEMPO (`when` do journal > último `created_at`);
 * - Payload decide por NOME: roda toda migration de `src/migrations/index.ts`
 *   cujo `name` não está em `payload_migrations` (ver `migrate` em
 *   `@payloadcms/drizzle`). A ordem é a do array, não a alfabética.
 *
 * Medir por outro critério daria um número que não corresponde ao que o
 * deploy faria — então aqui a regra é a mesma do Payload, e só ela.
 *
 * A lista da imagem chega por parâmetro, e não importada de `@/migrations`,
 * de propósito: aquele índice puxa `@payloadcms/db-postgres`, que fora do
 * bundle do Next quebra no `@next/env` (ver docs/roadmap.md, seção 3). Assim
 * este módulo roda em `node:test` sem shim; quem tem o índice à mão
 * (`./migracoes-payload-imagem.ts`, só importado de dentro do Next) passa os
 * nomes.
 */

/**
 * As que ainda não rodaram. `aplicadas` é `null` quando o banco não tem a
 * tabela de controle — caso em que tudo está pendente.
 *
 * Linhas com `batch = -1` NÃO contam como aplicadas: são o registro que o push
 * automático de dev grava (nome "dev"), e o próprio Payload as ignora ao
 * decidir o que migrar.
 */
export function pendentesDoPayload(
  daImagem: string[],
  aplicadas: { name: string | null; batch: number | null }[] | null,
): string[] {
  if (aplicadas === null) return [...daImagem];
  const feitas = new Set(
    aplicadas.filter((m) => m.batch !== -1 && m.name).map((m) => m.name as string),
  );
  return daImagem.filter((nome) => !feitas.has(nome));
}

export type EstadoDasMigracoesPayload = {
  /** Nome da última migration aplicada; `null` em banco virgem. */
  versao: string | null;
  /** Nomes que a imagem tem e o banco ainda não. */
  pendentes: string[];
};

type Executor = { execute: (query: ReturnType<typeof sql>) => Promise<unknown> };

function linhas<T>(resultado: unknown): T[] {
  // postgres-js devolve um array de linhas; outros drivers embrulham em `rows`.
  return (Array.isArray(resultado)
    ? resultado
    : ((resultado as { rows?: unknown[] })?.rows ?? [])) as T[];
}

export async function estadoDasMigracoesPayload(
  executor: Executor,
  daImagem: string[],
): Promise<EstadoDasMigracoesPayload> {
  // Mesma razão do lado Drizzle: consultar tabela inexistente falha no parse,
  // então a existência é resolvida antes.
  const [existe] = linhas<{ tabela: string | null }>(
    await executor.execute(sql`select to_regclass('public.payload_migrations') as tabela`),
  );
  if (!existe?.tabela) {
    return { versao: null, pendentes: pendentesDoPayload(daImagem, null) };
  }

  // `batch` é numeric: convertido no SQL para não depender de como cada driver
  // representa numeric (postgres-js devolve string).
  const aplicadas = linhas<{ name: string | null; batch: string | number | null }>(
    await executor.execute(
      sql`select name, batch::int as batch from payload_migrations order by id`,
    ),
  ).map((m) => ({ name: m.name, batch: m.batch === null ? null : Number(m.batch) }));

  const reais = aplicadas.filter((m) => m.batch !== -1 && m.name);
  return {
    versao: reais.length ? reais[reais.length - 1].name : null,
    pendentes: pendentesDoPayload(daImagem, aplicadas),
  };
}

/**
 * Situações em que deixar o adapter migrar sozinho faria mal, e que precisam
 * de uma pessoa antes. Devolve o motivo, ou `null` quando é seguro seguir.
 *
 * Existem porque o `migrate` do Payload foi escrito para terminal:
 *
 * - com um registro de push de dev (`batch = -1`) no banco, ele PERGUNTA se
 *   pode prosseguir com perda de dados. Sem TTY a pergunta é cancelada e o
 *   handler chama `process.exit(0)` — o container morre com código de sucesso,
 *   sem dizer por quê;
 * - com as tabelas já criadas por fora (push, SQL manual, restore parcial) e a
 *   `init` não registrada, ele roda a `init` de novo e quebra no primeiro
 *   `CREATE TYPE` que já existe. Isso trava cada start, mas ao menos com erro;
 *   aqui o erro sai com o remédio no texto.
 *
 * Pura: recebe o que foi lido do banco, para ser testada sem Postgres.
 */
export function bloqueioDoPayload(args: {
  daImagem: string[];
  /** `null` quando não existe `payload_migrations`. */
  aplicadas: { name: string | null; batch: number | null }[] | null;
  /** Se as tabelas do Payload já existem (sondado por `staff`). */
  schemaExiste: boolean;
}): string | null {
  const { daImagem, aplicadas, schemaExiste } = args;

  if (aplicadas?.some((m) => m.batch === -1)) {
    return (
      "payload_migrations tem registro de push de dev (batch = -1). O Payload " +
      "pediria confirmação interativa e sairia com código 0. Confira o schema e " +
      "remova a linha (`delete from payload_migrations where batch = -1`) antes de subir."
    );
  }

  const primeira = daImagem[0];
  const primeiraFeita = aplicadas?.some((m) => m.name === primeira) ?? false;
  if (primeira && schemaExiste && !primeiraFeita) {
    return (
      `as tabelas do Payload já existem, mas "${primeira}" não está registrada em ` +
      "payload_migrations: o adapter tentaria recriá-las. Se o schema corresponde a ela, " +
      `registre com \`insert into payload_migrations (name, batch) values ('${primeira}', 1)\`.`
    );
  }

  return null;
}

/** Lê do banco o que `bloqueioDoPayload` precisa e devolve o veredito. */
export async function sondarBloqueioDoPayload(
  executor: Executor,
  daImagem: string[],
): Promise<string | null> {
  const [sonda] = linhas<{ controle: string | null; staff: string | null }>(
    await executor.execute(
      sql`select to_regclass('public.payload_migrations') as controle,
                 to_regclass('public.staff') as staff`,
    ),
  );

  let aplicadas: { name: string | null; batch: number | null }[] | null = null;
  if (sonda?.controle) {
    aplicadas = linhas<{ name: string | null; batch: string | number | null }>(
      await executor.execute(sql`select name, batch::int as batch from payload_migrations`),
    ).map((m) => ({ name: m.name, batch: m.batch === null ? null : Number(m.batch) }));
  }

  return bloqueioDoPayload({ daImagem, aplicadas, schemaExiste: Boolean(sonda?.staff) });
}
