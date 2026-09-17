import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { libraryQuestions, sourceDocuments } from "./library";

/**
 * Prática do aluno sobre o acervo (`library_questions`).
 *
 * Aponta para o acervo extraído, e não para `questions` (curada), porque é o
 * acervo que está no ar em /questoes: esperar a curadoria de 26 mil questões
 * para começar a registrar respostas deixaria o aluno sem histórico por meses.
 * Quando uma questão for promovida para `questions`, o histórico continua
 * válido pelo id do acervo.
 */

/** Uma prova resolvida do início ao fim (um `source_documents` de tipo prova). */
export const practiceAttempts = pgTable(
  "practice_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: text("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    documentId: uuid("document_id")
      .notNull()
      .references(() => sourceDocuments.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    totalQuestoes: integer("total_questoes").notNull().default(0),
    acertos: integer("acertos").notNull().default(0),
  },
  (t) => [index("practice_attempts_student_idx").on(t.studentId, t.documentId)],
);

/**
 * Cada resposta dada. `attemptId` nulo = resposta avulsa no banco de questões;
 * preenchido = resposta dentro de uma prova. A mesma questão pode ser
 * respondida várias vezes ao longo do tempo (é histórico, não estado).
 */
export const practiceAnswers = pgTable(
  "practice_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: text("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => libraryQuestions.id, { onDelete: "cascade" }),
    attemptId: uuid("attempt_id").references(() => practiceAttempts.id, { onDelete: "cascade" }),
    letra: text("letra").notNull(),
    correta: boolean("correta").notNull(),
    answeredAt: timestamp("answered_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("practice_answers_student_question_idx").on(t.studentId, t.questionId),
    index("practice_answers_attempt_idx").on(t.attemptId),
  ],
);
