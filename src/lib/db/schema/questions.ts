import { pgTable, text, timestamp, integer, uuid, pgEnum } from "drizzle-orm/pg-core";

export const difficultyEnum = pgEnum("difficulty", ["FACIL", "MEDIA", "DIFICIL"]);
export const questionTypeEnum = pgEnum("question_type", ["MULTIPLA_ESCOLHA", "DISSERTATIVA"]);

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  // subjectId references Payload's "subjects" collection (owned by Payload, not a Drizzle FK).
  subjectId: integer("subject_id").notNull(),
  topic: text("topic").notNull(),
  subtopic: text("subtopic"),
  statement: text("statement").notNull(),
  type: questionTypeEnum("type").notNull().default("MULTIPLA_ESCOLHA"),
  difficulty: difficultyEnum("difficulty").notNull().default("MEDIA"),
  vestibular: text("vestibular"),
  year: integer("year"),
  explanation: text("explanation"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const questionOptions = pgTable("question_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  questionId: uuid("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  content: text("content").notNull(),
  isCorrect: text("is_correct").notNull().default("false"),
  order: integer("order").notNull().default(0),
});

export const exerciseLists = pgTable("exercise_lists", {
  id: uuid("id").primaryKey().defaultRandom(),
  lessonId: uuid("lesson_id"),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const exerciseListQuestions = pgTable("exercise_list_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  exerciseListId: uuid("exercise_list_id")
    .notNull()
    .references(() => exerciseLists.id, { onDelete: "cascade" }),
  questionId: uuid("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(0),
});
