import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { lessonProgress, practiceAttempts, sourceDocuments, studentActivities } from "@/lib/db/schema";

export type Atividade = {
  id: string;
  quando: Date;
  tipo: string;
  descricao: string;
  href: string | null;
};

/**
 * Linha do tempo do aluno: junta `student_activities` (eventos registrados
 * pelas actions) com progresso de aulas e provas, ordenado do mais recente.
 */
export async function historicoDoAluno(studentId: string, limite = 60): Promise<Atividade[]> {
  const [atividades, aulas, provas] = await Promise.all([
    db
      .select()
      .from(studentActivities)
      .where(eq(studentActivities.studentId, studentId))
      .orderBy(desc(studentActivities.createdAt))
      .limit(limite),
    db
      .select()
      .from(lessonProgress)
      .where(eq(lessonProgress.studentId, studentId))
      .orderBy(desc(lessonProgress.updatedAt))
      .limit(limite),
    db
      .select({
        id: practiceAttempts.id,
        documentId: practiceAttempts.documentId,
        startedAt: practiceAttempts.startedAt,
        finishedAt: practiceAttempts.finishedAt,
        acertos: practiceAttempts.acertos,
        total: practiceAttempts.totalQuestoes,
        instituicao: sourceDocuments.instituicao,
        ano: sourceDocuments.ano,
      })
      .from(practiceAttempts)
      .innerJoin(sourceDocuments, eq(sourceDocuments.id, practiceAttempts.documentId))
      .where(eq(practiceAttempts.studentId, studentId))
      .orderBy(desc(practiceAttempts.startedAt))
      .limit(limite),
  ]);

  const linhas: Atividade[] = [];

  for (const a of atividades) {
    let meta: Record<string, unknown> = {};
    try {
      meta = a.metadata ? (JSON.parse(a.metadata) as Record<string, unknown>) : {};
    } catch {
      meta = {};
    }
    // Provas têm linha própria abaixo, com o resultado; questões avulsas são
    // muitas e granulares demais para a linha do tempo.
    if (a.type === "PROVA_INICIADA" || a.type === "PROVA_FINALIZADA" || a.type === "QUESTAO_RESPONDIDA") continue;
    if (a.type === "PLANO_GERADO") {
      linhas.push({
        id: a.id,
        quando: a.createdAt,
        tipo: "Plano de estudos",
        descricao: `Cronograma montado para ${String(meta.vestibular ?? "o vestibular")} (${String(meta.itens ?? 0)} itens)`,
        href: "/plano",
      });
      continue;
    }
    linhas.push({ id: a.id, quando: a.createdAt, tipo: a.type, descricao: a.type, href: null });
  }

  for (const l of aulas) {
    linhas.push({
      id: `aula-${l.id}`,
      quando: l.updatedAt,
      tipo: l.completed ? "Aula concluída" : "Aula em andamento",
      descricao: l.completed ? "Assistiu a aula até o fim" : `Parou em ${Math.floor(l.positionSeconds / 60)} min`,
      href: null,
    });
  }

  for (const p of provas) {
    linhas.push({
      id: `prova-${p.id}`,
      quando: p.finishedAt ?? p.startedAt,
      tipo: p.finishedAt ? "Prova finalizada" : "Prova iniciada",
      descricao: `${p.instituicao ?? "Prova"} ${p.ano ?? ""}${p.finishedAt ? ` · ${p.acertos}/${p.total}` : ""}`,
      href: p.finishedAt ? `/provas/${p.documentId}/${p.id}/resultado` : `/provas/${p.documentId}/${p.id}`,
    });
  }

  return linhas.sort((a, b) => b.quando.getTime() - a.quando.getTime()).slice(0, limite);
}
