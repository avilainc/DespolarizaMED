import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "STUDENT",
        input: false,
      },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  // Next dev falls back to 3001/3002/... whenever port 3000 is already
  // taken by another project on this machine, so BETTER_AUTH_URL alone
  // (fixed at :3000) isn't enough — trust the common dev ports too.
  trustedOrigins:
    process.env.NODE_ENV === "production"
      ? undefined
      : Array.from({ length: 10 }, (_, i) => `http://localhost:${3000 + i}`),
});

export type Session = typeof auth.$Infer.Session;
