import {
  Atom,
  BookOpen,
  BookOpenText,
  Dna,
  FlaskConical,
  Globe2,
  Landmark,
  Languages,
  PenLine,
  Sigma,
  type LucideIcon,
} from "lucide-react";

/**
 * Identidade visual de cada matéria: ícone, cor e ilustração.
 *
 * Existe para que "Biologia" seja a MESMA coisa em todo lugar — no card do
 * dashboard, no filtro do banco de questões, no evento do calendário e no
 * gráfico de desempenho. Antes cada tela escolhia um ícone (`BookOpen` para
 * tudo) e nenhuma escolhia cor, então nada era reconhecível de relance.
 *
 * Uma cor por disciplina — a paleta da versão do Paulo (ver o comentário de
 * `--materia-*` em globals.css). História e Geografia, Português e Inglês
 * dividiam cor antes; agora nenhuma matéria se confunde com outra.
 *
 * As cores vêm de `--materia-*` em globals.css. Nenhum componente escreve hex:
 * pede `cor` e usa como `color` / `background-color` via `style`, que é a
 * única forma de aplicar um token dinâmico sem gerar 6 classes Tailwind
 * mortas por matéria.
 */
export type Materia = {
  /** Chave normalizada, usada em `visualDaMateria`. */
  chave: string;
  icone: LucideIcon;
  /** Variável CSS da cor da matéria. */
  cor: string;
  /**
   * Ilustração de apoio em /public/illustrations, quando houver.
   *
   * NÃO use abaixo de ~130px de largura. Os desenhos foram traçados num
   * viewBox de 280 com linha de 4–5px; a 80px o traço cai para ~1,2px e o DNA
   * vira um borrão cinza. Em cartão pequeno o lugar do símbolo é o `icone`,
   * que é vetor de interface e foi desenhado para 16–24px.
   */
  ilustracao: string | null;
};

const FALLBACK: Materia = {
  chave: "geral",
  icone: BookOpen,
  cor: "var(--brand-600)",
  ilustracao: null,
};

const MATERIAS: Record<string, Materia> = {
  biologia: {
    chave: "biologia",
    icone: Dna,
    cor: "var(--materia-bio)",
    ilustracao: "/illustrations/estudo-dna.svg",
  },
  quimica: {
    chave: "quimica",
    icone: FlaskConical,
    cor: "var(--materia-quim)",
    ilustracao: "/illustrations/estudo-quimica.svg",
  },
  fisica: {
    chave: "fisica",
    icone: Atom,
    cor: "var(--materia-fis)",
    ilustracao: "/illustrations/estudo-fisica.svg",
  },
  matematica: {
    chave: "matematica",
    icone: Sigma,
    cor: "var(--materia-mat)",
    ilustracao: null,
  },
  historia: {
    chave: "historia",
    icone: Landmark,
    cor: "var(--materia-hist)",
    ilustracao: null,
  },
  geografia: { chave: "geografia", icone: Globe2, cor: "var(--materia-geo)", ilustracao: null },
  redacao: { chave: "redacao", icone: PenLine, cor: "var(--materia-red)", ilustracao: null },
  portugues: { chave: "portugues", icone: BookOpenText, cor: "var(--materia-port)", ilustracao: null },
  literatura: {
    chave: "literatura",
    icone: BookOpenText,
    cor: "var(--materia-port)",
    ilustracao: null,
  },
  ingles: { chave: "ingles", icone: Languages, cor: "var(--materia-ing)", ilustracao: null },
};

/** "Física e Química" -> "fisica-e-quimica"; acentos e caixa saem fora. */
function normalizar(valor: string) {
  return valor
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Aceita tanto o slug do Payload ("biologia") quanto o nome escrito por um
 * humano ("Biologia", "Ciências da Natureza — Biologia") ou a disciplina
 * sugerida pelo pipeline do acervo. Casa pela primeira palavra conhecida que
 * aparecer, e cai no visual neutro quando não reconhece — nunca inventa cor.
 */
export function visualDaMateria(nomeOuSlug: string | null | undefined): Materia {
  if (!nomeOuSlug) return FALLBACK;
  const texto = normalizar(nomeOuSlug);
  if (MATERIAS[texto.replace(/ /g, "")]) return MATERIAS[texto.replace(/ /g, "")];
  for (const [chave, materia] of Object.entries(MATERIAS)) {
    if (texto.includes(chave)) return materia;
  }
  return FALLBACK;
}
