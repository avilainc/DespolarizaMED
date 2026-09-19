import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Circle, Play } from "lucide-react";

import { requireAssinatura } from "@/lib/auth/require-subscription";
import { getSubjectBySlug } from "@/lib/payload/queries";
import { modulosComProgresso, type AulaComEstado } from "@/features/courses/queries";
import { visualDaDisciplina } from "@/lib/subjects-visual";
import { SubjectIcon } from "@/components/subject-icon";
import { IllustrationMolecule } from "@/components/illustrations";
import { ProgressBar } from "@/components/metric-card";
import { PageHeader, PageShell } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const subject = await getSubjectBySlug(slug);
  return { title: subject ? `${subject.name} — DespolarizaMED` : "Disciplina — DespolarizaMED" };
}

export default async function DisciplinaPage({ params }: Props) {
  const { slug } = await params;
  const { session } = await requireAssinatura();
  const subject = await getSubjectBySlug(slug);
  if (!subject) notFound();

  const modulos = await modulosComProgresso(subject.id, session.user.id);
  const totalAulas = modulos.reduce((n, m) => n + m.aulas.length, 0);
  const totalConcluidas = modulos.reduce((n, m) => n + m.concluidas, 0);
  const { corVar } = visualDaDisciplina(subject.name);

  // A aula "atual" é a primeira não concluída da disciplina inteira, lendo os
  // módulos na ordem. É o que dá o estado ▶ na lista, e evita marcar como
  // atual uma aula solta lá no fim que o aluno abriu por curiosidade.
  const idAtual = modulos.flatMap((m) => m.aulas).find((a) => !a.concluida)?.id ?? null;

  return (
    <PageShell>
      <PageHeader
        titulo={subject.name}
        migalhas={[
          { rotulo: "Início", href: "/dashboard" },
          { rotulo: "Disciplinas", href: "/disciplinas" },
          { rotulo: subject.name },
        ]}
      />

      {/* Hero pequeno da disciplina: ícone, descrição e onde o aluno está.
          Pequeno de propósito; a lista de aulas é o conteúdo da página. */}
      <div
        className="relative overflow-hidden rounded-2xl bg-card p-6 shadow-xs ring-1 ring-foreground/8"
        style={{
          backgroundImage: `linear-gradient(120deg, color-mix(in oklch, var(${corVar}), transparent 94%), transparent 65%)`,
        }}
      >
        <IllustrationMolecule
          className="pointer-events-none absolute -right-4 -bottom-8 hidden h-40 w-auto text-foreground/[0.05] sm:block"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-start gap-4">
          <SubjectIcon disciplina={subject.name} size="lg" />
          <div className="min-w-0 flex-1">
            {subject.description && (
              <p className="max-w-xl text-[0.9375rem] leading-relaxed text-muted-foreground">{subject.description}</p>
            )}
            {totalAulas > 0 && (
              <div className="mt-4 max-w-sm">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium text-foreground">
                    {totalConcluidas} de {totalAulas} aulas
                  </span>
                  <span className="text-muted-foreground">
                    {Math.round((totalConcluidas / totalAulas) * 100)}%
                  </span>
                </div>
                <ProgressBar
                  className="mt-2"
                  valor={totalConcluidas}
                  total={totalAulas}
                  cor={corVar}
                  rotuloAcessivel={`${totalConcluidas} de ${totalAulas} aulas concluídas em ${subject.name}`}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {modulos.length === 0 || totalAulas === 0 ? (
        <div className="mt-8">
          <EmptyState
            ilustracao={<IllustrationMolecule />}
            titulo="Nenhuma aula publicada nesta disciplina"
            descricao="O conteúdo está sendo gravado. Quando a primeira aula entrar no ar, ela aparece aqui."
          />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {modulos.map(({ modulo, aulas, concluidas }) => (
            <section key={modulo.id}>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="font-heading text-lg font-semibold text-foreground">{modulo.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {aulas.length} {aulas.length === 1 ? "aula" : "aulas"}
                  {concluidas > 0 && ` · ${concluidas} ${concluidas === 1 ? "concluída" : "concluídas"}`}
                </p>
              </div>
              <ul className="overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/8">
                {aulas.map((aula, i) => (
                  <li key={aula.id} className={cn(i > 0 && "border-t border-border")}>
                    <LinhaDaAula aula={aula} atual={aula.id === idAtual} corVar={corVar} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </PageShell>
  );
}

/**
 * Uma aula na lista, com três estados possíveis: concluída, atual e não
 * iniciada. O estado não é dito só pela cor: cada um tem ícone próprio e a
 * palavra correspondente no texto de apoio, para quem não distingue as cores.
 */
function LinhaDaAula({ aula, atual, corVar }: { aula: AulaComEstado; atual: boolean; corVar: string }) {
  const Icone = aula.concluida ? Check : atual ? Play : Circle;
  const duracao = aula.durationSeconds ?? 0;

  return (
    <Link
      href={`/aulas/${aula.slug}`}
      className={cn(
        "flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-muted/60 motion-reduce:transition-none",
        atual && "bg-muted/40",
      )}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full [&>svg]:size-3.5",
          aula.concluida
            ? "text-white"
            : atual
              ? "text-white"
              : "bg-muted text-muted-foreground [&>svg]:size-2 [&>svg]:fill-current",
        )}
        style={aula.concluida || atual ? { backgroundColor: `var(${corVar})` } : undefined}
        aria-hidden
      >
        <Icone strokeWidth={3} />
      </span>

      <span className="min-w-0 flex-1">
        <span className={cn("block text-[0.9375rem] leading-snug", atual ? "font-semibold" : "font-medium", "text-foreground")}>
          {aula.title}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {aula.concluida ? "Concluída" : atual ? "Continuar daqui" : "Não iniciada"}
          {duracao > 0 && ` · ${Math.round(duracao / 60)} min`}
        </span>
      </span>
    </Link>
  );
}
