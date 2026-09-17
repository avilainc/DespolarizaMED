import { createReadStream, statSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { requireAssinaturaApi } from "@/lib/auth/require-subscription";

/**
 * Figuras recortadas das provas (`library_figures.arquivo`, relativo a
 * DATA_DIR). Ficam fora de /public de propósito: são conteúdo pago, e o
 * caminho no banco é previsível (sha256 do PDF + página), então qualquer um
 * com um link poderia enumerar o acervo inteiro se fosse estático.
 */
export const dynamic = "force-dynamic";

const RAIZ = process.env.DATA_DIR ?? path.join(process.cwd(), "data");

// Exatamente o formato que 11_extract_figures.py produz. Nada de ".." passa.
const FORMATO = /^figures\/[0-9a-f]{2}\/[0-9a-f]{64}\/p\d{3}_\d+\.png$/;

export async function GET(_request: Request, { params }: { params: Promise<{ arquivo: string[] }> }) {
  const sessao = await requireAssinaturaApi();
  if (!sessao.ok) {
    return NextResponse.json({ error: sessao.motivo }, { status: sessao.status });
  }

  const { arquivo } = await params;
  const relativo = arquivo.join("/");
  if (!FORMATO.test(relativo)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const caminho = path.join(RAIZ, relativo);
  let tamanho: number;
  try {
    tamanho = statSync(caminho).size;
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const fluxo = Readable.toWeb(createReadStream(caminho)) as ReadableStream;
  return new NextResponse(fluxo, {
    headers: {
      "Content-Type": "image/png",
      "Content-Length": String(tamanho),
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
