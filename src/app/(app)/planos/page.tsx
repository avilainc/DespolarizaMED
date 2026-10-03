import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Check, CircleHelp, FileText, PlayCircle, ShieldCheck, Video } from "lucide-react";
import { requireSessionWithRole } from "@/lib/auth/require-session";
import { listarPlanosAtivos, assinaturaVigente } from "@/features/billing/queries";
import { brl, melhorPrecoMensal, periodoDe, porMes } from "@/features/billing/precos";
import { assinar } from "@/features/billing/actions";
import { EmptyState } from "@/components/ui/empty-state";
import { Tag } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Planos — DespolarizaMED" };

const INCLUI = [
  { icone: PlayCircle, texto: "Todas as aulas, com material de apoio" },
  { icone: CircleHelp, texto: "Banco de questões com gabarito conferido" },
  { icone: FileText, texto: "Provas antigas para resolver do começo ao fim" },
  { icone: Video, texto: "Plantões e palestras ao vivo com os professores" },
];

/**
 * `?plano=<slug>` chega de quem escolheu na landing e acabou de criar a conta.
 * Serve só para destacar o card certo e dizer que a escolha foi preservada —
 * quem assina continua sendo a action `assinar`, com o slug do próprio card.
 */
export default async function PlanosPage({
  searchParams,
}: {
  searchParams: Promise<{ plano?: string }>;
}) {
  const { session } = await requireSessionWithRole("STUDENT");
  const { plano: vindoDaLanding } = await searchParams;
  const [planos, vigente] = await Promise.all([
    listarPlanosAtivos(),
    assinaturaVigente(session.user.id),
  ]);

  const maisBarato = melhorPrecoMensal(planos);
  const escolhido = planos.find((p) => p.slug === vindoDaLanding);
  const mensal = planos.find((p) => periodoDe(p.billingPeriod).meses === 1);

  return (
    <>
      {/* Hero de produto. O que estava aqui era um <h1> centralizado sobre
          fundo branco — funcional, mas sem nada que dissesse o que se está
          comprando antes de olhar os preços. */}
      <section className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-surface to-surface px-6 py-10 sm:px-10 sm:py-12">
        <div
          aria-hidden
          className="trama-axonio pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom_right,black,transparent_70%)]"
        />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0 max-w-2xl">
            <h1 className="t-display text-text-primary">Escolha o ritmo da sua preparação</h1>
            <p className="mt-3 text-[1.0625rem] leading-relaxed text-text-secondary">
              O mesmo acesso completo nos três planos: aulas, banco de questões, provas antigas,
              plano de estudos e plantões ao vivo. O que muda é por quanto tempo você paga de uma
              vez.
            </p>

            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {INCLUI.map(({ icone: Icone, texto }) => (
                <li key={texto} className="flex items-start gap-2.5 text-[0.9375rem]">
                  <Icone aria-hidden className="mt-0.5 size-[1.125rem] shrink-0 text-brand-600" />
                  <span className="text-text-secondary">{texto}</span>
                </li>
              ))}
            </ul>
          </div>

          <Image
            src="/illustrations/estudo-questoes.svg"
            alt=""
            aria-hidden
            width={220}
            height={165}
            className="hidden h-auto w-52 justify-self-end lg:block"
          />
        </div>
      </section>

      {escolhido && !vigente && (
        <p className="mt-6 rounded-xl border border-brand-200 bg-brand-50 px-5 py-4 text-[0.9375rem] text-brand-800">
          Você escolheu o plano <strong className="font-semibold">{escolhido.name}</strong>.
          Confirme abaixo para concluir.
        </p>
      )}

      {vigente && (
        <p className="mt-6 flex items-center gap-2.5 rounded-xl border border-success/30 bg-success-soft px-5 py-4 text-[0.9375rem] text-success-text">
          <ShieldCheck aria-hidden className="size-5 shrink-0" />
          Você já tem uma assinatura{" "}
          <strong className="font-semibold">
            {vigente.status === "ACTIVE" ? "ativa" : "em regularização"}
          </strong>
          . Para trocar de plano ou cancelar, use a sua conta do Mercado Pago.
        </p>
      )}

      {planos.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icone={CircleHelp}
            titulo="Nenhum plano disponível no momento"
            descricao="Os planos estão sendo ajustados. Tente novamente em alguns minutos ou fale com o suporte."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {planos.map((plano) => {
            // O plano que a pessoa escolheu na landing manda no destaque; sem
            // ela, destaca-se o melhor preço por mês.
            const destaque = escolhido
              ? plano.slug === escolhido.slug
              : planos.length > 1 && porMes(plano) === maisBarato;
            const periodo = periodoDe(plano.billingPeriod);
            const esteEhOAtual = vigente?.planId === plano.id;

            // A economia só é anunciada quando é matematicamente verdadeira:
            // o plano mensal precisa existir e ser mais caro por mês.
            const economia =
              mensal && periodo.meses > 1 && porMes(plano) < mensal.priceCents
                ? Math.round((1 - porMes(plano) / mensal.priceCents) * 100)
                : null;

            return (
              <section
                key={plano.id}
                className={`relative flex flex-col overflow-hidden rounded-xl border bg-surface ${
                  destaque
                    ? "border-brand-400 shadow-md ring-1 ring-brand-200"
                    : "border-border shadow-xs"
                }`}
              >
                {destaque && (
                  <p className="bg-acao py-1.5 text-center text-[0.6875rem] font-semibold uppercase tracking-[0.07em] text-white">
                    Melhor preço por mês
                  </p>
                )}

                <div className="flex flex-1 flex-col cartao-p-lg">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="t-section text-text-primary">{plano.name}</h2>
                    {esteEhOAtual && <Tag tom="positivo">seu plano</Tag>}
                  </div>

                  <p className="mt-4">
                    <span className="t-metric text-text-primary">{brl(plano.priceCents)}</span>
                    <span className="ml-1.5 text-[0.9375rem] text-text-muted">
                      {periodo.curto}
                    </span>
                  </p>
                  <p className="t-meta mt-1">
                    {periodo.meses > 1 ? (
                      <>
                        {brl(porMes(plano))} por mês · cobrado {periodo.rotulo}
                      </>
                    ) : (
                      <>cobrado {periodo.rotulo}</>
                    )}
                  </p>

                  {economia !== null && economia > 0 && (
                    <p className="mt-3">
                      <Tag tom="positivo">economia de {economia}% frente ao mensal</Tag>
                    </p>
                  )}

                  <ul className="mt-6 flex-1 space-y-2.5 text-[0.875rem]">
                    {INCLUI.map(({ texto }) => (
                      <li key={texto} className="flex items-start gap-2">
                        <Check
                          aria-hidden
                          className="mt-0.5 size-4 shrink-0 text-success"
                          strokeWidth={2.5}
                        />
                        <span className="text-text-secondary">{texto}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6">
                    {/* O plano ativo mostra um estado próprio em vez de deixar
                        os três botões com cara de desabilitado — o aluno
                        assinante precisa saber QUAL é o dele, não descobrir que
                        nada é clicável. */}
                    {esteEhOAtual ? (
                      <p className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-success/30 bg-success-soft px-4 text-[0.9375rem] font-medium text-success-text">
                        <ShieldCheck aria-hidden className="size-4" />
                        Assinatura ativa
                      </p>
                    ) : vigente ? (
                      <p className="flex min-h-11 items-center justify-center rounded-lg bg-surface-subtle px-4 text-center text-[0.8125rem] text-text-muted">
                        Troque de plano pelo Mercado Pago
                      </p>
                    ) : (
                      <form action={assinar}>
                        <input type="hidden" name="plano" value={plano.slug} />
                        <Button
                          type="submit"
                          size="lg"
                          variant={destaque ? "default" : "outline"}
                          className="w-full"
                        >
                          Assinar o {plano.name.toLocaleLowerCase("pt-BR")}
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      <p className="mt-8 flex flex-wrap items-center justify-center gap-2 text-[0.8125rem] text-text-muted">
        <ShieldCheck aria-hidden className="size-4" />
        Pagamento processado pelo Mercado Pago. Cancele quando quiser —{" "}
        <Link href="/minha-conta" className="text-brand-600 hover:underline">
          gerencie na sua conta
        </Link>
        .
      </p>
    </>
  );
}
