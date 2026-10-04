/**
 * Content-Security-Policy da aplicação, por enquanto só em modo RELATÓRIO
 * (`Content-Security-Policy-Report-Only`): o navegador não bloqueia nada,
 * apenas avisa `/api/csp-report` do que bloquearia.
 *
 * Por que começar assim: uma CSP mal ajustada quebra a página em produção sem
 * aviso nenhum ao servidor — o aluno vê tela branca e nós não vemos nada. Em
 * Report-Only, o site segue igual e os logs mostram cada origem que faltou.
 * Quando o log ficar limpo por um tempo, troca-se o nome do header (ver
 * `HEADER_CSP`) e a política passa a valer.
 *
 * Inventário (2026-10-04): tudo é servido do próprio domínio. As fontes vêm de
 * `next/font/google`, que baixa no build e serve de `/_next/static`; as imagens
 * são locais (`/logo.png`, figuras por `/api/figuras`, `next/image` sem
 * `remotePatterns`); YouTube, Instagram, Meet e Mercado Pago aparecem só como
 * links (`<a href>`), que CSP não restringe. O checkout do Mercado Pago é
 * redirect para o domínio deles, não iframe nem formulário nosso.
 *
 * O que ainda é frouxo, de propósito, e por quê:
 * - `script-src 'unsafe-inline'`: o Next injeta scripts inline de hidratação,
 *   e há dois nossos (tema em `app/layout.tsx`, JSON-LD da home). O passo certo
 *   é nonce por requisição via middleware — que torna toda página dinâmica e
 *   por isso é decisão à parte, não um ajuste de passagem.
 * - `style-src 'unsafe-inline'`: atributos `style` do React, do Vidstack e do
 *   admin do Payload. CSP não permite nonce em atributo `style`.
 */

/** Diretiva → fontes. Ordem preservada na serialização. */
export const POLITICA: Record<string, string[]> = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'"],
  "style-src": ["'self'", "'unsafe-inline'"],
  // data: e blob: — o Payload gera prévias de upload em blob:, e o Next usa
  // data: para placeholders de imagem.
  "img-src": ["'self'", "data:", "blob:"],
  "font-src": ["'self'", "data:"],
  // O player (Vidstack) pode montar o vídeo a partir de blob: (MSE/HLS).
  "media-src": ["'self'", "blob:"],
  "connect-src": ["'self'"],
  "worker-src": ["'self'", "blob:"],
  // Ninguém nos embute (mesma decisão do X-Frame-Options: DENY) e nós não
  // embutimos ninguém.
  "frame-ancestors": ["'none'"],
  "frame-src": ["'none'"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  // Só `report-uri`, sem `report-to`, de propósito. Medido no Chromium: com
  // as duas, ele usa APENAS `report-to` e ignora `report-uri` — e o
  // `report-to` entrega em lote, com atraso (nada chegou em 65 s de teste).
  // Com `report-uri` sozinho o relatório chega na hora. `report-uri` é
  // "obsoleto" no papel, mas é o que todo navegador entrega hoje.
  //
  // `upgrade-insecure-requests` também ficou de fora: em Report-Only o
  // navegador a ignora e escreve um aviso no console de cada visitante. Volta
  // quando a política passar a bloquear.
  "report-uri": ["/api/csp-report"],
};

/** Troca para `Content-Security-Policy` quando o relatório estiver limpo. */
export const HEADER_CSP = "Content-Security-Policy-Report-Only";

export function serializarPolitica(politica: Record<string, string[]> = POLITICA): string {
  return Object.entries(politica)
    .map(([diretiva, fontes]) => (fontes.length ? `${diretiva} ${fontes.join(" ")}` : diretiva))
    .join("; ");
}

/** Headers de CSP prontos para o `headers()` do next.config. */
export const headersDeCsp = [{ key: HEADER_CSP, value: serializarPolitica() }];

export type RelatorioCsp = {
  diretiva: string;
  bloqueado: string;
  pagina: string;
};

/** Tira query e fragmento: token em URL não pode parar no log. */
function semQuery(url: unknown): string {
  if (typeof url !== "string" || !url) return "";
  // "inline", "eval", "data" etc. vêm como palavra solta, não URL.
  if (!url.includes(":") || /^[a-z-]+$/.test(url)) return url;
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    return url.split(/[?#]/)[0];
  }
}

/**
 * Normaliza os dois formatos que existem (hoje só pedimos o primeiro, mas o
 * segundo é o que virá quando `report-to` for adotado — ver `POLITICA`):
 * - `application/csp-report` (report-uri): `{ "csp-report": { ... } }`, com
 *   chaves em kebab-case;
 * - `application/reports+json` (report-to): um ARRAY de
 *   `{ type: "csp-violation", body: { ... } }`, com chaves em camelCase.
 *
 * Devolve só o que interessa para ajustar a política, e descarta o resto
 * (amostra de código, user agent) — o log não precisa disso, e amostra de
 * script inline pode conter dado da página.
 */
export function lerRelatoriosCsp(corpo: unknown): RelatorioCsp[] {
  const brutos: Record<string, unknown>[] = [];

  if (Array.isArray(corpo)) {
    for (const item of corpo) {
      const r = item as { type?: unknown; body?: unknown };
      if (r?.type === "csp-violation" && r.body && typeof r.body === "object") {
        brutos.push(r.body as Record<string, unknown>);
      }
    }
  } else if (corpo && typeof corpo === "object" && "csp-report" in corpo) {
    const r = (corpo as Record<string, unknown>)["csp-report"];
    if (r && typeof r === "object") brutos.push(r as Record<string, unknown>);
  }

  return brutos.map((r) => ({
    diretiva: texto(
      r["effective-directive"] ?? r.effectiveDirective ?? r["violated-directive"],
    ).slice(0, 64),
    bloqueado: semQuery(texto(r["blocked-uri"] ?? r.blockedURL)).slice(0, 256),
    pagina: semQuery(texto(r["document-uri"] ?? r.documentURL)).slice(0, 256),
  }));
}

/**
 * Só string passa. O corpo é JSON de qualquer um: um campo pode ser objeto,
 * número, ou um objeto com `toString: null`, que faz `String(x)` lançar — e
 * uma exceção aqui viraria um 500 logado pelo Next, fora do orçamento do
 * filtro. Não coagimos nada: o que não é string vira vazio.
 */
function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

/**
 * Lê o corpo de uma requisição com teto de bytes, parando de bufferizar assim
 * que o teto estoura. `request.text()` não serve para rota pública: sem
 * `Content-Length` (chunked), ele carregaria o corpo inteiro na memória antes
 * de qualquer checagem. Devolve `null` quando passa do teto.
 */
export async function lerCorpoLimitado(
  corpo: ReadableStream<Uint8Array> | null,
  limiteBytes: number,
): Promise<string | null> {
  if (!corpo) return "";
  const leitor = corpo.getReader();
  const pedacos: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await leitor.read();
      if (done) break;
      total += value.byteLength;
      if (total > limiteBytes) {
        // Cancela o stream: o resto não chega a ser lido nem guardado.
        await leitor.cancel().catch(() => {});
        return null;
      }
      pedacos.push(value);
    }
  } finally {
    leitor.releaseLock();
  }
  return new TextDecoder().decode(Buffer.concat(pedacos));
}

/**
 * Decide o que vai para o log ATRAVÉS das requisições, porque o endpoint é
 * público e um cliente qualquer pode repetir POST sem fim (não há rate limit
 * na borda).
 *
 * Por janela (1 min), o log recebe no máximo `maxPorJanela` linhas
 * `csp-violation` (uma por violação DISTINTA, na hora em que aparece) e UMA
 * linha `csp-violation-resumo` no fechamento — teto rígido de
 * `maxPorJanela + 1` linhas por minuto, venha o que vier.
 *
 * O resumo carrega o que não virou linha própria: quantas vezes cada violação
 * se repetiu (as `maxResumo` mais frequentes; é isso que separa "aconteceu uma
 * vez" de "pega todo aluno") e quantas distintas foram descartadas por falta
 * de orçamento. Janela sem repetição nem descarte não gera resumo.
 *
 * O fechamento não depende de chegar outro relatório: a rota chama
 * `fecharSeVencida()` num timer. `registrar()` também fecha uma janela
 * vencida antes de contar, para o caso de o timer atrasar.
 *
 * Estado em memória do processo: o manifesto declara um único serviço `web`,
 * e o pior caso de um reinício é perder as contagens de até um minuto.
 */
export class FiltroDeRelatorios {
  private inicioJanela: number;
  private vistos = new Map<string, { relatorio: RelatorioCsp; repeticoes: number }>();
  private descartados = 0;

  constructor(
    readonly janelaMs = 60_000,
    private readonly maxPorJanela = 30,
    private readonly agora: () => number = Date.now,
    private readonly maxResumo = 10,
  ) {
    this.inicioJanela = this.agora();
  }

  /** Linhas a escrever agora para este relatório (zero, uma ou duas). */
  registrar(r: RelatorioCsp): Record<string, unknown>[] {
    const saida = this.fecharSeVencida();

    const chave = `${r.diretiva}|${r.bloqueado}|${r.pagina}`;
    const visto = this.vistos.get(chave);
    if (visto) {
      visto.repeticoes++;
    } else if (this.vistos.size >= this.maxPorJanela) {
      this.descartados++;
    } else {
      this.vistos.set(chave, { relatorio: r, repeticoes: 0 });
      saida.push({ evento: "csp-violation", ...r });
    }
    return saida;
  }

  /** Fecha a janela se o tempo dela acabou; devolve o resumo (ou nada). */
  fecharSeVencida(): Record<string, unknown>[] {
    const t = this.agora();
    if (t - this.inicioJanela < this.janelaMs) return [];

    const repetidas = [...this.vistos.values()]
      .filter((v) => v.repeticoes > 0)
      .sort((a, b) => b.repeticoes - a.repeticoes);
    const resumo =
      repetidas.length || this.descartados
        ? [
            {
              evento: "csp-violation-resumo",
              repeticoes: repetidas
                .slice(0, this.maxResumo)
                .map((v) => ({ ...v.relatorio, vezes: v.repeticoes })),
              repetidas_fora_do_resumo: Math.max(0, repetidas.length - this.maxResumo),
              descartadas: this.descartados,
            },
          ]
        : [];

    this.inicioJanela = t;
    this.vistos.clear();
    this.descartados = 0;
    return resumo;
  }
}
