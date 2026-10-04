import { FiltroDeRelatorios, lerCorpoLimitado, lerRelatoriosCsp } from "@/lib/csp";

// Recebe os relatórios da CSP em Report-Only (ver src/lib/csp.ts) e os escreve
// no log do container, uma linha por violação, para ajustar a política antes de
// ela passar a bloquear.
//
// É público por natureza — quem manda é o navegador de qualquer visitante, sem
// sessão —, então trata o corpo como hostil: tamanho limitado durante a
// leitura (não depois), só os três campos que importam e só se forem string,
// sem query string, volume de log limitado entre requisições (ver
// FiltroDeRelatorios), e nunca responde erro descritivo.

export const dynamic = "force-dynamic";

// Um relatório real tem poucas centenas de bytes.
const LIMITE_BYTES = 16 * 1024;
// Teto por requisição: um corpo forjado com mil violações não vira mil
// chamadas ao filtro.
const MAX_POR_REQUISICAO = 10;

// JSON numa linha: fácil de filtrar com `docker logs | grep csp-violation`.
const escrever = (linhas: Record<string, unknown>[]) => {
  for (const linha of linhas) console.warn(JSON.stringify(linha));
};

// Um filtro por processo — é o que segura o volume entre requisições — e um
// timer que fecha a janela mesmo sem tráfego, senão o resumo de um surto que
// acabou ficaria só na memória. Guardado em globalThis para o recarregamento
// do `next dev` não empilhar timers. `unref` para o timer não segurar o
// processo vivo no desligamento.
const global = globalThis as typeof globalThis & { __filtroCsp?: FiltroDeRelatorios };
const filtro =
  global.__filtroCsp ??
  (() => {
    const novo = new FiltroDeRelatorios();
    setInterval(() => escrever(novo.fecharSeVencida()), novo.janelaMs).unref();
    return novo;
  })();
global.__filtroCsp = filtro;

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

  // Rede de segurança: nada daqui deve lançar (os campos já são validados),
  // mas se lançar, a resposta continua 204 em vez de um 500 que o Next logaria
  // por conta própria, fora do orçamento do filtro.
  try {
    for (const r of lerRelatoriosCsp(corpo).slice(0, MAX_POR_REQUISICAO)) {
      escrever(filtro.registrar(r));
    }
  } catch {
    // silêncio de propósito: ver acima
  }
  return vazio();
}
