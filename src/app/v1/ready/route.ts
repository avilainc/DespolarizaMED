import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { estadoDasMigracoes } from "@/lib/db/migracoes";
import { estadoDasMigracoesPayload } from "@/lib/db/migracoes-payload";
import { MIGRACOES_PAYLOAD_DA_IMAGEM } from "@/lib/db/migracoes-payload-imagem";

// Alvo do healthcheck do compose e do health_uri do Caddy: responde se a app
// pode RECEBER TRÁFEGO, que é diferente de estar viva (/v1/health).
export const dynamic = "force-dynamic";

function naoPronto(reason: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json(
    { ready: false, reason, ...extra },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET() {
  try {
    await db.execute(sql`select 1`);
  } catch {
    return naoPronto("db_unavailable");
  }

  // Schema atrás do código é motivo para NÃO receber tráfego. O container
  // migra antes de subir (ver entrypoint), então drift aqui significa que a
  // migration não rodou — e servir assim dá 500 nas telas afetadas enquanto o
  // healthcheck jura que está tudo bem, que foi exatamente o buraco que esta
  // rota tinha. Falhar fechado é a única resposta honesta.
  //
  // As duas cadeias contam: Drizzle (migrada pelo entrypoint) e Payload
  // (migrada pelo `src/instrumentation.ts`). Pendência em qualquer uma é drift.
  let pendentes: string[];
  try {
    const [drizzle, payload] = await Promise.all([
      estadoDasMigracoes(db),
      estadoDasMigracoesPayload(db, MIGRACOES_PAYLOAD_DA_IMAGEM),
    ]);
    pendentes = [...drizzle.pendentes, ...payload.pendentes.map((n) => `payload/${n}`)];
  } catch {
    // A medição em si quebrou (permissão, catálogo indisponível). Não dá para
    // afirmar drift, e derrubar a app por não conseguir medir seria pior que o
    // problema: o `select 1` acima já provou que o banco responde.
    return NextResponse.json(
      { ready: true, migrations: "unknown" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  if (pendentes.length > 0) {
    return naoPronto("migrations_pending", { migrations_pending: pendentes });
  }

  return NextResponse.json({ ready: true }, { headers: { "Cache-Control": "no-store" } });
}
