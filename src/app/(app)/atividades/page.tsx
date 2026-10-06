import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, FileStack, History, PlayCircle, Target } from "lucide-react";

import { requireAssinatura } from "@/lib/auth/require-subscription";
import { historicoDoAluno, type Atividade } from "@/features/students/queries";
import { estatisticasDoAluno } from "@/features/practice/queries";
import { Button } from "@/components/ui/button";
import { PageHeader, PageShell } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { IllustrationCalendar } from "@/components/illustrations";

export const metadata: Metadata = { title: "Atividades — DespolarizaMED" };

/**
 * Ícone por tipo de atividade. O histórico era uma coluna de badges de texto
 * todas iguais ("Aula concluída", "Prova finalizada"), e a linha do tempo
 * lia-se como uma tabela. O ícone dá o tipo antes da leitura.
 */
function iconeDe(tipo: string) {
  if (tipo.startsWith("Aula concluída")) return CheckCircle2;
  if (tipo.startsWith("Aula")) return PlayCircle;
  if (tipo.startsWith("Prova")) return FileStack;
  if (tipo.startsWith("Plano")) return Target;
  return History;
}

export default async function AtividadesPage() {
  const { session } = await requireAssinatura();
  const [historico, stats] = await Promise.all([
    historicoDoAluno(session.user.id),
    estatisticasDoAluno(session.user.id),
  ]);

  const porDia = new Map<string, Atividade[]>();
  for (const h of historico) {
    const k = h.quando.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
    const lista = porDia.get(k) ?? [];
    lista.push(h);
    porDia.set(k, lista);
  }

  return (
    <PageShell largura="estreita">
      <PageHeader
        titulo="Atividades"
        migalhas={[{ rotulo: "Início", href: "/dashboard" }, { rotulo: "Atividades" }]}
        descricao={
          stats.geral.respondidas > 0 ? (
            <>
              Seu histórico na plataforma. Já são {stats.geral.respondidas.toLocaleString("pt-BR")} questões
              respondidas.
            </>
          ) : (
            "Seu histórico na plataforma, do mais recente para o mais antigo."
          )
        }
        acoes={
          stats.geral.respondidas > 0 ? (
            <Button variant="outline" render={<Link href="/desempenho" />}>
              Ver desempenho
            </Button>
          ) : undefined
        }
      />

      {historico.length === 0 ? (
        <EmptyState
          ilustracao={<IllustrationCalendar />}
          titulo="Nada por aqui ainda"
          descricao="Assim que você assistir a uma aula, resolver questões ou fazer uma prova, tudo aparece nesta linha do tempo."
          acao={
            <>
              <Button render={<Link href="/disciplinas" />}>Começar por uma aula</Button>
              <Button variant="outline" render={<Link href="/questoes" />}>
                Ir para as questões
              </Button>
            </>
          }
        />
      ) : (
        <div className="space-y-8">
          {[...porDia.entries()].map(([dia, lista]) => (
            <section key={dia}>
              <h2 className="mb-3 text-sm font-semibold capitalize text-muted-foreground">{dia}</h2>
              <ol className="overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/8">
                {lista.map((h, i) => {
                  const Icone = iconeDe(h.tipo);
                  return (
                    <li
                      key={h.id}
                      className={`flex items-start gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-border" : ""}`}
                    >
                      <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary"
                        aria-hidden
                      >
                        <Icone className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.9375rem] leading-snug text-foreground">
                          {h.href ? (
                            <Link href={h.href} className="hover:underline">
                              {h.descricao}
                            </Link>
                          ) : (
                            h.descricao
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {h.tipo} ·{" "}
                          {h.quando.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </PageShell>
  );
}
