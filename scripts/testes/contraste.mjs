/**
 * Mede o contraste dos pares de cor que a interface realmente usa, contra o
 * mínimo da WCAG 2.1 AA (4,5:1 para texto normal, 3:1 para texto grande e
 * para borda/ícone que carrega significado).
 *
 * Os valores NÃO são copiados para cá: o script lê `src/app/globals.css`, pega
 * os tokens do `:root` e resolve as referências entre eles. Se alguém escurecer
 * o `--text-muted` ou clarear o `--surface`, a medida acompanha — que é o
 * ponto. Um arquivo com números fixos mentiria no primeiro ajuste de paleta.
 *
 * Mede os DOIS temas: o claro (`:root`) e o escuro (`:root` com as
 * sobrescritas de `.dark` por cima, que é como o navegador resolve). O escuro
 * é o padrão desde a paleta do Paulo; medir só o claro deixaria a tela que o
 * aluno mais vê sem garantia nenhuma.
 *
 * Uso: node scripts/testes/contraste.mjs
 * Sai diferente de zero se algum par reprovar.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const CSS = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");

function lerTokens(bloco, base = new Map()) {
  const mapa = new Map(base);
  for (const [, nome, valor] of bloco.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    mapa.set(nome, valor.trim());
  }
  return mapa;
}

/** O primeiro bloco `:root` e o bloco `.dark` logo depois dele. */
const inicioEscuro = CSS.indexOf(".dark {");
const raiz = CSS.slice(CSS.indexOf(":root {"), CSS.indexOf("/* Tema escuro"));
const escuro = CSS.slice(inicioEscuro, CSS.indexOf("}", inicioEscuro));

const TEMAS = [
  ["claro", lerTokens(raiz)],
  ["escuro", lerTokens(escuro, lerTokens(raiz))],
];

let tokens = TEMAS[0][1];

/** Resolve `var(--x)` em cadeia até chegar num oklch() literal. */
function resolver(valor, profundidade = 0) {
  if (profundidade > 8) throw new Error(`referência circular em ${valor}`);
  const ref = valor.match(/^var\(--([\w-]+)\)$/);
  if (!ref) return valor;
  const alvo = tokens.get(ref[1]);
  if (!alvo) throw new Error(`token desconhecido: --${ref[1]}`);
  return resolver(alvo, profundidade + 1);
}

function cor(nome) {
  const bruto = tokens.get(nome);
  if (!bruto) throw new Error(`token desconhecido: --${nome}`);
  return oklchParaRgb(resolver(bruto));
}

/** oklch(L C H) -> [r,g,b] em 0–255. */
function oklchParaRgb(css) {
  const m = css.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (!m) throw new Error(`não é oklch: ${css}`);
  const [L, C, H] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const a = C * Math.cos((H * Math.PI) / 180);
  const b = C * Math.sin((H * Math.PI) / 180);

  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const lin = [
    +4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s,
  ];

  return lin.map((v) => {
    const g = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
    return Math.min(255, Math.max(0, Math.round(g * 255)));
  });
}

function luminancia([r, g, b]) {
  const c = [r, g, b].map((v) => {
    const n = v / 255;
    return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function contraste(frente, fundo) {
  const a = luminancia(frente);
  const b = luminancia(fundo);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const BRANCO = [255, 255, 255];

/** [descrição, frente, fundo, mínimo exigido] */
function pares() {
  return [
  ["texto principal / fundo da página", cor("text-primary"), cor("background"), 4.5],
  ["texto principal / superfície", cor("text-primary"), cor("surface"), 4.5],
  ["texto secundário / superfície", cor("text-secondary"), cor("surface"), 4.5],
  ["texto de apoio / superfície", cor("text-muted"), cor("surface"), 4.5],
  ["texto de apoio / superfície sutil", cor("text-muted"), cor("surface-subtle"), 4.5],
  ["texto de apoio / fundo da página", cor("text-muted"), cor("background"), 4.5],
  ["link e ação (brand-600) / superfície", cor("brand-600"), cor("surface"), 4.5],
  ["link e ação (brand-600) / fundo da página", cor("brand-600"), cor("background"), 4.5],
  ["item ativo do menu (brand-800) / brand-50", cor("brand-800"), cor("brand-50"), 4.5],
  ["chip ativo (brand-700) / brand-50", cor("brand-700"), cor("brand-50"), 4.5],
  ["branco / botão primário (primary)", BRANCO, cor("primary"), 4.5],
  ["branco / botão de ação (acao)", BRANCO, cor("acao"), 4.5],
  ["branco / botão de ação no hover (acao-hover)", BRANCO, cor("acao-hover"), 4.5],
  ["branco / fundo verde (success)", BRANCO, cor("success"), 4.5],
  ["branco / fundo vermelho (danger)", BRANCO, cor("danger"), 4.5],
  ["acerto: success-text / success-soft", cor("success-text"), cor("success-soft"), 4.5],
  ["atenção: warning-text / warning-soft", cor("warning-text"), cor("warning-soft"), 4.5],
  ["erro: danger-text / danger-soft", cor("danger-text"), cor("danger-soft"), 4.5],
  ["laranja da marca como texto / superfície", cor("brand-orange-texto"), cor("surface"), 4.5],
  ["texto do botão laranja / destaque", cor("destaque-texto"), cor("destaque"), 4.5],
  ["texto do botão laranja / destaque no hover", cor("destaque-texto"), cor("destaque-hover"), 4.5],
  ["laranja da marca como texto / fundo da página", cor("brand-orange-texto"), cor("background"), 4.5],
  ["teal como texto / fundo da página", cor("brand-teal-texto"), cor("background"), 4.5],
  ["texto do selo teal / brand-teal", cor("destaque-texto"), cor("brand-teal"), 4.5],
  ["texto do painel de login / marca-funda", cor("marca-funda-texto"), cor("marca-funda"), 4.5],
  // Faixa final da landing: azul-marinho cheio, com título branco e apoio
  // em brand-100. É o único bloco escuro da página pública.
  ["branco / faixa final (marca-funda)", BRANCO, cor("marca-funda"), 4.5],
  ["botão claro da faixa final (brand-800) / brand-50", cor("brand-800"), cor("brand-50"), 4.5],
  // Sobretítulo de seção da landing, sobre os dois fundos em que aparece.
  ["sobretítulo (brand-600) / superfície sutil", cor("brand-600"), cor("surface-subtle"), 4.5],
  ["texto secundário / superfície sutil", cor("text-secondary"), cor("surface-subtle"), 4.5],
  // Matérias: além de ícone e faixa, a cor ESCREVE o nome da matéria nos
  // chips (texto de 11–13px), então a régua é a de texto normal, 4,5:1.
  ["matéria biologia / superfície", cor("materia-bio"), cor("surface"), 4.5],
  ["matéria química / superfície", cor("materia-quim"), cor("surface"), 4.5],
  ["matéria física / superfície", cor("materia-fis"), cor("surface"), 4.5],
  ["matéria matemática / superfície", cor("materia-mat"), cor("surface"), 4.5],
  ["matéria geografia / superfície", cor("materia-geo"), cor("surface"), 4.5],
  ["matéria história / superfície", cor("materia-hist"), cor("surface"), 4.5],
  ["matéria redação / superfície", cor("materia-red"), cor("surface"), 4.5],
  ["matéria português / superfície", cor("materia-port"), cor("surface"), 4.5],
  ["matéria inglês / superfície", cor("materia-ing"), cor("surface"), 4.5],
  // Não-texto: borda de campo e anel de foco precisam de 3:1 contra o vizinho.
  ["borda de campo / superfície", cor("border-strong"), cor("surface"), 3],
  ["anel de foco / superfície", cor("focus"), cor("surface"), 3],
  ["anel de foco / fundo da página", cor("focus"), cor("background"), 3],
];
}


let reprovados = 0;
let total = 0;
for (const [nomeTema, mapa] of TEMAS) {
  tokens = mapa;
  console.log(`\n— tema ${nomeTema} —`);
  for (const [nome, frente, fundo, minimo] of pares()) {
    total++;
    const razao = contraste(frente, fundo);
    const ok = razao >= minimo;
    if (!ok) reprovados++;
    console.log(
      `${ok ? "ok  " : "FALHA"} ${razao.toFixed(2).padStart(6)}:1  (mín ${minimo})  ${nome}`,
    );
  }
}

console.log(`\n${total - reprovados}/${total} pares aprovados na WCAG 2.1 AA.`);

if (reprovados) {
  console.error(`contraste: ${reprovados} par(es) abaixo do mínimo`);
  process.exit(1);
}
