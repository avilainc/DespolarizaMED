/**
 * Roda uma vez quando o servidor Next sobe, e o Next espera terminar antes de
 * atender a primeira requisição.
 *
 * Usado para aplicar as migrations do Payload no start do container, no mesmo
 * espírito do `docker-entrypoint.sh` para o Drizzle: o adapter só migra ao
 * conectar (`prodMigrations`, ver `src/payload/payload.config.ts`), e sem
 * isto a conexão — e a migration — ficaria para o primeiro aluno que abrisse
 * uma aula, com o schema velho até lá e o erro aparecendo na tela dele.
 *
 * Falha derruba o processo, de propósito: container que não sobe é visível;
 * container que sobe com o schema errado responde 200 e engana o healthcheck.
 */
export async function register() {
  // Só no servidor Node de produção. Fica de fora:
  // - o runtime edge (não roda Payload);
  // - o `next build`, que também chama `register` e roda sem banco de
  //   propósito (ver Dockerfile: DATABASE_URL aponta para a porta 1);
  // - o `next dev`, onde quem cuida do schema é o desenvolvedor (e o adapter
  //   nem aplica `prodMigrations` fora de produção).
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.MIGRAR === "0") {
    console.log("instrumentation: MIGRAR=0, pulando as migrations do Payload");
    return;
  }

  try {
    // Sondagem antes de entregar o banco ao adapter: há estados em que o
    // `migrate` do Payload sairia com código 0 sem explicar, ou tentaria
    // recriar tabelas existentes. Ver `bloqueioDoPayload`.
    const { db } = await import("@/lib/db");
    const { sondarBloqueioDoPayload } = await import("@/lib/db/migracoes-payload");
    const { MIGRACOES_PAYLOAD_DA_IMAGEM } = await import("@/lib/db/migracoes-payload-imagem");
    const bloqueio = await sondarBloqueioDoPayload(db, MIGRACOES_PAYLOAD_DA_IMAGEM);
    if (bloqueio) throw new Error(bloqueio);

    const { getPayloadClient } = await import("@/lib/payload");
    const inicio = Date.now();
    await getPayloadClient();
    console.log(`instrumentation: Payload em dia (${Date.now() - inicio} ms)`);
  } catch (erro) {
    console.error(
      "instrumentation: migrations do Payload FALHARAM —",
      erro instanceof Error ? erro.message : erro,
    );
    process.exit(1);
  }
}
