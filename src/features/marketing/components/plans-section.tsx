import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

import { listarPlanosAtivos } from "@/features/billing/queries";
import { brl, melhorPrecoMensal, periodoDe, porMes } from "@/features/billing/precos";
import { beneficiosPorSlug } from "@/features/marketing/content";

/**
 * Preço vem do banco, não de constante na landing.
 *
 * Antes esta seção lia `plans` de `marketing/content.ts`, com valores fixos que
 * não batiam com a tabela `plans` que o checkout cobra. O visitante via um
 * preço, criava conta e encontrava outro. Ver `features/billing/precos.ts`.
 *
 * O que continua vindo de `content.ts` é só texto de venda (a descrição e a
 * lista de benefícios), que é copy e não tem por que morar no banco.
 */
export async function PlansSection() {
  const planos = await listarPlanosAtivos();
  const maisBarato = melhorPrecoMensal(planos);

  return (
    <section id="planos" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Planos e assinatura
        </h2>
        <p className="mt-3 text-muted-foreground">
          Escolha o plano ideal para a sua reta final. Pagamento processado com segurança via
          Mercado Pago.
        </p>
      </div>

      {planos.length === 0 ? (
        // Sem planos cadastrados não há o que anunciar — e inventar um preço
        // aqui seria recriar exatamente a divergência que esta seção corrigiu.
        <p className="mt-12 text-center text-muted-foreground">
          Os planos estão sendo atualizados. Volte em instantes.
        </p>
      ) : (
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {planos.map((plano) => {
            const periodo = periodoDe(plano.billingPeriod);
            const destaque = planos.length > 1 && porMes(plano) === maisBarato;
            const beneficios = beneficiosPorSlug[plano.slug] ?? beneficiosPorSlug.padrao;

            return (
              <Card
                key={plano.id}
                className={cn(
                  "flex flex-col",
                  destaque && "border-primary shadow-lg ring-1 ring-primary",
                )}
              >
                <CardHeader>
                  {/* Altura reservada mesmo sem badge: sem isto os três cards
                      desalinham o preço, e o destacado parece de outro tamanho. */}
                  <div className="mb-2 flex h-6 items-center">
                    {destaque && <Badge variant="default">Melhor preço por mês</Badge>}
                  </div>
                  <CardTitle className="text-xl">{plano.name}</CardTitle>
                  <p className="min-h-10 text-sm text-muted-foreground">{beneficios.descricao}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">
                      {brl(plano.priceCents)}
                    </span>
                    <span className="text-sm text-muted-foreground">{periodo.curto}</span>
                  </div>
                  {/* O equivalente mensal fica sempre presente (invisível quando
                      não se aplica) para os três cards manterem a mesma altura. */}
                  <p
                    className={cn(
                      "mt-1 text-sm text-muted-foreground",
                      periodo.meses === 1 && "invisible",
                    )}
                    aria-hidden={periodo.meses === 1}
                  >
                    equivale a {brl(porMes(plano))} por mês
                  </p>
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-2">
                    {beneficios.itens.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Link
                    href={`/cadastro?plano=${plano.slug}`}
                    className={buttonVariants({
                      className: "w-full",
                      variant: destaque ? "default" : "outline",
                    })}
                  >
                    Assinar {plano.name}
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Renovação automática no fim de cada período. Cancele quando quiser, pelo Mercado Pago ou
        em Minha conta.
      </p>
    </section>
  );
}
