import { lerRelatoriosCsp } from "@/lib/csp";

// Recebe os relatórios da CSP em Report-Only (ver src/lib/csp.ts) e os escreve
// no log do container, uma linha por violação, para ajustar a política antes de
// ela passar a bloquear.
//
// É público por natureza — quem manda é o navegador de qualquer visitante, sem
// sessão —, então trata o corpo como hostil: tamanho limitado, só os três
// campos que importam, sem query string, e nunca responde erro descritivo.

export const dynamic = "force-dynamic";

// Um relatório real tem poucas centenas de bytes; o lote do report-to, alguns KB.
const LIMITE_BYTES = 16 * 1024;
// Teto de linhas por requisição: um corpo forjado com mil violações não vira
// mil linhas de log.
const MAX_POR_REQUISICAO = 10;

const vazio = () => new Response(null, { status: 204 });

export async function POST(request: Request) {
  const tamanho = Number(request.headers.get("content-length") ?? 0);
  if (tamanho > LIMITE_BYTES) return vazio();

  let texto: string;
  try {
    texto = await request.text();
  } catch {
    return vazio();
  }
  if (texto.length > LIMITE_BYTES) return vazio();

  let corpo: unknown;
  try {
    corpo = JSON.parse(texto);
  } catch {
    return vazio();
  }

  for (const r of lerRelatoriosCsp(corpo).slice(0, MAX_POR_REQUISICAO)) {
    // JSON numa linha: fácil de filtrar com `docker logs | grep csp-violation`.
    console.warn(JSON.stringify({ evento: "csp-violation", ...r }));
  }
  return vazio();
}
