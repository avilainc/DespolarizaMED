import type { Metadata } from "next";
import Link from "next/link";
import { Check, CircleCheck, ShieldCheck } from "lucide-react";

import { requireSessionWithRole } from "@/lib/auth/require-session";
import { listarPlanosAtivos, assinaturaVigente } from "@/features/billing/queries";
import { brl, melhorPrecoMensal, periodoDe, porMes } from "@/features/billing/precos";
import { beneficiosPorSlug } from "@/features/marketing/content";
import { assinar } from "@/features/billing/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/page-header";
import { IllustrationDna, IllustrationExam } from "@/components/illustrations";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Planos — DespolarizaMED" };

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
  // O plano mensal é a régua da economia. Sem ele no conjunto não há
  // comparação honesta a fazer, e aí nenhum card anuncia desconto.
  const mensal = planos.find((p) => periodoDe(p.billingPeriod).meses === 1);

  return (
    <PageShell largura="larga">
      {/* Hero com as duas ilustrações da marca em marca d'água: é a única
          página da área logada que precisa vender alguma coisa, então ganha
          presença gráfica que as outras não têm. */}
      <header className="relative overflow-hidden rounded-2xl bg-card px-6 py-12 text-center shadow-xs ring-1 ring-foreground/8 sm:px-10 sm:py-16">
        <IllustrationDna
          className="pointer-events-none absolute -top-8 -left-6 hidden h-56 w-auto text-primary/[0.07] sm:block"
          aria-hidden
        />
        <IllustrationExam
          className="pointer-events-none absolute -right-6 -bottom-10 hidden h-56 w-auto text-primary/[0.07] sm:block"
          aria-hidden
        />
        <div className="relative mx-auto max-w-2xl">
          <h1 className="font-heading text-3xl leading-tight font-semibold text-balance text-foreground sm:text-4xl">
            Escolha o ritmo da sua preparação
          </h1>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-muted-foreground">
            Tenha acesso a aulas, banco de questões, provas antigas, plano de estudos e plantões ao vivo
            com os professores.
          </p>
        </div>
      </header>

      {escolhido && !vigente && (
        <p className="mx-auto mt-6 max-w-2xl rounded-xl border border-primary/30 bg-primary/5 px-5 py-4 text-center text-sm text-foreground">
          Você escolheu o plano <strong className="font-semibold">{escolhido.name}</strong>. Confirme abaixo
          para concluir.
        </p>
      )}

      {vigente && (
        <p className="mx-auto mt-6 flex max-w-2xl items-center justify-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-500/8 px-5 py-4 text-center text-sm text-foreground">
          <CircleCheck className="size-[1.125rem] shrink-0 text-emerald-600" aria-hidden />
          Você já tem uma assinatura{" "}
          <strong className="font-semibold">
            {vigente.status === "ACTIVE" ? "ativa" : "em regularização"}
          </strong>
          .{" "}
          <Link href="/minha-conta" className="font-medium text-primary hover:underline">
            Gerenciar
          </Link>
        </p>
      )}

      {planos.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">Nenhum plano disponível no momento.</p>
      ) : (
        <div className="mt-10 grid items-start gap-5 lg:grid-cols-3">
          {planos.map((plano) => {
            const periodo = periodoDe(plano.billingPeriod);
            const beneficios = beneficiosPorSlug[plano.slug] ?? beneficiosPorSlug.padrao;
            // O plano que a pessoa escolheu na landing manda no destaque; sem
            // ela, destaca-se o melhor preço por mês.
            const destaque = escolhido
              ? plano.slug === escolhido.slug
              : planos.length > 1 && porMes(plano) === maisBarato;

            // Economia só quando existe base de comparação e o número é
            // positivo de verdade: anunciar "economize 0%" ou inventar um
            // "de/por" é o tipo de coisa que quebra a confiança na página
            // inteira.
            const economia =
              mensal && periodo.meses > 1 && porMes(plano) < mensal.priceCents
                ? Math.round((1 - porMes(plano) / mensal.priceCents) * 100)
                : null;

            return (
              <div
                key={plano.id}
                className={cn(
                  "relative flex h-full flex-col rounded-2xl bg-card p-6 shadow-xs ring-1",
                  destaque ? "ring-2 ring-primary lg:-mt-2 lg:pb-8" : "ring-foreground/8",
                )}
              >
                <div className="flex h-6 items-center gap-2">
                  {destaque && <Badge>Melhor preço</Badge>}
                  {economia !== null && !destaque && (
                    <Badge variant="secondary">Economize {economia}%</Badge>
                  )}
                  {economia !== null && destaque && (
                    <span className="text-xs font-medium text-emerald-700">Economize {economia}%</span>
                  )}
                </div>

                <h2 className="mt-3 font-heading text-xl font-semibold text-foreground">{plano.name}</h2>
                <p className="mt-1 min-h-10 text-sm leading-relaxed text-muted-foreground">
                  {beneficios.descricao}
                </p>

                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="font-heading text-4xl leading-none font-semibold tabular-nums text-foreground">
                    {brl(plano.priceCents)}
                  </span>
                  <span className="text-sm text-muted-foreground">{periodo.curto}</span>
                </div>
                {/* Sempre presente, invisível quando não se aplica, para os três
                    cards manterem a mesma altura de bloco de preço. */}
                <p
                  className={cn("mt-1.5 text-sm text-muted-foreground", periodo.meses === 1 && "invisible")}
                  aria-hidden={periodo.meses === 1}
                >
                  equivale a {brl(porMes(plano))} por mês
                </p>

                <ul className="mt-6 space-y-2.5">
                  {beneficios.itens.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                      <span className="leading-relaxed text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-6">
                  {vigente ? (
                    // Assinante ativo não vê três botões apagados, que é o que
                    // dava aparência de tela quebrada: vê o estado da conta e
                    // o caminho para mexer nela.
                    <Button variant="outline" className="w-full" render={<Link href="/minha-conta" />}>
                      Gerenciar assinatura
                    </Button>
                  ) : (
                    <form action={assinar}>
                      <input type="hidden" name="plano" value={plano.slug} />
                      <Button
                        type="submit"
                        size="lg"
                        variant={destaque ? "default" : "outline"}
                        className="w-full"
                      >
                        Assinar {plano.name}
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-10 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <ShieldCheck className="size-4 shrink-0" aria-hidden />
        Pagamento processado pelo Mercado Pago. Renovação automática no fim de cada período, e você
        cancela quando quiser.
      </p>
    </PageShell>
  );
}
