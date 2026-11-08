import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Este pool compartilha a role com o pool do Payload. O default (10) sozinho
// esgotava o limite de 10 conexões e derrubava o dashboard com SQLSTATE 53300.
const client = postgres(process.env.DATABASE_URL, {
  max: 3,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
