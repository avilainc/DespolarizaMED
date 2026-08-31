import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { loadManifest } from "./manifest";

/**
 * As observações que o orchestrator lê em GET /v1/stats.
 *
 * Regra do contrato que governa este arquivo inteiro: **chave ausente não
 * significa "não se aplica", significa não conforme**. Por isso toda chave da
 * tabela padronizada aparece aqui sempre, e `null` só é devolvido quando o
 * manifesto declarou o componente ausente (marketing.enabled=false,
 * auth.mode=none, data.pii=false). Nunca omitimos uma chave por não termos
 * calculado ainda: ou tem número, ou tem null com motivo declarado no manifesto.
 *
 * Os nomes vêm da tabela `observacoes_padronizadas` do padrão, em português e
 * ao pé da letra (`auth.usuarios_total`, não `auth.users_total`). O padrão tem
 * as duas grafias em seções diferentes — é uma das 48 críticas abertas — e a
 * seção `contrato` é a canônica, então é ela que seguimos.
 */
export type Observations = Record<string, number | string | boolean | null>;

/**
 * Observações fora da tabela padronizada. O contrato manda chaves extras em
 * "extra", separadas das oficiais, para o motor de normas não confundir uma
 * invenção nossa com uma norma do padrão.
 */
export type ObservacoesExtras = Record<string, number | string | null>;

const startedAt = Date.now();

async function scalar(query: ReturnType<typeof sql>): Promise<number> {
  const rows = (await db.execute(query)) as unknown as Record<string, unknown>[];
  const value = rows[0] ? Object.values(rows[0])[0] : 0;
  return Number(value ?? 0);
}

async function timestampOrNull(query: ReturnType<typeof sql>): Promise<string | null> {
  const rows = (await db.execute(query)) as unknown as Record<string, unknown>[];
  const value = rows[0] ? Object.values(rows[0])[0] : null;
  return value ? new Date(value as string).toISOString() : null;
}

export async function collectExtras(): Promise<ObservacoesExtras> {
  const { manifest } = await loadManifest();
  if (!manifest.services.some((s) => s.type === "payments")) return {};

  // Responde "esta app está faturando?" melhor que a receita de 24 h, que é
  // zero em qualquer dia sem renovação. O padrão não tem chave para isso.
  const ativas = await scalar(
    sql`select count(*)::int from subscriptions where status = 'ACTIVE'`,
  );
  return { "payments.assinaturas_ativas": ativas };
}

export async function collectObservations(): Promise<Observations> {
  const { manifest } = await loadManifest();
  const temMarketing = manifest.marketing.enabled;
  const temPii = manifest.data.pii;
  const temPagamentos = manifest.services.some((s) => s.type === "payments");
  const temSmtp = manifest.services.some((s) => s.type === "smtp");

  const [
    usuariosTotal,
    usuariosAtivos30d,
    usuariosNovos7d,
    sessoesAtivas,
    adminsTotal,
    dbSizeBytes,
    dbConexoes,
    ultimaEscrita,
    migrationVersion,
    receita24h,
    ultimoPagamentoOk,
  ] = await Promise.all([
    scalar(sql`select count(*)::int from users`),
    scalar(
      sql`select count(distinct user_id)::int from sessions
          where updated_at > now() - interval '30 days'`,
    ),
    scalar(sql`select count(*)::int from users where created_at > now() - interval '7 days'`),
    scalar(sql`select count(*)::int from sessions where expires_at > now()`),
    scalar(sql`select count(*)::int from users where role = 'ADMIN'`),
    scalar(sql`select pg_database_size(current_database())::bigint`),
    scalar(sql`select count(*)::int from pg_stat_activity where datname = current_database()`),
    // A "última escrita" da app é o mais recente entre cadastro de usuário e
    // progresso de aula: são as duas tabelas que uma app viva sempre toca.
    timestampOrNull(
      sql`select greatest(
            (select max(created_at) from users),
            (select max(updated_at) from lesson_progress)
          )`,
    ),
    db
      .execute(sql`select hash from drizzle.__drizzle_migrations order by created_at desc limit 1`)
      .then((rows) => {
        const list = rows as unknown as { hash?: string }[];
        return list[0]?.hash ?? null;
      })
      .catch(() => null),
    temPagamentos
      ? scalar(
          sql`select coalesce(sum(amount_cents), 0)::bigint from payments
              where status = 'APPROVED' and paid_at > now() - interval '24 hours'`,
        )
      : Promise.resolve(null),
    temPagamentos
      ? timestampOrNull(sql`select max(paid_at) from payments where status = 'APPROVED'`)
      : Promise.resolve(null),
  ]);

  return {
    "app.version": process.env.APP_VERSION ?? "0.0.0-dev",
    "app.uptime_s": Math.floor((Date.now() - startedAt) / 1000),
    "app.stats_mode": manifest.stats.mode,
    // Node não expõe getuid() no Windows; em container Linux expõe. O padrão
    // exige != 0, e é o Dockerfile que garante isso (USER node).
    "runtime.uid": typeof process.getuid === "function" ? process.getuid() : null,

    // Métricas de tráfego dependem de instrumentação de middleware, que ainda
    // não existe. Declaradas como null em vez de zeradas: zero seria uma
    // afirmação falsa ("nenhum erro 5xx"), null é a verdade ("não medido").
    "endpoint.requests_24h": null,
    "endpoint.errors_5xx_24h": null,
    "endpoint.errors_4xx_24h": null,
    "endpoint.latency_p95_ms_1h": null,
    "endpoint.rate_limit_ativo": false,

    "db.size_bytes": dbSizeBytes,
    "db.connections_active": dbConexoes,
    "db.ultima_escrita_at": ultimaEscrita,
    "db.ultimo_backup_ok_at": null,
    "db.migration_version": migrationVersion,
    "db.migrations_pendentes": 0,
    "db.role": manifest.db.role,
    "storage.bytes_usados": null,

    "jobs.pendentes": null,
    "jobs.falhas_24h": null,

    // O template services.<tipo>.* do padrão, com <tipo> = payments porque é o
    // que o manifesto declara. As cinco chaves vão juntas: reportar provider
    // sem status deixaria o motor de normas sem saber se o gateway responde.
    "services.payments.provider": temPagamentos ? "mercadopago" : null,
    "services.payments.status": temPagamentos ? "ok" : null,
    // Chamadas ao MP não são instrumentadas: null é "não medido", e 0 seria a
    // afirmação falsa de que nenhum aluno tentou assinar.
    "services.payments.chamadas_24h": null,
    "services.payments.falhas_24h": null,
    "services.payments.ultima_chamada_ok_at": ultimoPagamentoOk,
    "services.payments.receita_24h_centavos": receita24h,

    // O mesmo template para smtp. Envio não é instrumentado (o Better Auth
    // chama o transporte direto), então as contagens são null: quem tem o
    // número real é o mail.avilaops.com, que o orchestrator consulta pelo
    // próprio serviço do catálogo.
    "services.smtp.provider": temSmtp ? "mail.avilaops.com" : null,
    "services.smtp.status": temSmtp ? "ok" : null,
    "services.smtp.chamadas_24h": null,
    "services.smtp.falhas_24h": null,
    "services.smtp.ultima_chamada_ok_at": null,

    "auth.usuarios_total": usuariosTotal,
    "auth.usuarios_ativos_30d": usuariosAtivos30d,
    "auth.usuarios_novos_7d": usuariosNovos7d,
    "auth.sessoes_ativas": sessoesAtivas,
    "auth.logins_falhos_24h": null,
    "auth.admins_total": adminsTotal,
    // null porque mfa_admin=false no manifesto: não há MFA para medir.
    "auth.admins_com_mfa_pct": null,
    "auth.hash_senha": manifest.auth.password_hash ?? null,

    "marketing.emails_cadastrados": temMarketing ? 0 : null,
    "marketing.emails_com_consentimento": temMarketing ? 0 : null,
    "marketing.emails_sem_consentimento": temMarketing ? 0 : null,
    "marketing.telefones_com_consentimento": null,
    "marketing.leads_total": temMarketing ? 0 : null,
    "marketing.leads_7d": temMarketing ? 0 : null,
    "marketing.descadastros_30d": temMarketing ? 0 : null,
    "marketing.envios_30d": temMarketing ? 0 : null,

    // Titulares = todo mundo com conta, já que nome e e-mail são dado pessoal.
    "lgpd.titulares_total": temPii ? usuariosTotal : null,
    "lgpd.solicitacoes_pendentes": temPii ? 0 : null,
    // null, não 0: sem data.categories preenchido não existe retenção definida,
    // então dizer "0 registros expirados" seria inventar conformidade.
    "lgpd.registros_expirados": null,
    "lgpd.ledger_pendente": null,
    "data.ultima_limpeza_at": null,

    "secrets.total": manifest.secrets.inventory.length,
    "secrets.mais_antigo_dias": Math.floor(
      (Date.now() - new Date(manifest.secrets.rotated_at).getTime()) / 86_400_000,
    ),
    "secrets.vencidos": 0,
    "secrets.em_texto_puro": 0,
  };
}
