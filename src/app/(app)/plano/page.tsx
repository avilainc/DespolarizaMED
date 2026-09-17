import type { Metadata } from "next";
import Link from "next/link";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { getSubjects } from "@/lib/payload/queries";
import { getPayloadClient } from "@/lib/payload";
import { itensDoPeriodo, planoDoAluno } from "@/features/study-plan/queries";
import { PlanForm } from "@/features/study-plan/components/plan-form";
import { PlanItem } from "@/features/study-plan/components/plan-item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

export const metadata: Metadata = { title: "Plano de estudos — DespolarizaMED" };

const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

function chaveDia(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Link de cada item: aula → /aulas/slug; exercícios → banco filtrado pela
 * disciplina; revisão → questões erradas; simulado → /provas.
 */
function destino(item: { lessonId: number | null; title: string }, slugs: Map<number, string>, disciplina: string | null) {
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
    const r = await payload.find({ collection: "lessons", where: { id: { in: lessonIds } }, limit: lessonIds.length, depth: 0 });
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

  const diasAteProva = plano?.examDate
    ? Math.max(0, Math.ceil((new Date(plano.examDate).getTime() - Date.now()) / 86_400_000))
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">Plano de estudos</h1>
      <p className="mt-1 text-muted-foreground">
        Cronograma montado a partir das aulas publicadas, dos seus dias e horas disponíveis e da data da prova.
      </p>

      {!plano ? (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">Vamos montar o seu cronograma</CardTitle>
          </CardHeader>
          <CardContent>
            <PlanForm disciplinas={disciplinas.map((d) => ({ id: d.id, name: d.name }))} />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Vestibular</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold text-foreground">{plano.targetVestibular}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Faltam</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold text-foreground">
                {diasAteProva} {diasAteProva === 1 ? "dia" : "dias"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Ritmo</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold text-foreground">
                {plano.daysPerWeek}d × {plano.hoursPerDay}h
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Progresso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {plano.total ? Math.round((plano.concluidos / plano.total) * 100) : 0}%
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {plano.concluidos} de {plano.total} itens
                </p>
              </CardContent>
            </Card>
          </div>

          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <CalendarDays className="size-4" />
                Semana de {inicioSemana.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} a{" "}
                {fimSemana.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              </h2>
              <nav className="flex gap-2 text-sm">
                <Link href={`/plano?semana=${deslocamento - 1}`} className="text-primary hover:underline">← anterior</Link>
                {deslocamento !== 0 && (
                  <Link href="/plano" className="text-primary hover:underline">hoje</Link>
                )}
                <Link href={`/plano?semana=${deslocamento + 1}`} className="text-primary hover:underline">próxima →</Link>
                <Link href="/calendario" className="ml-2 text-muted-foreground hover:text-foreground">calendário</Link>
              </nav>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {diasDaSemana.map((d) => {
                const k = chaveDia(d);
                const lista = porDia.get(k) ?? [];
                const ehHoje = k === hojeChave;
                return (
                  <div key={k} className={`rounded-lg border p-3 ${ehHoje ? "border-primary bg-primary/5" : "border-border"}`}>
                    <h3 className="mb-2 text-sm font-semibold capitalize text-foreground">
                      {DIAS[d.getDay()]}{" "}
                      <span className="font-normal text-muted-foreground">{d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
                      {ehHoje && <span className="ml-2 text-xs text-primary">hoje</span>}
                    </h3>
                    {lista.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Descanso</p>
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

          <details className="mt-10 rounded-lg border border-border bg-card p-5">
            <summary className="cursor-pointer text-sm font-semibold text-foreground">Ajustar plano</summary>
            <div className="mt-4">
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
        </>
      )}
    </div>
  );
}
