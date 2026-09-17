import { pgTable, text, timestamp, integer, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { questions } from "./questions";

export const exams = pgTable("exams", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  institution: text("institution").notNull(),
  year: integer("year").notNull(),
  phase: text("phase"),
  originalFileUrl: text("original_file_url"),
  answerKeyUrl: text("answer_key_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const examQuestions = pgTable("exam_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  examId: uuid("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  questionId: uuid("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(0),
});

export const examAttempts = pgTable("exam_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  examId: uuid("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  studentId: text("student_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  scorePercent: integer("score_percent"),
});

export const examAnswers = pgTable("exam_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  attemptId: uuid("attempt_id")
    .notNull()
    .references(() => examAttempts.id, { onDelete: "cascade" }),
  questionId: uuid("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  selectedOptionId: uuid("selected_option_id"),
  isCorrect: text("is_correct"),
  answeredAt: timestamp("answered_at", { withTimezone: true }).notNull().defaultNow(),
});
