import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { loadManifest, buildInfo } from "@/lib/gapp/manifest";

// Probe do orchestrator a cada 60 s. Nunca cacheia: uma resposta cacheada
// diria "ok" com a app derrubada.
export const dynamic = "force-dynamic";

const startedAt = new Date().toISOString();

export async function GET() {
  const { manifest } = await loadManifest();
  const { version, commit } = buildInfo();

  let dbOk = true;
  try {
    await db.execute(sql`select 1`);
  } catch {
    dbOk = false;
  }

  const body = {
    // db é dependência required: sem banco a app não serve nada, então cai
    // para "down" com 503, não para "degraded".
    status: dbOk ? ("ok" as const) : ("down" as const),
    app: manifest.app.id,
    env: manifest.app.env,
    version,
    commit,
    started_at: startedAt,
    ts: new Date().toISOString(),
    checks: { db: dbOk ? "ok" : "down" },
  };

  // Público: nada de host, string de conexão, versão de biblioteca ou stack.
  return NextResponse.json(body, {
    status: dbOk ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
