import { sql } from "drizzle-orm";

import journal from "./migrations/meta/_journal.json";

/**
 * Estado das migrations do Drizzle: o que a IMAGEM carrega × o que o BANCO já
 * aplicou.
 *
 * Existe porque `/v1/ops/status` reportava `migrations_pending: 0` como
 * literal — conformidade declarada, não medida — e `/v1/ready` só fazia
 * `select 1`. Nessa combinação, um container com código novo contra um banco
 * com schema velho responde "pronto" e entra em rotação servindo erro.
 *
 * A regra aqui é a MESMA que o migrator do Drizzle usa para decidir o que
 * rodar: aplica-se toda entrada do journal cujo `when` seja maior que o
 * `created_at` da última linha de `drizzle.__drizzle_migrations` (as duas são
 * epoch em milissegundos, e o journal é a fonte da ordem). Medir por outro
 * critério daria um número que não corresponde ao que o deploy faria.
 */

export type EntradaDoJournal = {
  /** Nome do arquivo sem extensão, ex.: `0009_tiny_natasha_romanoff`. */
  tag: string;
  /** Epoch em ms; é o que o Drizzle grava em `created_at`. */
  when: number;
};

/** As migrations que esta build carrega, na ordem do journal. */
export const MIGRACOES_DA_IMAGEM: EntradaDoJournal[] = journal.entries
  .map((e) => ({ tag: e.tag, when: e.when }))
  .sort((a, b) => a.when - b.when);

/**
 * As migrations que ainda não rodaram. `ultimoAplicadoEm` é o maior
 * `created_at` da tabela de controle, ou `null` quando o banco está virgem
 * (sem a tabela) — caso em que tudo está pendente.
 */
export function pendentesDoJournal(
  entradas: EntradaDoJournal[],
  ultimoAplicadoEm: number | null,
): string[] {
  if (ultimoAplicadoEm === null) return entradas.map((e) => e.tag);
  return entradas.filter((e) => e.when > ultimoAplicadoEm).map((e) => e.tag);
}

export type EstadoDasMigracoes = {
  /** Hash da última migration aplicada; `null` em banco virgem. */
  versao: string | null;
  /** `created_at` da última aplicada, epoch ms; `null` em banco virgem. */
  aplicadaEm: number | null;
  /** Tags que a imagem tem e o banco ainda não. */
  pendentes: string[];
};

/** O executor mínimo de que precisamos — o `db` do Drizzle satisfaz. */
type Executor = { execute: (query: ReturnType<typeof sql>) => Promise<unknown> };

function primeiraLinha<T>(resultado: unknown): T | undefined {
  // postgres-js devolve um array de linhas; outros drivers embrulham em `rows`.
  const linhas = Array.isArray(resultado)
    ? resultado
    : ((resultado as { rows?: unknown[] })?.rows ?? []);
  return linhas[0] as T | undefined;
}

export async function estadoDasMigracoes(executor: Executor): Promise<EstadoDasMigracoes> {
  // Duas consultas em vez de uma: subconsulta sobre tabela inexistente falha no
  // parse, então a existência precisa ser resolvida antes de tocar na tabela.
  const existe = primeiraLinha<{ tabela: string | null }>(
    await executor.execute(sql`select to_regclass('drizzle.__drizzle_migrations') as tabela`),
  );
  if (!existe?.tabela) {
    return { versao: null, aplicadaEm: null, pendentes: pendentesDoJournal(MIGRACOES_DA_IMAGEM, null) };
  }

  // `created_at` é bigint: convertido em texto no SQL para não depender de como
  // cada driver representa int8 (postgres-js devolve string, outros number).
  const ultima = primeiraLinha<{ hash: string | null; created_at: string | null }>(
    await executor.execute(
      sql`select hash, created_at::text as created_at
          from drizzle.__drizzle_migrations
          order by created_at desc
          limit 1`,
    ),
  );

  const aplicadaEm = ultima?.created_at != null ? Number(ultima.created_at) : null;
  return {
    versao: ultima?.hash ?? null,
    aplicadaEm: Number.isFinite(aplicadaEm) ? aplicadaEm : null,
    pendentes: pendentesDoJournal(MIGRACOES_DA_IMAGEM, Number.isFinite(aplicadaEm) ? aplicadaEm : null),
  };
}
