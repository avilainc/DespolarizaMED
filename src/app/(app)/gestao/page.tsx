import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  CircleDollarSign,
  FileStack,
  GraduationCap,
  Library,
  PlayCircle,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

import { requireSessionWithRole } from "@/lib/auth/require-session";
import {
  getStudentMetrics,
  getContentMetrics,
  getFinancialMetrics,
  getEngagementMetrics,
} from "@/features/admin/queries";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/metric-card";
import { PageHeader, PageShell, SectionHeading } from "@/components/page-header";

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

  return (
    <PageShell largura="larga">
      <PageHeader
        titulo="Administração"
        migalhas={[{ rotulo: "Início", href: "/dashboard" }, { rotulo: "Administração" }]}
        descricao="Visão geral da plataforma: alunos, assinaturas, conteúdo publicado e uso."
        acoes={
          <>
            <Button variant="outline" render={<Link href="/gestao/usuarios" />}>
              <Users />
              Usuários
            </Button>
            <Button variant="outline" render={<Link href="/gestao/acervo" />}>
              <Library />
              Acervo
            </Button>
          </>
        }
      />

      <div className="space-y-10">
        <section>
          <SectionHeading titulo="Alunos" icone={GraduationCap} />
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard rotulo="Total de alunos" valor={students.total.toLocaleString("pt-BR")} icone={Users} />
            <MetricCard
              rotulo="Novos alunos"
              valor={students.newThisMonth.toLocaleString("pt-BR")}
              apoio="nos últimos 30 dias"
              icone={UserPlus}
            />
          </div>
        </section>

        <section>
          <SectionHeading titulo="Financeiro" icone={CircleDollarSign} />
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard
              rotulo="Assinaturas ativas"
              valor={financial.activeSubscriptions.toLocaleString("pt-BR")}
              icone={CircleDollarSign}
            />
            <MetricCard
              rotulo="MRR"
              valor={formatBRL(financial.mrrCents)}
              // A explicação continua onde estava: um MRR zerado sem ressalva
              // parece defeito do negócio, e não da integração.
              apoio={
                financial.mrrCents === 0 ? "Zerado até a integração com Mercado Pago" : "receita mensal recorrente"
              }
              icone={TrendingUp}
            />
          </div>
        </section>

        <section>
          <SectionHeading titulo="Conteúdo" icone={BookOpen} />
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard rotulo="Disciplinas" valor={content.subjects} icone={BookOpen} />
            <MetricCard rotulo="Módulos" valor={content.modules} icone={FileStack} />
            <MetricCard rotulo="Aulas" valor={content.lessons} icone={PlayCircle} />
          </div>
        </section>

        <section>
          <SectionHeading titulo="Engajamento" icone={TrendingUp} />
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard
              rotulo="Aulas concluídas"
              valor={engagement.lessonsCompleted.toLocaleString("pt-BR")}
              apoio="somando todos os alunos"
              icone={PlayCircle}
            />
            <MetricCard
              rotulo="Aulas em andamento"
              valor={engagement.lessonsInProgress.toLocaleString("pt-BR")}
              apoio="começadas e ainda não concluídas"
              icone={TrendingUp}
            />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
