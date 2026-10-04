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
    diretiva: String(
      r["effective-directive"] ?? r.effectiveDirective ?? r["violated-directive"] ?? "",
    ).slice(0, 64),
    bloqueado: semQuery(r["blocked-uri"] ?? r.blockedURL).slice(0, 256),
    pagina: semQuery(r["document-uri"] ?? r.documentURL).slice(0, 256),
  }));
}
