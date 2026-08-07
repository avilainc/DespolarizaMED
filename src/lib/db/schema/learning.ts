import { pgTable, text, timestamp, integer, boolean, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";

// lessonId/subjectId below reference Payload's "lessons"/"subjects" collections
// (owned by Payload, not a Drizzle FK — Payload uses integer serial IDs).

export const lessonProgress = pgTable("lesson_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: text("student_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  lessonId: integer("lesson_id").notNull(),
  positionSeconds: integer("position_seconds").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const studentProgress = pgTable("student_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: text("student_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id").notNull(),
  percentComplete: integer("percent_complete").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const studyPlans = pgTable("study_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: text("student_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  targetVestibular: text("target_vestibular"),
  examDate: timestamp("exam_date"),
  daysPerWeek: integer("days_per_week"),
  hoursPerDay: integer("hours_per_day"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const studyPlanItems = pgTable("study_plan_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  studyPlanId: uuid("study_plan_id")
    .notNull()
    .references(() => studyPlans.id, { onDelete: "cascade" }),
  scheduledFor: timestamp("scheduled_for").notNull(),
  subjectId: integer("subject_id"),
  lessonId: integer("lesson_id"),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
});

export const studentActivities = pgTable("student_activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: text("student_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const studentNotes = pgTable("student_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: text("student_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  lessonId: integer("lesson_id"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: text("student_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  entityType: text("entity_type", { enum: ["LESSON", "QUESTION", "GLOSSARY_TERM"] }).notNull(),
  entityId: text("entity_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
