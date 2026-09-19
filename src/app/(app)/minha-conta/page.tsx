import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, CreditCard, KeyRound, Receipt, TriangleAlert, User } from "lucide-react";

import { requireSessionWithRole } from "@/lib/auth/require-session";
import { assinaturaDoAluno, pagamentosDoAluno } from "@/features/account/queries";
import { ProfileForm } from "@/features/account/components/profile-form";
import { PasswordForm } from "@/features/account/components/password-form";
import { VerifyEmailButton } from "@/features/account/components/verify-email-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, PageShell, SectionHeading } from "@/components/page-header";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Minha conta — DespolarizaMED" };

const STATUS: Record<string, { rotulo: string; tom: "default" | "secondary" | "destructive" }> = {
  ACTIVE: { rotulo: "Ativa", tom: "default" },
  PENDING: { rotulo: "Aguardando pagamento", tom: "secondary" },
  PAST_DUE: { rotulo: "Pagamento pendente", tom: "destructive" },
  CANCELLED: { rotulo: "Cancelada", tom: "secondary" },
  EXPIRED: { rotulo: "Expirada", tom: "secondary" },
};

const PAGAMENTO: Record<string, string> = {
  APPROVED: "Pago",
  PENDING: "Processando",
  FAILED: "Recusado",
  REFUNDED: "Estornado",
};

function brl(centavos: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100);
}

function data(d: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(d));
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes.at(-1)?.[0] ?? "")).toUpperCase();
}

export default async function MinhaContaPage() {
  const { session } = await requireSessionWithRole("STUDENT");
  const [assinatura, pagamentos] = await Promise.all([
    assinaturaDoAluno(session.user.id),
    pagamentosDoAluno(session.user.id),
  ]);

  const verificado = (session.user as { emailVerified?: boolean }).emailVerified ?? false;
  const ativa = assinatura?.status === "ACTIVE";

  return (
    <PageShell>
      <PageHeader
        titulo="Minha conta"
        migalhas={[{ rotulo: "Início", href: "/dashboard" }, { rotulo: "Minha conta" }]}
        descricao="Seus dados, sua senha e sua assinatura."
      />

      {/* Assinatura primeiro, e não perdida no fim da página: é a informação
          que o aluno vem procurar aqui, e a única que tem consequência se
          estiver errada. */}
      <section>
        <SectionHeading titulo="Assinatura" icone={CreditCard} />
        {!assinatura ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-card p-6 shadow-xs ring-1 ring-foreground/8">
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">Você ainda não assinou</p>
              <p className="mt-1 text-sm text-muted-foreground">
                As aulas, o banco de questões e os plantões ficam liberados com qualquer um dos planos.
              </p>
            </div>
            <Button render={<Link href="/planos" />}>Ver planos</Button>
          </div>
        ) : (
          <div
            className={cn(
              "overflow-hidden rounded-xl bg-card shadow-xs ring-1",
              ativa ? "ring-emerald-600/25" : "ring-foreground/8",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-4 p-6">
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Plano atual</p>
                <p className="mt-1.5 font-heading text-2xl font-semibold text-foreground">
                  {assinatura.planoNome}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {brl(assinatura.planoPreco)} · válido até {data(assinatura.currentPeriodEnd)}
                </p>
              </div>
              <Badge variant={STATUS[assinatura.status]?.tom ?? "secondary"}>
                {ativa && <CircleCheck className="size-3!" aria-hidden />}
                {STATUS[assinatura.status]?.rotulo ?? assinatura.status}
              </Badge>
            </div>

            <dl className="grid gap-px border-t border-border bg-border sm:grid-cols-2">
              <div className="bg-card px-6 py-4">
                <dt className="text-xs text-muted-foreground">Assinante desde</dt>
                <dd className="mt-0.5 font-medium text-foreground">{data(assinatura.createdAt)}</dd>
              </div>
              <div className="bg-card px-6 py-4">
                <dt className="text-xs text-muted-foreground">Cobrança</dt>
                <dd className="mt-0.5 font-medium text-foreground">Mercado Pago</dd>
              </div>
            </dl>

            <p className="border-t border-border bg-muted/30 px-6 py-4 text-xs leading-relaxed text-muted-foreground">
              Cancelamento e troca de cartão são feitos na sua conta do Mercado Pago, em Assinaturas. O
              acesso continua até o fim do período já pago.
            </p>
          </div>
        )}
      </section>

      <section className="mt-10">
        <SectionHeading titulo="Perfil" icone={User} />
        <div className="rounded-xl bg-card p-6 shadow-xs ring-1 ring-foreground/8">
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              <AvatarFallback>{iniciais(session.user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{session.user.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="truncate text-sm text-muted-foreground">{session.user.email}</span>
                {verificado ? (
                  <Badge variant="secondary">
                    <CircleCheck className="size-3!" aria-hidden />
                    confirmado
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <TriangleAlert className="size-3!" aria-hidden />
                    não confirmado
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {!verificado && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
              <p className="min-w-0 flex-1 text-sm text-foreground">
                Confirme seu e-mail para não perder avisos de plantão e de cobrança.
              </p>
              <VerifyEmailButton email={session.user.email} />
            </div>
          )}

          <div className="mt-6 border-t border-border pt-6">
            <ProfileForm nomeInicial={session.user.name} />
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Para trocar de e-mail, fale com o suporte: ele é o seu login.
          </p>
        </div>
      </section>

      <section className="mt-10">
        <SectionHeading titulo="Segurança" icone={KeyRound} />
        <div className="rounded-xl bg-card p-6 shadow-xs ring-1 ring-foreground/8">
          <PasswordForm />
        </div>
      </section>

      {pagamentos.length > 0 && (
        <section className="mt-10">
          <SectionHeading titulo="Pagamentos" icone={Receipt} />
          {/* Tabela no desktop, cartões no celular: a mesma informação, sem a
              rolagem horizontal que a tabela produzia numa tela estreita. */}
          <div className="overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/8">
            <table className="hidden w-full text-sm sm:table">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 py-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Data
                  </th>
                  <th className="px-5 py-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Valor
                  </th>
                  <th className="px-5 py-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Situação
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagamentos.map((p, i) => (
                  <tr key={p.id} className={i > 0 ? "border-t border-border" : undefined}>
                    <td className="px-5 py-3 text-muted-foreground">{data(p.paidAt ?? p.createdAt)}</td>
                    <td className="px-5 py-3 font-medium tabular-nums text-foreground">{brl(p.amountCents)}</td>
                    <td className="px-5 py-3 text-muted-foreground">{PAGAMENTO[p.status] ?? p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="sm:hidden">
              {pagamentos.map((p, i) => (
                <li
                  key={p.id}
                  className={cn("flex items-center justify-between gap-3 px-4 py-3", i > 0 && "border-t border-border")}
                >
                  <div className="min-w-0">
                    <p className="font-medium tabular-nums text-foreground">{brl(p.amountCents)}</p>
                    <p className="text-xs text-muted-foreground">{data(p.paidAt ?? p.createdAt)}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {PAGAMENTO[p.status] ?? p.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </PageShell>
  );
}
