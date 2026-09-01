import { createReadStream, statSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { requireAssinaturaApi } from "@/lib/auth/require-subscription";

/**
 * Entrega do vídeo das aulas, protegida por assinatura.
 *
 * O HLS **não** é servido como arquivo estático pelo Caddy: quem tem o link do
 * .m3u8 assistiria sem pagar, e é exatamente por isso que a plataforma é
 * própria em vez de YouTube não listado. Toda requisição — o playlist e cada
 * segmento .ts — passa por aqui e revalida a sessão.
 *
 * O custo disso é uma checagem por segmento (um a cada 6 s de vídeo). É uma
 * consulta indexada por usuário e cabe folgadamente; se um dia pesar, o passo
 * seguinte é assinar uma URL de curta duração por sessão, não abrir o diretório.
 */
export const dynamic = "force-dynamic";

const RAIZ = process.env.VIDEO_DIR ?? "/var/despolarizamed/hls";

const TIPOS: Record<string, string> = {
  ".m3u8": "application/vnd.apple.mpegurl",
  ".ts": "video/mp2t",
  ".vtt": "text/vtt",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; arquivo?: string[] }> },
) {
  const sessao = await requireAssinaturaApi();
  if (!sessao.ok) {
    return NextResponse.json({ error: sessao.motivo }, { status: sessao.status });
  }

  const { slug, arquivo } = await params;
  const nome = arquivo?.join("/") ?? "index.m3u8";

  // Só nomes que o pipeline gera. Antes de tocar em path.join: um ".." aqui
  // sairia do diretório de vídeo e serviria qualquer arquivo do container.
  if (!/^(index\.m3u8|s\d{4}\.ts|legendas\.vtt)$/.test(nome)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!/^aula-\d{2}$/.test(slug)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const caminho = path.join(RAIZ, slug, nome);

  let tamanho: number;
  try {
    tamanho = statSync(caminho).size;
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const tipo = TIPOS[path.extname(nome)] ?? "application/octet-stream";
  const fluxo = Readable.toWeb(createReadStream(caminho)) as ReadableStream;

  return new NextResponse(fluxo, {
    headers: {
      "Content-Type": tipo,
      "Content-Length": String(tamanho),
      // Segmento é imutável e pode ficar no cache do navegador; o playlist não,
      // porque ele muda quando a aula é reprocessada.
      "Cache-Control": nome.endsWith(".ts")
        ? "private, max-age=31536000, immutable"
        : "private, no-cache",
    },
  });
}
