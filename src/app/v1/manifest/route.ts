import { NextResponse } from "next/server";
import { loadManifest } from "@/lib/gapp/manifest";
import { harnessTokenOk, unauthorized } from "@/lib/gapp/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!harnessTokenOk(request)) return unauthorized();

  const { manifest, checksum, loadedAt } = await loadManifest();

  return NextResponse.json({
    manifest,
    checksum,
    loaded_at: loadedAt,
    // Apenas NOMES de variáveis, nunca valores: é o que permite ao orchestrator
    // conferir o inventário de segredos sem nunca ver um segredo.
    env_keys: manifest.secrets.inventory.map((s) => s.name),
    stats_mode: manifest.stats.mode,
  });
}
