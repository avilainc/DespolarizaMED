import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

// Alvo do healthcheck do compose e do health_uri do Caddy: responde se a app
// pode RECEBER TRÁFEGO, que é diferente de estar viva (/v1/health).
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
  } catch {
    return NextResponse.json(
      { ready: false, reason: "db_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json({ ready: true }, { headers: { "Cache-Control": "no-store" } });
}
