import type { Metadata } from "next";
import { requireSessionWithRole } from "@/lib/auth/require-session";
import {
  getStudentMetrics,
  getContentMetrics,
  getFinancialMetrics,
  getEngagementMetrics,
} from "@/features/admin/queries";
import {
  BookOpen,
  CircleDollarSign,
  FolderTree,
  Info,
  Layers,
  PlayCircle,
  Repeat,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { PageHeader, SectionHeading } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { ActionCard } from "@/components/ui/surface";

export const metadata: Metadata = {
  title: "Administração — DespolarizaMED",
};

function formatBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export default async function AdminPage() {
  await requireSessionWithRole("ADMIN");

  const [students, content, financial, engagement] = await Promise.all([
    getStudentMetrics(),
    getContentMetrics(),
    getFinancialMetrics(),
    getEngagementMetrics(),
  ]);

  const totalAulasEmCurso = engagement.lessonsCompleted + engagement.lessonsInProgress;

  return (
    <>
      <PageHeader
        titulo="Administração"
        descricao="Visão geral da plataforma: base de alunos, receita, catálogo e engajamento."
      />

      <div className="mb-9 grid gap-4 sm:grid-cols-2">
        <ActionCard href="/gestao/usuarios" icone={Users} titulo="Usuários">
          Buscar contas, conferir e-mail confirmado e trocar o papel de cada pessoa.
        </ActionCard>
        <ActionCard href="/gestao/acervo" icone={FolderTree} titulo="Acervo">
          Fila de curadoria das questões extraídas das provas, com gabarito a conferir.
        </ActionCard>
      </div>

      <div className="space-y-9">
        <section>
          <SectionHeading icone={Users}>Alunos</SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icone={Users} rotulo="Total de alunos" valor={students.total} />
            <MetricCard
              icone={UserPlus}
              rotulo="Novos (últimos 30 dias)"
              valor={students.newThisMonth}
              apoio={
                students.total > 0
                  ? `${Math.round((students.newThisMonth / students.total) * 100)}% da base`
                  : undefined
              }
              tom={students.newThisMonth > 0 ? "positivo" : "neutro"}
            />
          </div>
        </section>

        <section>
          <SectionHeading icone={CircleDollarSign}>Financeiro</SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icone={Repeat}
              rotulo="Assinaturas ativas"
              valor={financial.activeSubscriptions}
              apoio={
                students.total > 0
                  ? `${Math.round((financial.activeSubscriptions / students.total) * 100)}% dos alunos`
                  : undefined
              }
            />
            <MetricCard
              icone={CircleDollarSign}
              rotulo="MRR"
              valor={formatBRL(financial.mrrCents)}
              apoio={
                // A ressalva continua exatamente onde estava: sem a integração
                // com o Mercado Pago o número é zero por ausência de dado, e
                // não por queda de receita. Um gráfico bonito aqui seria
                // decoração em cima de nada.
                financial.mrrCents === 0 ? "Zerado até a integração com Mercado Pago" : undefined
              }
              tom={financial.mrrCents === 0 ? "atencao" : "positivo"}
            />
          </div>
        </section>

        <section>
          <SectionHeading icone={BookOpen}>Conteúdo</SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icone={Layers} rotulo="Disciplinas" valor={content.subjects} />
            <MetricCard icone={FolderTree} rotulo="Módulos" valor={content.modules} />
            <MetricCard icone={PlayCircle} rotulo="Aulas" valor={content.lessons} />
          </div>
        </section>

        <section>
          <SectionHeading icone={TrendingUp}>Engajamento</SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icone={TrendingUp}
              rotulo="Aulas concluídas"
              valor={engagement.lessonsCompleted.toLocaleString("pt-BR")}
              apoio={
                totalAulasEmCurso > 0
                  ? `${Math.round((engagement.lessonsCompleted / totalAulasEmCurso) * 100)}% das aulas iniciadas`
                  : undefined
              }
            />
            <MetricCard
              icone={PlayCircle}
              rotulo="Aulas em andamento"
              valor={engagement.lessonsInProgress.toLocaleString("pt-BR")}
            />
          </div>
        </section>
      </div>

      <p className="t-meta mt-9 flex items-start gap-2 rounded-lg border border-border bg-surface-subtle/60 px-4 py-3">
        <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
        Todos os números vêm de consultas diretas ao banco, sem cache. Nenhum gráfico é exibido
        enquanto não houver série histórica que o sustente.
      </p>
    </>
  );
}
