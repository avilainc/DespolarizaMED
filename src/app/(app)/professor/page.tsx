import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpenCheck,
  CircleHelp,
  ExternalLink,
  GraduationCap,
  PenLine,
  PlayCircle,
  UserCheck,
  Users,
  Video,
} from "lucide-react";
import { requireSessionWithRole } from "@/lib/auth/require-session";
import { getStudentsSummary } from "@/features/teacher/queries";
import { PageHeader, SectionHeading } from "@/components/ui/page-header";
import { MetricCard, ProgressBar } from "@/components/ui/metric-card";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ActionCard } from "@/components/ui/surface";
import { InitialsAvatar } from "@/components/ui/chip";

export const metadata: Metadata = {
  title: "Área do professor — DespolarizaMED",
};

function formatDate(date: Date | null) {
  if (!date) return "Nunca acessou";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(date),
  );
}

export default async function ProfessorPage() {
  await requireSessionWithRole("TEACHER");
  const students = await getStudentsSummary();

  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.lessonsStarted > 0).length;
  const aulasConcluidas = students.reduce((s, a) => s + a.lessonsCompleted, 0);

  return (
    <>
      <PageHeader
        titulo="Área do professor"
        descricao="Acompanhe o progresso dos alunos e cuide do que é seu: questões autorais, plantões e palestras."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard icone={Users} rotulo="Alunos cadastrados" valor={totalStudents} />
        <MetricCard
          icone={UserCheck}
          rotulo="Alunos com atividade"
          valor={activeStudents}
          apoio={
            totalStudents > 0
              ? `${Math.round((activeStudents / totalStudents) * 100)}% da base`
              : undefined
          }
          tom={
            totalStudents > 0 && activeStudents / totalStudents >= 0.5 ? "positivo" : "neutro"
          }
        />
        <MetricCard
          icone={BookOpenCheck}
          rotulo="Aulas concluídas"
          valor={aulasConcluidas.toLocaleString("pt-BR")}
          apoio="somando todos os alunos"
        />
      </div>

      <section className="mt-9">
        <SectionHeading icone={GraduationCap}>Ferramentas</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <ActionCard href="/professor/questoes" icone={PenLine} titulo="Questões autorais">
            Escreva e publique questões próprias, com enunciado, alternativas e comentário.
          </ActionCard>
          <ActionCard href="/professor/plantoes" icone={Video} titulo="Plantões e palestras">
            Agende encontros ao vivo, informe o link do Meet e publique a gravação.
          </ActionCard>
          {/* O painel de conteúdo é o Payload, fora desta aplicação: o ícone de
              link externo avisa que a navegação sai daqui. */}
          <ActionCard href="/admin" icone={ExternalLink} titulo="Gerenciar conteúdo" externo>
            Disciplinas, módulos, aulas, materiais e glossário no painel de conteúdo.
          </ActionCard>
        </div>
      </section>

      <section className="mt-9">
        <SectionHeading
          icone={Users}
          descricao="Aulas concluídas sobre aulas iniciadas, por aluno."
        >
          Progresso dos alunos
        </SectionHeading>

        <DataTable
          chave={(s) => s.id}
          linhas={students}
          vazio={
            <EmptyState
              ilustracao="/illustrations/vazio-conteudo.svg"
              titulo="Nenhum aluno cadastrado ainda"
              descricao="Assim que a primeira conta de aluno for criada, o progresso dela aparece nesta tabela."
            />
          }
          colunas={[
            {
              chave: "nome",
              cabecalho: "Aluno",
              titulo: true,
              largura: "30%",
              celula: (s) => (
                <span className="flex items-center gap-2.5">
                  <InitialsAvatar nome={s.name} tamanho="sm" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-text-primary">{s.name}</span>
                    <span className="t-meta block truncate">{s.email}</span>
                  </span>
                </span>
              ),
            },
            {
              chave: "email",
              cabecalho: "E-mail",
              soNoDesktop: true,
              largura: "24%",
              celula: (s) => <span className="truncate">{s.email}</span>,
            },
            {
              chave: "progresso",
              cabecalho: "Aulas concluídas",
              largura: "26%",
              celula: (s) =>
                s.lessonsStarted > 0 ? (
                  <span className="flex items-center gap-3">
                    <ProgressBar
                      valor={s.lessonsCompleted}
                      total={s.lessonsStarted}
                      tamanho="sm"
                      rotulo={`Progresso de ${s.name}`}
                      className="max-w-28"
                    />
                    <span className="tabular shrink-0 text-[0.8125rem]">
                      {s.lessonsCompleted}/{s.lessonsStarted}
                    </span>
                  </span>
                ) : (
                  <span className="t-meta inline-flex items-center gap-1.5">
                    <PlayCircle aria-hidden className="size-3.5" />
                    não começou
                  </span>
                ),
            },
            {
              chave: "atividade",
              cabecalho: "Última atividade",
              largura: "20%",
              celula: (s) => <span className="tabular">{formatDate(s.lastActivityAt)}</span>,
            },
          ]}
        />
      </section>

      <p className="t-meta mt-6 flex flex-wrap items-center gap-1.5">
        <CircleHelp aria-hidden className="size-4" />
        Para criar disciplinas, módulos e aulas, use o{" "}
        <Link
          href="/admin"
          className="font-medium text-brand-600 underline underline-offset-4 hover:text-brand-700"
        >
          painel de conteúdo
        </Link>
        .
      </p>
    </>
  );
}
