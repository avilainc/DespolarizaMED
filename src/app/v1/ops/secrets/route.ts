import { NextResponse } from "next/server";
import { loadManifest } from "@/lib/gapp/manifest";
import { harnessTokenOk, unauthorized } from "@/lib/gapp/auth";

/**
 * Inventário de segredos: nomes e idades, nunca valores.
 *
 * Esta rota NÃO está na lista de endpoints obrigatórios do contrato, mas a
 * governança, os níveis L1/L2, o roteiro e quatro processos a exigem pelo nome
 * — é uma das 13 críticas bloqueantes do padrão ("o contrato não define
 * /v1/ops/secrets"). Implementamos no formato que a própria crítica recomenda,
 * porque sem ela a app não sai de L0 por falta de inventário verificável.
 * Se o padrão fechar noutro formato, muda só este arquivo.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!harnessTokenOk(request)) return unauthorized();

  const { manifest } = await loadManifest();
  const rotatedAt = new Date(manifest.secrets.rotated_at);
  const ageDays = Math.floor((Date.now() - rotatedAt.getTime()) / 86_400_000);

  const secrets = manifest.secrets.inventory.map((s) => ({
    name: s.name,
    kind: s.kind,
    credential_ref: `${s.kind}/${manifest.app.id}`,
    kid: null,
    // env-file-0600: variáveis vêm de arquivo root:root 0600 injetado pelo
    // compose. Não é env_plain (que seria segredo commitado ou em compose).
    source: manifest.secrets.backend,
    issued_by: s.issued_by,
    issued_at: manifest.secrets.rotated_at,
    age_days: ageDays,
    rotation_days: s.rotation_days,
  }));

  return NextResponse.json({ app: manifest.app.id, secrets });
}
