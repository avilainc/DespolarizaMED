import type { Metadata } from "next";
import { requireSessionWithRole } from "@/lib/auth/require-session";
import {
  getStudentMetrics,
  getContentMetrics,
  getFinancialMetrics,
  getEngagementMetrics,
} from "@/features/admin/queries";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, DollarSign, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "Administração — DespolarizaMED",
};

function formatBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
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
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">Administração</h1>
      <p className="mt-1 text-muted-foreground">Visão geral da plataforma.</p>

      <nav className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/gestao/usuarios"
          className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
        >
          Usuários
        </Link>
      </nav>

      <div className="mt-8 space-y-10">
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Users className="size-4" /> Alunos
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de alunos
                </CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-bold text-foreground">
                {students.total}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Novos (últimos 30 dias)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-bold text-foreground">
                {students.newThisMonth}
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <DollarSign className="size-4" /> Financeiro
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Assinaturas ativas
                </CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-bold text-foreground">
                {financial.activeSubscriptions}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  MRR
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {formatBRL(financial.mrrCents)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Zerado até a integração com Mercado Pago
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <BookOpen className="size-4" /> Conteúdo
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Disciplinas
                </CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-bold text-foreground">
                {content.subjects}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Módulos
                </CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-bold text-foreground">
                {content.modules}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Aulas
                </CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-bold text-foreground">
                {content.lessons}
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <TrendingUp className="size-4" /> Engajamento
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Aulas concluídas
                </CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-bold text-foreground">
                {engagement.lessonsCompleted}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Aulas em andamento
                </CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-bold text-foreground">
                {engagement.lessonsInProgress}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
