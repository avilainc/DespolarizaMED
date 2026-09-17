import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { estadoDasMigracoes } from "@/lib/db/migracoes";
import { loadManifest, buildInfo } from "@/lib/gapp/manifest";
import { harnessTokenOk, unauthorized } from "@/lib/gapp/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!harnessTokenOk(request)) return unauthorized();

  const { manifest } = await loadManifest();
  const { version, commit } = buildInfo();

  // null em `migrations_pending` é "não sei" (banco fora do ar), que o motor de
  // normas trata como não verificável — diferente de 0, que afirma estar em dia.
  const migracoes = await estadoDasMigracoes(db).catch(() => null);

  return NextResponse.json({
    deploy: {
      version,
      commit,
      image_digest: process.env.IMAGE_DIGEST ?? null,
      deployed_at: process.env.DEPLOYED_AT ?? null,
      deployed_by: process.env.DEPLOYED_BY ?? null,
      release_id: null,
      previous_version: null,
      rollback_available: false,
    },
    db: {
      engine: manifest.db.engine,
      mode: "native",
      role: manifest.db.role,
      migration_version: migracoes?.versao ?? null,
      migrations_pending: migracoes ? migracoes.pendentes.length : null,
      migrations_pending_tags: migracoes?.pendentes ?? null,
      // Sem rotina de backup ainda: null é "não sei", que o motor de normas
      // trata como não verificável. Preencher com uma data inventada aqui
      // seria transformar uma pendência real em conformidade falsa.
      last_backup_ok_at: null,
      last_backup_size_bytes: null,
      last_restore_test_at: null,
    },
    // O inventário fica em /v1/ops/secrets, que é a rota que a governança
    // consulta. Repetido aqui não fica: duas fontes divergem com o tempo.
    secrets: [],
    data: {
      last_cleanup_at: null,
      erasure_ledger_pending: 0,
      subject_requests: { open: 0, overdue: 0 },
    },
    dependencies: [],
    jobs: [],
  });
}
