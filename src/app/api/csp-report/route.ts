import { FiltroDeRelatorios, lerCorpoLimitado, lerRelatoriosCsp } from "@/lib/csp";

// Recebe os relatórios da CSP em Report-Only (ver src/lib/csp.ts) e os escreve
// no log do container, uma linha por violação, para ajustar a política antes de
// ela passar a bloquear.
//
// É público por natureza — quem manda é o navegador de qualquer visitante, sem
// sessão —, então trata o corpo como hostil: tamanho limitado durante a
// leitura (não depois), só os três campos que importam, sem query string,
// volume de log limitado entre requisições, e nunca responde erro descritivo.

export const dynamic = "force-dynamic";

// Um relatório real tem poucas centenas de bytes.
const LIMITE_BYTES = 16 * 1024;
// Teto por requisição: um corpo forjado com mil violações não vira mil
// chamadas ao filtro.
const MAX_POR_REQUISICAO = 10;

// Um por processo: é o que segura o volume entre requisições.
const filtro = new FiltroDeRelatorios();

const vazio = () => new Response(null, { status: 204 });

export async function POST(request: Request) {
  // Atalho barato quando o cliente declara o tamanho; o limite de verdade é o
  // da leitura logo abaixo, que vale também sem Content-Length (chunked).
  if (Number(request.headers.get("content-length") ?? 0) > LIMITE_BYTES) return vazio();

  let texto: string | null;
  try {
    texto = await lerCorpoLimitado(request.body, LIMITE_BYTES);
  } catch {
    return vazio();
  }
  if (texto === null) return vazio();

  let corpo: unknown;
  try {
    corpo = JSON.parse(texto);
  } catch {
    return vazio();
  }

  for (const r of lerRelatoriosCsp(corpo).slice(0, MAX_POR_REQUISICAO)) {
    for (const linha of filtro.registrar(r)) {
      // JSON numa linha: fácil de filtrar com `docker logs | grep csp-violation`.
      console.warn(JSON.stringify(linha));
    }
  }
  return vazio();
}
