import { pgTable, text, timestamp, integer, boolean, uuid, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const billingPeriodEnum = pgEnum("billing_period", ["MENSAL", "TRIMESTRAL", "SEMESTRAL"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "PENDING",
  "ACTIVE",
  "PAST_DUE",
  "CANCELLED",
  "EXPIRED",
]);

export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  billingPeriod: billingPeriodEnum("billing_period").notNull(),
  priceCents: integer("price_cents").notNull(),
  active: boolean("active").notNull().default(true),
  mercadoPagoPlanId: text("mercado_pago_plan_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: text("student_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  planId: uuid("plan_id")
    .notNull()
    .references(() => plans.id, { onDelete: "restrict" }),
  status: subscriptionStatusEnum("status").notNull().default("PENDING"),
  mercadoPagoSubscriptionId: text("mercado_pago_subscription_id"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id")
    .notNull()
    .references(() => subscriptions.id, { onDelete: "cascade" }),
  amountCents: integer("amount_cents").notNull(),
  status: text("status", { enum: ["PENDING", "APPROVED", "FAILED", "REFUNDED"] }).notNull(),
  mercadoPagoPaymentId: text("mercado_pago_payment_id"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  discountPercent: integer("discount_percent"),
  discountCents: integer("discount_cents"),
  expiresAt: timestamp("expires_at"),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const paymentEvents = pgTable("payment_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(),
  payload: text("payload").notNull(),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
