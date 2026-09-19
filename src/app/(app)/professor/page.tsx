import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, PenLine, Users, UserCheck, Video } from "lucide-react";

import { requireSessionWithRole } from "@/lib/auth/require-session";
import { getStudentsSummary } from "@/features/teacher/queries";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MetricCard, ProgressBar } from "@/components/metric-card";
import { PageHeader, PageShell, SectionHeading } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { IllustrationDna } from "@/components/illustrations";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Área do professor — DespolarizaMED",
};

function formatDate(date: Date | null) {
  if (!date) return "Nunca acessou";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(date));
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes.at(-1)?.[0] ?? "")).toUpperCase();
}

export default async function ProfessorPage() {
  await requireSessionWithRole("TEACHER");
  const students = await getStudentsSummary();

  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.lessonsStarted > 0).length;
  const aulasConcluidas = students.reduce((n, s) => n + s.lessonsCompleted, 0);

  return (
    <PageShell largura="larga">
      <PageHeader
        titulo="Área do professor"
        migalhas={[{ rotulo: "Início", href: "/dashboard" }, { rotulo: "Área do professor" }]}
        descricao={
          <>
            Acompanhe o progresso dos alunos. Para gerenciar disciplinas, módulos e aulas, use o{" "}
            <Link href="/admin/login" className="font-medium text-primary hover:underline">
              painel de conteúdo
            </Link>
            .
          </>
        }
        acoes={
          <>
            <Button variant="outline" render={<Link href="/professor/questoes" />}>
              <PenLine />
              Questões autorais
            </Button>
            <Button variant="outline" render={<Link href="/professor/plantoes" />}>
              <Video />
              Plantões e palestras
            </Button>
            <Button variant="outline" render={<Link href="/admin/login" />}>
              <BookOpen />
              Gerenciar conteúdo
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard rotulo="Alunos cadastrados" valor={totalStudents} icone={Users} />
        <MetricCard
          rotulo="Alunos com atividade"
          valor={activeStudents}
          apoio={totalStudents > 0 ? `de ${totalStudents} cadastrados` : undefined}
          icone={UserCheck}
        />
        <MetricCard
          rotulo="Aulas concluídas"
          valor={aulasConcluidas}
          apoio="somando todos os alunos"
          icone={BookOpen}
        />
      </div>

      <section className="mt-10">
        <SectionHeading titulo="Progresso dos alunos" icone={Users} />
        {students.length === 0 ? (
          <EmptyState
            ilustracao={<IllustrationDna />}
            titulo="Nenhum aluno cadastrado ainda"
            descricao="Quando o primeiro aluno criar conta, o progresso dele aparece aqui: aulas concluídas, aulas começadas e última atividade."
          />
        ) : (
          <div className="overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/8">
            {/* Tabela no desktop e cartões no celular. A tabela de quatro
                colunas com e-mail dentro era a maior causa de rolagem
                horizontal da área logada. */}
            <table className="hidden w-full text-sm lg:table">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 py-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Aluno
                  </th>
                  <th className="px-5 py-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Progresso
                  </th>
                  <th className="px-5 py-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Aulas
                  </th>
                  <th className="px-5 py-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Última atividade
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, i) => (
                  <tr key={student.id} className={i > 0 ? "border-t border-border" : undefined}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          <AvatarFallback>{iniciais(student.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{student.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {student.lessonsStarted > 0 ? (
                        <div className="w-36">
                          <ProgressBar
                            altura="fina"
                            valor={student.lessonsCompleted}
                            total={student.lessonsStarted}
                            rotuloAcessivel={`${student.lessonsCompleted} de ${student.lessonsStarted} aulas concluídas por ${student.name}`}
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-foreground">
                      {student.lessonsStarted > 0 ? (
                        <>
                          {student.lessonsCompleted}
                          <span className="text-muted-foreground">/{student.lessonsStarted}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDate(student.lastActivityAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="lg:hidden">
              {students.map((student, i) => (
                <li key={student.id} className={cn("px-4 py-4", i > 0 && "border-t border-border")}>
                  <div className="flex items-center gap-3">
                    <Avatar size="sm">
                      <AvatarFallback>{iniciais(student.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{student.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{student.email}</p>
                    </div>
                  </div>
                  {student.lessonsStarted > 0 ? (
                    <div className="mt-3">
                      <div className="flex items-baseline justify-between gap-2 text-xs">
                        <span className="text-muted-foreground">Aulas concluídas</span>
                        <span className="font-medium tabular-nums text-foreground">
                          {student.lessonsCompleted}/{student.lessonsStarted}
                        </span>
                      </div>
                      <ProgressBar
                        className="mt-1.5"
                        altura="fina"
                        valor={student.lessonsCompleted}
                        total={student.lessonsStarted}
                        rotuloAcessivel={`${student.lessonsCompleted} de ${student.lessonsStarted} aulas concluídas por ${student.name}`}
                      />
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">Ainda não começou nenhuma aula</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Última atividade: {formatDate(student.lastActivityAt)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </PageShell>
  );
}
