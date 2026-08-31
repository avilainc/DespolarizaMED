import { NextResponse } from "next/server";
import { harnessTokenOk, unauthorized } from "@/lib/gapp/auth";

/**
 * CT-22: os prefixos /v1/ops/* e /v1/lgpd/* são reservados ao harness, e rota
 * inexistente sob /v1 não pode ser usada para outra finalidade.
 *
 * O 401 antes do 404 é deliberado: quem não apresenta o Bearer não descobre
 * quais rotas do harness existem, porque a resposta é a mesma para uma rota
 * inexistente e para uma que existe.
 */
export const dynamic = "force-dynamic";

function handle(request: Request) {
  if (!harnessTokenOk(request)) return unauthorized();
  return NextResponse.json({ error: "not_found" }, { status: 404 });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
