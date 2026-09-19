import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Clock, Gauge, Target } from "lucide-react";

import { requireAssinatura } from "@/lib/auth/require-subscription";
import { chaveDia, diasAte } from "@/lib/datas";
import { getSubjects } from "@/lib/payload/queries";
import { getPayloadClient } from "@/lib/payload";
import { itensDoPeriodo, planoDoAluno } from "@/features/study-plan/queries";
import { PlanForm } from "@/features/study-plan/components/plan-form";
import { PlanItem } from "@/features/study-plan/components/plan-item";
import { MetricCard, ProgressBar } from "@/components/metric-card";
import { PageHeader, PageShell } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Plano de estudos — DespolarizaMED" };

const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

/**
 * Link de cada item: aula → /aulas/slug; exercícios → banco filtrado pela
 * disciplina; revisão → questões erradas; simulado → /provas.
 */
function destino(
  item: { lessonId: number | null; title: string },
  slugs: Map<number, string>,
  disciplina: string | null,
) {
  if (item.lessonId && slugs.has(item.lessonId)) return `/aulas/${slugs.get(item.lessonId)}`;
  if (item.title.startsWith("Simulado")) return "/provas";
  if (item.title.startsWith("Revisão: refazer")) return "/questoes?situacao=erradas";
  if (disciplina) return `/questoes?disciplina=${encodeURIComponent(disciplina)}`;
  return "/questoes";
}

export default async function PlanoPage({ searchParams }: { searchParams: Promise<{ semana?: string }> }) {
  const { session } = await requireAssinatura();
  const sp = await searchParams;

  const [plano, disciplinas] = await Promise.all([planoDoAluno(session.user.id), getSubjects()]);

  // Semana exibida: segunda a domingo, deslocada por ?semana=±n.
  const deslocamento = Number(sp.semana) || 0;
  const inicioSemana = new Date();
  inicioSemana.setHours(0, 0, 0, 0);
  inicioSemana.setDate(inicioSemana.getDate() - ((inicioSemana.getDay() + 6) % 7) + deslocamento * 7);
  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(fimSemana.getDate() + 6);
  fimSemana.setHours(23, 59, 59, 999);

  const itens = plano ? await itensDoPeriodo(session.user.id, inicioSemana, fimSemana) : [];

  // Slugs das aulas referenciadas nesta semana, para linkar.
  const lessonIds = [...new Set(itens.map((i) => i.lessonId).filter((id): id is number => id !== null))];
  const slugs = new Map<number, string>();
  if (lessonIds.length) {
    const payload = await getPayloadClient();
    const r = await payload.find({
      collection: "lessons",
      where: { id: { in: lessonIds } },
      limit: lessonIds.length,
      depth: 0,
    });
    for (const l of r.docs) slugs.set(l.id, l.slug);
  }
  const nomeDisciplina = new Map(disciplinas.map((d) => [d.id, d.name]));

  const porDia = new Map<string, typeof itens>();
  for (const i of itens) {
    const k = chaveDia(i.scheduledFor);
    const lista = porDia.get(k) ?? [];
    lista.push(i);
    porDia.set(k, lista);
  }
  const diasDaSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicioSemana);
    d.setDate(d.getDate() + i);
    return d;
  });
  const hojeChave = chaveDia(new Date());

  const diasAteProva = plano?.examDate ? diasAte(plano.examDate) : null;

  // Sem plano: a página é o assistente, e nada mais. Um cabeçalho com quatro
  // cartões de métrica vazios em volta só atrapalharia a única coisa que há
  // para fazer aqui.
  if (!plano) {
    return (
      <PageShell>
        <PageHeader
          titulo="Monte seu plano de estudos"
          migalhas={[{ rotulo: "Início", href: "/dashboard" }, { rotulo: "Plano de estudos" }]}
          descricao="Conte quando é sua prova e quanto tempo você tem. Nós organizamos o cronograma, com as aulas publicadas, exercícios e revisões."
        />
        <div className="rounded-2xl bg-card p-6 shadow-xs ring-1 ring-foreground/8 sm:p-8">
          <PlanForm disciplinas={disciplinas.map((d) => ({ id: d.id, name: d.name }))} />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell largura="larga">
      <PageHeader
        titulo="Plano de estudos"
        migalhas={[{ rotulo: "Início", href: "/dashboard" }, { rotulo: "Plano de estudos" }]}
        descricao="Cronograma montado a partir das aulas publicadas, dos seus dias e horas disponíveis e da data da prova."
        acoes={
          <Button variant="outline" render={<Link href="/calendario" />}>
            <CalendarDays />
            Ver no calendário
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard rotulo="Vestibular" valor={plano.targetVestibular ?? "não informado"} icone={Target} />
        <MetricCard
          rotulo="Faltam"
          valor={diasAteProva !== null ? `${diasAteProva} ${diasAteProva === 1 ? "dia" : "dias"}` : "sem data"}
          apoio={plano.examDate ? `prova em ${plano.examDate.split("-").reverse().join("/")}` : undefined}
          icone={CalendarDays}
        />
        <MetricCard
          rotulo="Ritmo"
          valor={`${plano.daysPerWeek}d × ${plano.hoursPerDay}h`}
          apoio="por semana"
          icone={Clock}
        />
        <MetricCard
          rotulo="Progresso"
          valor={`${plano.total ? Math.round((plano.concluidos / plano.total) * 100) : 0}%`}
          apoio={`${plano.concluidos} de ${plano.total} itens`}
          icone={Gauge}
        />
      </div>

      {plano.total > 0 && (
        <ProgressBar
          className="mt-4"
          valor={plano.concluidos}
          total={plano.total}
          rotuloAcessivel={`${plano.concluidos} de ${plano.total} itens do plano concluídos`}
        />
      )}

      {/* O cronograma é o protagonista da página depois de gerado, por isso
          vem antes do "ajustar plano" e ocupa a largura toda. */}
      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
            <CalendarDays className="size-[1.125rem] text-muted-foreground" aria-hidden />
            Semana de {inicioSemana.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} a{" "}
            {fimSemana.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
          </h2>
          <nav className="flex items-center gap-2" aria-label="Navegar entre semanas">
            <Button variant="outline" size="sm" render={<Link href={`/plano?semana=${deslocamento - 1}`} />}>
              <ArrowLeft />
              <span className="max-sm:sr-only">Anterior</span>
            </Button>
            {deslocamento !== 0 && (
              <Button variant="ghost" size="sm" render={<Link href="/plano" />}>
                Hoje
              </Button>
            )}
            <Button variant="outline" size="sm" render={<Link href={`/plano?semana=${deslocamento + 1}`} />}>
              <span className="max-sm:sr-only">Próxima</span>
              <ArrowRight />
            </Button>
          </nav>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {diasDaSemana.map((d) => {
            const k = chaveDia(d);
            const lista = porDia.get(k) ?? [];
            const ehHoje = k === hojeChave;
            return (
              <div
                key={k}
                className={cn(
                  "rounded-xl bg-card p-4 shadow-xs ring-1",
                  ehHoje ? "ring-2 ring-primary" : "ring-foreground/8",
                )}
              >
                <h3 className="mb-3 flex items-baseline gap-2">
                  <span className="font-heading text-sm font-semibold capitalize text-foreground">{DIAS[d.getDay()]}</span>
                  <span className="text-xs text-muted-foreground">
                    {d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                  </span>
                  {ehHoje && (
                    <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[0.6875rem] font-semibold text-primary-foreground">
                      hoje
                    </span>
                  )}
                </h3>
                {lista.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Dia de descanso</p>
                ) : (
                  <ul className="space-y-1.5">
                    {lista.map((i) => (
                      <PlanItem
                        key={i.id}
                        item={{
                          id: i.id,
                          title: i.title,
                          hora: i.scheduledFor.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                          completed: i.completed,
                          href: destino(i, slugs, i.subjectId ? (nomeDisciplina.get(i.subjectId) ?? null) : null),
                        }}
                      />
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <details className="group mt-10 rounded-xl bg-card shadow-xs ring-1 ring-foreground/8">
        <summary className="cursor-pointer list-none px-5 py-4 font-heading font-semibold text-foreground marker:content-none">
          Ajustar plano
          <span className="ml-2 text-sm font-normal text-muted-foreground group-open:hidden">
            (trocar vestibular, data ou ritmo)
          </span>
        </summary>
        <div className="border-t border-border px-5 py-6">
          <PlanForm
            disciplinas={disciplinas.map((d) => ({ id: d.id, name: d.name }))}
            inicial={{
              targetVestibular: plano.targetVestibular,
              examDate: plano.examDate,
              daysPerWeek: plano.daysPerWeek,
              hoursPerDay: plano.hoursPerDay,
            }}
          />
        </div>
      </details>
    </PageShell>
  );
}
