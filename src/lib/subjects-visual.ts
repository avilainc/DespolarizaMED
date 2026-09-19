import { Atom, BookOpen, Calculator, Dna, FlaskConical, Globe2, Landmark, Languages, type LucideIcon } from "lucide-react";

/**
 * Ícone e cor por disciplina, para dar identidade a card/badge sem virar
 * carnaval (usado só em ícone/acento, nunca em grande área de fundo).
 *
 * Duas fontes gravam o nome da disciplina de formas diferentes: o Payload
 * (collection `subjects`) usa título ("Biologia"); o classificador do acervo
 * (`disciplina_sugerida`) grava maiúsculo sem acento ("BIOLOGIA",
 * "FILOSOFIA_SOCIOLOGIA"). Normaliza os dois para a mesma chave.
 */
function normalizar(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z]+/g, "_")
    .replace(/^_|_$/g, "");
}

type VisualDisciplina = { icon: LucideIcon; corVar: string };

const MAPA: Record<string, VisualDisciplina> = {
  BIOLOGIA: { icon: Dna, corVar: "--subject-biologia" },
  QUIMICA: { icon: FlaskConical, corVar: "--subject-quimica" },
  FISICA: { icon: Atom, corVar: "--subject-fisica" },
  MATEMATICA: { icon: Calculator, corVar: "--subject-matematica" },
  PORTUGUES: { icon: Languages, corVar: "--subject-portugues" },
  INGLES: { icon: Languages, corVar: "--subject-ingles" },
  HISTORIA: { icon: Landmark, corVar: "--subject-historia" },
  GEOGRAFIA: { icon: Globe2, corVar: "--subject-geografia" },
  FILOSOFIA_SOCIOLOGIA: { icon: BookOpen, corVar: "--subject-filosofia" },
  FILOSOFIA: { icon: BookOpen, corVar: "--subject-filosofia" },
  SOCIOLOGIA: { icon: BookOpen, corVar: "--subject-filosofia" },
};

const PADRAO: VisualDisciplina = { icon: BookOpen, corVar: "--subject-default" };

export function visualDaDisciplina(nome: string | null | undefined): VisualDisciplina {
  if (!nome) return PADRAO;
  return MAPA[normalizar(nome)] ?? PADRAO;
}
