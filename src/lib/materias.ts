import {
  Atom,
  BookOpen,
  Dna,
  FlaskConical,
  Globe2,
  Languages,
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
  /** Ilustração de apoio em /public/illustrations, quando houver. */
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
  historia: { chave: "historia", icone: Globe2, cor: "var(--materia-hum)", ilustracao: null },
  geografia: { chave: "geografia", icone: Globe2, cor: "var(--materia-hum)", ilustracao: null },
  portugues: { chave: "portugues", icone: Languages, cor: "var(--materia-ling)", ilustracao: null },
  ingles: { chave: "ingles", icone: Languages, cor: "var(--materia-ling)", ilustracao: null },
  literatura: {
    chave: "literatura",
    icone: Languages,
    cor: "var(--materia-ling)",
    ilustracao: null,
  },
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
