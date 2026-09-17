import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const liveSessions = pgTable("live_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // subjectId references Payload's "subjects" collection (owned by Payload).
  subjectId: integer("subject_id"),
  title: text("title").notNull(),
  description: text("description"),
  meetUrl: text("meet_url"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  recordingUrl: text("recording_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const lectures = pgTable("lectures", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  speaker: text("speaker"),
  videoUrl: text("video_url"),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type", {
    enum: ["PLANTAO", "PALESTRA", "SIMULADO", "REVISAO", "VESTIBULAR", "OUTRO"],
  }).notNull(),
  title: text("title").notNull(),
  referenceId: uuid("reference_id"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
