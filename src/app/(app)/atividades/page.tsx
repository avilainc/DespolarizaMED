import type { Metadata } from "next";
import Link from "next/link";
import { CircleHelp, FileText, History, PlayCircle, TrendingUp } from "lucide-react";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { historicoDoAluno } from "@/features/students/queries";
import { estatisticasDoAluno } from "@/features/practice/queries";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { IconTile } from "@/components/ui/surface";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Atividades — DespolarizaMED" };

/**
 * Ícone e cor por tipo de atividade. O tipo vinha como um `<Badge>` de texto
 * cru ("LESSON_PROGRESS"); com ícone, a linha do tempo pode ser percorrida
 * sem ler cada rótulo.
 */
const TIPOS: Record<string, { icone: typeof PlayCircle; cor: string }> = {
  aula: { icone: PlayCircle, cor: "var(--materia-bio)" },
  prova: { icone: FileText, cor: "var(--brand-600)" },
  questão: { icone: CircleHelp, cor: "var(--materia-fis)" },
  questao: { icone: CircleHelp, cor: "var(--materia-fis)" },
  plano: { icone: TrendingUp, cor: "var(--materia-quim)" },
};

function visualDoTipo(tipo: string) {
  const chave = tipo.toLocaleLowerCase("pt-BR");
  for (const [k, v] of Object.entries(TIPOS)) if (chave.includes(k)) return v;
  return { icone: History, cor: "var(--brand-500)" };
}

export default async function AtividadesPage() {
  const { session } = await requireAssinatura();
  const [historico, stats] = await Promise.all([
    historicoDoAluno(session.user.id),
    estatisticasDoAluno(session.user.id),
  ]);

  const porDia = new Map<string, typeof historico>();
  for (const h of historico) {
    const k = h.quando.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
    const lista = porDia.get(k) ?? [];
    lista.push(h);
    porDia.set(k, lista);
  }

  return (
    <>
      <PageHeader
        titulo="Atividades"
        descricao="Seu histórico na plataforma, do mais recente para o mais antigo."
        acoes={
          stats.geral.respondidas > 0 ? (
            <Link href="/desempenho" className={buttonVariants({ variant: "outline" })}>
              <TrendingUp data-icon="inline-start" aria-hidden />
              Ver desempenho
            </Link>
          ) : undefined
        }
      />

      {historico.length === 0 ? (
        <EmptyState
          ilustracao="/illustrations/vazio-desempenho.svg"
          titulo="Nada por aqui ainda"
          descricao="Assista a uma aula, responda uma questão ou resolva uma prova — tudo isso passa a aparecer nesta linha do tempo."
          acao={
            <Link href="/disciplinas" className={buttonVariants()}>
              Começar pelas disciplinas
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          {[...porDia.entries()].map(([dia, lista]) => (
            <section key={dia}>
              <h2 className="t-eyebrow mb-3 flex items-center gap-3">
                <span className="capitalize">{dia}</span>
                <span aria-hidden className="h-px flex-1 bg-border" />
              </h2>

              {/* Linha vertical ligando os itens do dia: é o que faz isto
                  parecer uma linha do tempo, e não uma lista de caixas. */}
              <ol className="relative space-y-2 before:absolute before:bottom-4 before:left-[1.1875rem] before:top-4 before:w-px before:bg-border">
                {lista.map((h) => {
                  const visual = visualDoTipo(h.tipo);
                  return (
                    <li key={h.id} className="relative flex items-center gap-3">
                      <span className="relative z-10 rounded-full bg-background p-0.5">
                        <IconTile icone={visual.icone} cor={visual.cor} tamanho="sm" />
                      </span>
                      <div className="min-w-0 flex-1 rounded-lg cartao px-4 py-2.5">
                        <div className="flex flex-wrap items-baseline gap-x-3">
                          <span className="t-meta tabular shrink-0">
                            {h.quando.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {h.href ? (
                            <Link
                              href={h.href}
                              className="min-w-0 text-[0.9375rem] text-text-primary hover:underline"
                            >
                              {h.descricao}
                            </Link>
                          ) : (
                            <span className="min-w-0 text-[0.9375rem] text-text-primary">
                              {h.descricao}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
