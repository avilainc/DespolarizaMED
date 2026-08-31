import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";

/**
 * Leitura do gapp.yaml, a fonte do que a app declara sobre si mesma.
 *
 * O orchestrator concilia o checksum devolvido por GET /v1/manifest com o que
 * ele guarda no registro, então o hash tem que ser do arquivo como está em
 * disco (bytes crus), nunca do objeto reserializado: reserializar muda
 * espaçamento e comentários e faria o checksum divergir a cada leitura.
 */
export type GappManifest = {
  gapp: string;
  app: {
    id: string;
    name: string;
    owner: string;
    env: "prod" | "staging";
    tier: "critical" | "standard" | "internal";
    lifecycle: "active" | "maintenance" | "deprecated" | "archived";
    repo: string;
    branch: string;
    stack: string;
  };
  endpoint: { base_url: string; internal_url: string; domains: string[]; public: boolean };
  runtime: { kind: string; port: number; services: { name: string; role: string }[] };
  db: { engine: string; role: string; migrations: { tool: string; table: string } };
  services: { type: string; provider: string }[];
  auth: { mode: "none" | "local" | "sso"; password_hash?: string; mfa_admin: boolean };
  marketing: { enabled: boolean };
  data: { pii: boolean };
  secrets: {
    backend: string;
    inventory: { name: string; kind: string; issued_by: string; rotation_days: number }[];
    rotated_at: string;
  };
  harness: { token_env: string; stats_cache_s: number };
  stats: { mode: "native" | "adapter" };
};

let cached: { manifest: GappManifest; checksum: string; loadedAt: string } | null = null;

export async function loadManifest() {
  if (cached) return cached;

  const file = path.join(process.cwd(), "gapp.yaml");
  const raw = await readFile(file);

  cached = {
    manifest: parse(raw.toString("utf8")) as GappManifest,
    checksum: `sha256:${createHash("sha256").update(raw).digest("hex")}`,
    loadedAt: new Date().toISOString(),
  };

  return cached;
}

/** Versão e commit vêm do build; sem eles o orchestrator não fecha o gate pós-deploy. */
export function buildInfo() {
  return {
    version: process.env.APP_VERSION ?? "0.0.0-dev",
    commit: process.env.GIT_COMMIT ?? "unknown",
  };
}
