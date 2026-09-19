import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, ExternalLink, KeyRound, Receipt, Sparkles, UserRound } from "lucide-react";
import { requireSessionWithRole } from "@/lib/auth/require-session";
import { assinaturaDoAluno, pagamentosDoAluno } from "@/features/account/queries";
import { ProfileForm } from "@/features/account/components/profile-form";
import { PasswordForm } from "@/features/account/components/password-form";
import { VerifyEmailButton } from "@/features/account/components/verify-email-button";
import { PageHeader, SectionHeading } from "@/components/ui/page-header";
import { InitialsAvatar, Tag } from "@/components/ui/chip";
import { DataTable } from "@/components/ui/data-table";
import { IconTile } from "@/components/ui/surface";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Minha conta — DespolarizaMED" };

const STATUS: Record<
  string,
  { rotulo: string; tom: "positivo" | "atencao" | "negativo" | "neutro" }
> = {
  ACTIVE: { rotulo: "Ativa", tom: "positivo" },
  PENDING: { rotulo: "Aguardando pagamento", tom: "atencao" },
  PAST_DUE: { rotulo: "Pagamento pendente", tom: "negativo" },
  CANCELLED: { rotulo: "Cancelada", tom: "neutro" },
  EXPIRED: { rotulo: "Expirada", tom: "neutro" },
};

const PAGAMENTO: Record<string, { rotulo: string; tom: "positivo" | "atencao" | "negativo" | "neutro" }> = {
  APPROVED: { rotulo: "Pago", tom: "positivo" },
  PENDING: { rotulo: "Processando", tom: "atencao" },
  FAILED: { rotulo: "Recusado", tom: "negativo" },
  REFUNDED: { rotulo: "Estornado", tom: "neutro" },
};

function brl(centavos: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    centavos / 100,
  );
}

function data(d: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(d));
}

export default async function MinhaContaPage() {
  const { session } = await requireSessionWithRole("STUDENT");
  const [assinatura, pagamentos] = await Promise.all([
    assinaturaDoAluno(session.user.id),
    pagamentosDoAluno(session.user.id),
  ]);

  const verificado = (session.user as { emailVerified?: boolean }).emailVerified ?? false;
  const situacao = assinatura ? STATUS[assinatura.status] : null;

  return (
    <>
      <PageHeader
        titulo="Minha conta"
        descricao="Seus dados, sua senha e sua assinatura."
      />

      {/* Duas colunas no desktop: perfil e segurança à esquerda, assinatura à
          direita. A assinatura ganha destaque próprio porque é a informação
          que o aluno vem procurar aqui — antes era o terceiro card de uma
          pilha, com o mesmo peso do formulário de senha. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-6">
          <section className="cartao cartao-p-lg">
            <SectionHeading icone={UserRound}>Perfil</SectionHeading>

            <div className="mb-6 flex items-center gap-4">
              <InitialsAvatar nome={session.user.name} tamanho="lg" />
              <div className="min-w-0">
                <p className="t-card-title text-text-primary">{session.user.name}</p>
                <p className="t-meta truncate">{session.user.email}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {verificado ? (
                    <Tag tom="positivo">e-mail confirmado</Tag>
                  ) : (
                    <>
                      <Tag tom="atencao">e-mail não confirmado</Tag>
                      <VerifyEmailButton email={session.user.email} />
                    </>
                  )}
                </div>
              </div>
            </div>

            <ProfileForm nomeInicial={session.user.name} />

            <p className="t-meta mt-4 border-t border-border pt-4">
              Para trocar de e-mail, fale com o suporte: ele é o seu login.
            </p>
          </section>

          <section className="cartao cartao-p-lg">
            <SectionHeading
              icone={KeyRound}
              descricao="Use pelo menos 8 caracteres. Trocar a senha não desconecta seus outros dispositivos."
            >
              Segurança
            </SectionHeading>
            <PasswordForm />
          </section>

          {pagamentos.length > 0 && (
            <section>
              <SectionHeading icone={Receipt}>Histórico de pagamentos</SectionHeading>
              <DataTable
                chave={(p) => p.id}
                linhas={pagamentos}
                colunas={[
                  {
                    chave: "data",
                    cabecalho: "Data",
                    titulo: true,
                    celula: (p) => data(p.paidAt ?? p.createdAt),
                  },
                  {
                    chave: "valor",
                    cabecalho: "Valor",
                    numerico: true,
                    celula: (p) => (
                      <span className="font-medium text-text-primary">{brl(p.amountCents)}</span>
                    ),
                  },
                  {
                    chave: "situacao",
                    cabecalho: "Situação",
                    celula: (p) => {
                      const s = PAGAMENTO[p.status];
                      return <Tag tom={s?.tom ?? "neutro"}>{s?.rotulo ?? p.status}</Tag>;
                    },
                  },
                ]}
              />
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-[calc(var(--shell-header)+1.5rem)]">
          <section className="overflow-hidden rounded-xl border border-brand-200 bg-surface shadow-sm">
            <header className="border-b border-brand-100 bg-gradient-to-br from-brand-50 to-surface px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="t-eyebrow">Plano atual</p>
                  <p className="t-section mt-1 text-text-primary">
                    {assinatura ? assinatura.planoNome : "Sem assinatura"}
                  </p>
                </div>
                <IconTile icone={assinatura ? CreditCard : Sparkles} />
              </div>
              {situacao && (
                <div className="mt-3">
                  <Tag tom={situacao.tom}>{situacao.rotulo}</Tag>
                </div>
              )}
            </header>

            <div className="px-6 py-5">
              {!assinatura ? (
                <>
                  <p className="text-[0.9375rem] leading-relaxed text-text-secondary">
                    Você ainda não tem assinatura. Sem ela, as aulas, o banco de questões e as
                    provas ficam bloqueados.
                  </p>
                  <Link
                    href="/planos"
                    className={buttonVariants({ size: "lg", className: "mt-5 w-full" })}
                  >
                    <Sparkles data-icon="inline-start" aria-hidden />
                    Ver planos
                  </Link>
                </>
              ) : (
                <>
                  <p className="t-metric text-text-primary">{brl(assinatura.planoPreco)}</p>
                  <dl className="mt-5 space-y-3 text-[0.875rem]">
                    <div className="flex justify-between gap-3">
                      <dt className="text-text-muted">Acesso até</dt>
                      <dd className="text-right font-medium text-text-primary">
                        {data(assinatura.currentPeriodEnd)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-text-muted">Assinante desde</dt>
                      <dd className="text-right font-medium text-text-primary">
                        {data(assinatura.createdAt)}
                      </dd>
                    </div>
                  </dl>

                  {/* Regra de negócio intacta: cancelamento e troca de cartão
                      acontecem no Mercado Pago, não aqui. O que mudou é o aluno
                      ver isso como um caminho, e não como um parágrafo em cinza. */}
                  <a
                    href="https://www.mercadopago.com.br/subscriptions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({
                      variant: "outline",
                      className: "mt-5 w-full justify-between",
                    })}
                  >
                    Gerenciar no Mercado Pago
                    <ExternalLink aria-hidden className="size-4" />
                  </a>
                  <p className="t-meta mt-3">
                    Cancelamento e troca de cartão são feitos na sua conta do Mercado Pago, em
                    Assinaturas. O acesso continua até o fim do período já pago.
                  </p>
                </>
              )}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
