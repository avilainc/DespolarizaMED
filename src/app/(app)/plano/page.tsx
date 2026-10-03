import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  ListChecks,
  Settings2,
  Timer,
} from "lucide-react";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { chaveDia, diasAte } from "@/lib/datas";
import { visualDaMateria } from "@/lib/materias";
import { getSubjects } from "@/lib/payload/queries";
import { getPayloadClient } from "@/lib/payload";
import { itensDoPeriodo, planoDoAluno } from "@/features/study-plan/queries";
import { PlanForm } from "@/features/study-plan/components/plan-form";
import { PlanItem } from "@/features/study-plan/components/plan-item";
import { PageHeader, SectionHeading } from "@/components/ui/page-header";
import { MetricCard, ProgressBar } from "@/components/ui/metric-card";

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

export default async function PlanoPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>;
}) {
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
  const opcoesDisciplinas = disciplinas.map((d) => ({ id: d.id, name: d.name, slug: d.slug }));

  /* ------------------------------------------------------------------
     Sem plano: a tela inteira é o assistente. É a única coisa a fazer
     aqui, então não faz sentido escondê-la dentro de um card genérico
     chamado "Vamos montar o seu cronograma", como era antes.
     ------------------------------------------------------------------ */
  if (!plano) {
    return (
      <>
        <PageHeader
          titulo="Monte seu plano de estudos"
          descricao="Conte quando é sua prova e quanto tempo você tem por semana. Nós organizamos o cronograma com as aulas publicadas, os exercícios e as revisões."
        />

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
          <div className="cartao cartao-p-lg">
            <PlanForm disciplinas={opcoesDisciplinas} />
          </div>

          <aside className="hidden rounded-xl border border-brand-100 bg-brand-50/60 cartao-p-lg lg:block">
            <Image
              src="/illustrations/estudo-calendario.svg"
              alt=""
              aria-hidden
              width={176}
              height={132}
              className="mx-auto h-auto w-40"
            />
            <p className="t-card-title mt-4 text-text-primary">Como o cronograma é montado</p>
            <ul className="mt-3 space-y-2 text-[0.875rem] leading-relaxed text-text-secondary">
              <li>As aulas publicadas entram em ordem, disciplina por disciplina.</li>
              <li>As matérias que você marcar como difíceis aparecem com o dobro da frequência.</li>
              <li>Uma revisão do que você errou fecha cada semana.</li>
              <li>Você pode refazer o plano quando quiser — o que já concluiu fica.</li>
            </ul>
          </aside>
        </div>
      </>
    );
  }

  /* ------------------------------------------------------------------
     Com plano: o cronograma é o protagonista.
     ------------------------------------------------------------------ */
  const pctPlano = plano.total ? Math.round((plano.concluidos / plano.total) * 100) : 0;

  return (
    <>
      <PageHeader
        titulo="Plano de estudos"
        descricao={`Cronograma para ${plano.targetVestibular ?? "o seu vestibular"}, montado a partir das aulas publicadas e do tempo que você declarou ter.`}
        acoes={
          <Link
            href="/calendario"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-[0.875rem] font-medium text-text-secondary transition-colors hover:border-brand-300 hover:text-text-primary"
          >
            <CalendarDays aria-hidden className="size-4" />
            Ver no calendário
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icone={GraduationCap}
          rotulo="Vestibular"
          valor={plano.targetVestibular ?? "—"}
        />
        <MetricCard
          icone={Timer}
          rotulo="Faltam"
          valor={diasAteProva ?? "—"}
          apoio={diasAteProva === 1 ? "dia para a prova" : "dias para a prova"}
        />
        <MetricCard
          icone={CalendarDays}
          rotulo="Ritmo declarado"
          valor={`${plano.daysPerWeek}d × ${plano.hoursPerDay}h`}
          apoio="por semana"
        />
        <MetricCard
          icone={ListChecks}
          rotulo="Progresso do plano"
          valor={`${pctPlano}%`}
          apoio={`${plano.concluidos} de ${plano.total} itens concluídos`}
          tom={pctPlano >= 70 ? "positivo" : pctPlano >= 30 ? "neutro" : "atencao"}
        />
      </div>

      <div className="mt-3">
        <ProgressBar
          valor={plano.concluidos}
          total={Math.max(1, plano.total)}
          rotulo="Progresso do plano de estudos"
        />
      </div>

      <section className="secao">
        <SectionHeading
          icone={CalendarDays}
          acao={
            <nav className="flex items-center gap-1" aria-label="Trocar de semana">
              <Link
                href={`/plano?semana=${deslocamento - 1}`}
                aria-label="Semana anterior"
                className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary transition-colors hover:border-brand-300 hover:text-text-primary"
              >
                <ChevronLeft aria-hidden className="size-4" />
              </Link>
              {deslocamento !== 0 && (
                <Link
                  href="/plano"
                  className="inline-flex min-h-9 items-center rounded-lg border border-border bg-surface px-3 text-[0.8125rem] font-medium text-text-secondary transition-colors hover:border-brand-300 hover:text-text-primary"
                >
                  Hoje
                </Link>
              )}
              <Link
                href={`/plano?semana=${deslocamento + 1}`}
                aria-label="Próxima semana"
                className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary transition-colors hover:border-brand-300 hover:text-text-primary"
              >
                <ChevronRight aria-hidden className="size-4" />
              </Link>
            </nav>
          }
        >
          {inicioSemana.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} a{" "}
          {fimSemana.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
        </SectionHeading>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {diasDaSemana.map((d) => {
            const k = chaveDia(d);
            const lista = porDia.get(k) ?? [];
            const ehHoje = k === hojeChave;
            const feitos = lista.filter((i) => i.completed).length;

            return (
              <div
                key={k}
                className={`flex flex-col rounded-xl border bg-surface shadow-xs ${
                  ehHoje ? "border-brand-400 ring-1 ring-brand-200" : "border-border"
                }`}
              >
                <header
                  className={`flex items-center gap-2 rounded-t-xl border-b px-4 py-3 ${
                    ehHoje ? "border-brand-200 bg-brand-50" : "border-border bg-surface-subtle/60"
                  }`}
                >
                  <h3 className="min-w-0 flex-1">
                    <span className="block text-[0.9375rem] font-semibold capitalize text-text-primary">
                      {DIAS[d.getDay()]}
                    </span>
                    <span className="t-meta tabular">
                      {d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                    </span>
                  </h3>
                  {ehHoje && (
                    <span className="rounded-md bg-acao px-2 py-0.5 text-[0.6875rem] font-semibold text-white">
                      hoje
                    </span>
                  )}
                  {lista.length > 0 && !ehHoje && (
                    <span className="t-meta tabular shrink-0">
                      {feitos}/{lista.length}
                    </span>
                  )}
                </header>

                <div className="flex-1 cartao-p-sm">
                  {lista.length === 0 ? (
                    <p className="px-1 py-3 text-[0.8125rem] text-text-muted">Descanso</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {lista.map((i) => {
                        const nome = i.subjectId
                          ? (nomeDisciplina.get(i.subjectId) ?? null)
                          : null;
                        return (
                          <PlanItem
                            key={i.id}
                            item={{
                              id: i.id,
                              title: i.title,
                              hora: i.scheduledFor.toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              }),
                              completed: i.completed,
                              cor: nome ? visualDaMateria(nome).cor : undefined,
                              href: destino(i, slugs, nome),
                            }}
                          />
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="secao">
        <details className="group/ajuste overflow-hidden cartao">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-[0.9375rem] font-medium text-text-primary transition-colors hover:bg-surface-subtle/60">
            <Settings2 aria-hidden className="size-4 text-text-muted" />
            Ajustar plano
            <ChevronRight
              aria-hidden
              className="ml-auto size-4 text-text-muted transition-transform group-open/ajuste:rotate-90"
            />
          </summary>
          <div className="border-t border-border cartao-p-lg">
            <PlanForm
              disciplinas={opcoesDisciplinas}
              inicial={{
                targetVestibular: plano.targetVestibular,
                examDate: plano.examDate,
                daysPerWeek: plano.daysPerWeek,
                hoursPerDay: plano.hoursPerDay,
              }}
            />
          </div>
        </details>
      </section>
    </>
  );
}
