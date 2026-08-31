import { NextResponse } from "next/server";
import { loadManifest } from "@/lib/gapp/manifest";
import { harnessTokenOk, unauthorized } from "@/lib/gapp/auth";
import { collectObservations, type Observations } from "@/lib/gapp/observations";

export const dynamic = "force-dynamic";

// Cache em memória: o contrato limita a stats_cache_s (<= 300 s) para o
// orchestrator não pagar o custo das queries agregadas a cada coleta.
let cache: { at: number; observations: Observations } | null = null;

export async function GET(request: Request) {
  if (!harnessTokenOk(request)) return unauthorized();

  const { manifest } = await loadManifest();
  const ttlMs = manifest.harness.stats_cache_s * 1000;

  const fresh = cache !== null && Date.now() - cache.at < ttlMs;
  if (!fresh) {
    cache = { at: Date.now(), observations: await collectObservations() };
  }

  return NextResponse.json({
    app: manifest.app.id,
    env: manifest.app.env,
    generated_at: new Date(cache!.at).toISOString(),
    cached: fresh,
    observations: cache!.observations,
  });
}
