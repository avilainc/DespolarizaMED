import Link from "next/link";
import { unstable_cache } from "next/cache";
import { Check, ShieldCheck } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listarPlanosAtivos } from "@/features/billing/queries";
import { brl, melhorPrecoMensal, periodoDe, porMes } from "@/features/billing/precos";
import { beneficiosPorSlug } from "@/features/marketing/content";
import { CabecalhoDeSecao } from "./secao";

/**
 * Preço vem do banco, não de constante na landing.
 *
 * Antes esta seção lia `plans` de `marketing/content.ts`, com valores fixos que
 * não batiam com a tabela `plans` que o checkout cobra. O visitante via um
 * preço, criava conta e encontrava outro. Ver `features/billing/precos.ts`.
 *
 * O que continua vindo de `content.ts` é só texto de venda (a descrição e a
 * lista de benefícios), que é copy e não tem por que morar no banco.
 *
 * A consulta é cacheada: a home é a página de maior tráfego e preço muda
 * raramente, então 5 minutos de defasagem valem mais que uma consulta ao
 * Postgres por visita. Ver o comentário de `dynamic` em
 * `app/(marketing)/page.tsx` para por que a página não pode ser estática.
 */
const planosParaVitrine = unstable_cache(() => listarPlanosAtivos(), ["planos-ativos-vitrine"], {
  revalidate: 300,
  tags: ["planos"],
});

export async function PlansSection() {
  const planos = await planosParaVitrine();
  const maisBarato = melhorPrecoMensal(planos);

  return (
    <section id="planos" className="secao-vitrine mx-auto max-w-6xl px-4 sm:px-6">
      <CabecalhoDeSecao
        sobretitulo="Assinatura"
        titulo="Planos"
        descricao="Escolha o plano ideal para a sua reta final. Pagamento processado com segurança via Mercado Pago."
      />

      {planos.length === 0 ? (
        // Sem planos cadastrados não há o que anunciar — e inventar um preço
        // aqui seria recriar exatamente a divergência que esta seção corrigiu.
        <p className="mt-12 text-center text-text-secondary">
          Os planos estão sendo atualizados. Volte em instantes.
        </p>
      ) : (
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {planos.map((plano) => {
            const periodo = periodoDe(plano.billingPeriod);
            const destaque = planos.length > 1 && porMes(plano) === maisBarato;
            const beneficios = beneficiosPorSlug[plano.slug] ?? beneficiosPorSlug.padrao;

            return (
              <article
                key={plano.id}
                className={cn(
                  "cartao relative flex flex-col overflow-hidden",
                  // O plano em destaque é o único cartão com sombra e com o
                  // laranja do "MED" (tarja, borda e botão) — o "Recomendado"
                  // da versão do Paulo.
                  destaque && "border-destaque shadow-[var(--shadow-nivel-2)]",
                )}
              >
                {/* A tarja existe nos TRÊS cartões; nos outros dois ela é
                    invisível. Renderizá-la só no destaque empurrava o título, o
                    preço e o botão daquele cartão 35px para baixo, e as três
                    colunas ficavam desencontradas — exatamente o defeito que as
                    alturas reservadas abaixo já tentavam evitar.
                    Abaixo de `md` a grade vira uma coluna: não há nada para
                    alinhar, e a tarja invisível seria só uma faixa vazia no
                    topo de dois cartões. Aí ela sai do fluxo. */}
                <p
                  aria-hidden={!destaque}
                  className={cn(
                    "px-5 py-2 text-center text-[0.75rem] font-semibold tracking-wide",
                    destaque ? "bg-destaque text-destaque-texto" : "hidden md:invisible md:block",
                  )}
                >
                  {destaque ? "Melhor preço por mês" : "\u00a0"}
                </p>

                <div className="cartao-p-lg flex flex-1 flex-col">
                  <h3 className="t-section text-text-primary">{plano.name}</h3>
                  {/* Altura reservada mesmo com uma linha só: sem isto os três
                      cartões desalinham o preço e o destacado parece de outro
                      tamanho. */}
                  <p className="mt-1.5 min-h-11 text-[0.875rem] leading-relaxed text-text-secondary">
                    {beneficios.descricao}
                  </p>

                  <p className="mt-5 flex items-baseline gap-1.5">
                    <span className="t-metric text-text-primary">{brl(plano.priceCents)}</span>
                    <span className="text-[0.875rem] text-text-muted">{periodo.curto}</span>
                  </p>
                  {/* O equivalente mensal fica sempre presente (invisível quando
                      não se aplica) para os três cartões manterem a mesma altura. */}
                  <p
                    className={cn(
                      "t-meta tabular mt-1.5",
                      periodo.meses === 1 && "invisible",
                    )}
                    aria-hidden={periodo.meses === 1}
                  >
                    equivale a {brl(porMes(plano))} por mês
                  </p>

                  <ul className="mt-6 flex-1 space-y-2.5 border-t border-border pt-6">
                    {beneficios.itens.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-[0.9375rem]">
                        <Check
                          aria-hidden
                          strokeWidth={2.5}
                          className="mt-0.5 size-4 shrink-0 text-success"
                        />
                        <span className="text-text-secondary">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/cadastro?plano=${plano.slug}`}
                    className={buttonVariants({
                      size: "lg",
                      variant: destaque ? "destaque" : "outline",
                      className: "mt-7 w-full",
                    })}
                  >
                    Assinar {plano.name}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="mt-8 flex items-center justify-center gap-2 text-center text-[0.8125rem] text-text-muted">
        <ShieldCheck aria-hidden className="size-4 shrink-0" />
        Renovação automática no fim de cada período. Cancele quando quiser, pelo Mercado Pago ou em
        Minha conta.
      </p>
    </section>
  );
}
