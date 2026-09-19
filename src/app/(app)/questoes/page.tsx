import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, PenLine } from "lucide-react";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { visualDaMateria } from "@/lib/materias";
import {
  buscarQuestoes,
  contarQuestoes,
  facetasDoAcervo,
  type FiltroQuestoes,
} from "@/features/library/queries";
import {
  idsErradas,
  idsFavoritas,
  idsRespondidas,
  ultimasRespostas,
} from "@/features/practice/queries";
import { QuestionCard } from "@/features/library/components/question-card";
import { QuestionFilters } from "@/features/library/components/question-filters";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterChip } from "@/components/ui/chip";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Banco de questões — DespolarizaMED" };

const POR_PAGINA = 20;

const SITUACOES = [
  { valor: "", rotulo: "Situação: todas" },
  { valor: "nao-respondidas", rotulo: "Não respondidas" },
  { valor: "respondidas", rotulo: "Já respondidas" },
  { valor: "erradas", rotulo: "Que errei" },
  { valor: "favoritas", rotulo: "Favoritas" },
];

type Params = {
  q?: string;
  banca?: string;
  ano?: string;
  disciplina?: string;
  tema?: string;
  situacao?: string;
  p?: string;
};

export default async function QuestoesPage({ searchParams }: { searchParams: Promise<Params> }) {
  const { session } = await requireAssinatura();

  const sp = await searchParams;
  const pagina = Math.max(1, Number(sp.p) || 1);
  const alunoId = session.user.id;

  // Os conjuntos do aluno só são carregados quando o filtro pede: para
  // "todas", nada disso entra na consulta.
  let idsIn: string[] | undefined;
  let idsNotIn: string[] | undefined;
  if (sp.situacao === "respondidas") idsIn = await idsRespondidas(alunoId);
  else if (sp.situacao === "nao-respondidas") idsNotIn = await idsRespondidas(alunoId);
  else if (sp.situacao === "erradas") idsIn = await idsErradas(alunoId);
  else if (sp.situacao === "favoritas") idsIn = await idsFavoritas(alunoId, "QUESTION");

  const filtro: FiltroQuestoes = {
    busca: sp.q,
    instituicaoSlug: sp.banca || undefined,
    ano: sp.ano ? Number(sp.ano) : undefined,
    disciplina: sp.disciplina || undefined,
    tema: sp.tema || undefined,
    idsIn,
    idsNotIn,
    limite: POR_PAGINA,
    offset: (pagina - 1) * POR_PAGINA,
  };

  const [questoes, total, facetas] = await Promise.all([
    buscarQuestoes(filtro),
    contarQuestoes(filtro),
    facetasDoAcervo(),
  ]);

  const [respostas, favoritas] = await Promise.all([
    ultimasRespostas(
      alunoId,
      questoes.map((q) => q.id),
    ),
    idsFavoritas(alunoId, "QUESTION"),
  ]);
  const favoritasSet = new Set(favoritas);

  const temasDaDisciplina = sp.disciplina
    ? facetas.temas.filter((t) => t.disciplina === sp.disciplina)
    : [];

  const paginas = Math.ceil(total / POR_PAGINA);
  const linkCom = (mudancas: Partial<Params>) => {
    const p = new URLSearchParams();
    const atual: Params = { ...sp, p: undefined, ...mudancas };
    for (const [k, v] of Object.entries(atual)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/questoes?${s}` : "/questoes";
  };

  const temFiltro = Boolean(sp.q || sp.banca || sp.ano || sp.disciplina || sp.tema || sp.situacao);

  return (
    <>
      <PageHeader
        titulo="Banco de questões"
        descricao="Questões extraídas de provas originais, com o gabarito conferido contra o caderno oficial. Responda direto no card: a resposta fica registrada no seu desempenho."
        acoes={
          <Link href="/questoes/autorais" className={buttonVariants({ variant: "outline" })}>
            <PenLine data-icon="inline-start" aria-hidden />
            Questões dos professores
          </Link>
        }
      />

      <QuestionFilters
        total={total}
        valores={{
          q: sp.q,
          banca: sp.banca,
          ano: sp.ano,
          tema: sp.tema,
          situacao: sp.situacao,
          disciplina: sp.disciplina,
        }}
        bancas={facetas.instituicoes
          .filter((i) => i.valor)
          .map((i) => ({
            valor: i.valor!,
            rotulo: i.valor!.toUpperCase(),
            total: i.total,
          }))}
        anos={facetas.anos
          .filter((a) => a.ano)
          .map((a) => ({ valor: String(a.ano), rotulo: String(a.ano), total: a.total }))}
        temas={temasDaDisciplina
          .filter((t) => t.tema)
          .map((t) => ({ valor: t.tema!, rotulo: t.tema!, total: t.total }))}
        situacoes={SITUACOES}
      />

      {/* Disciplina por chip e não por <select>: são poucas, cada uma tem cor e
          ícone próprios, e o chip mostra o volume de cada uma sem abrir nada. */}
      {facetas.disciplinas.length > 0 && (
        <nav aria-label="Filtrar por disciplina" className="mb-6 flex flex-wrap gap-2">
          <FilterChip
            href={linkCom({ disciplina: undefined, tema: undefined })}
            ativo={!sp.disciplina}
          >
            Todas as disciplinas
          </FilterChip>
          {facetas.disciplinas.map((d) => {
            const visual = visualDaMateria(d.disciplina);
            return (
              <FilterChip
                key={d.disciplina}
                href={linkCom({ disciplina: d.disciplina ?? undefined, tema: undefined })}
                ativo={sp.disciplina === d.disciplina}
                icone={visual.icone}
                cor={visual.cor}
                contagem={d.total}
              >
                {d.disciplina}
              </FilterChip>
            );
          })}
        </nav>
      )}

      <p className="t-meta tabular mb-4">
        {total.toLocaleString("pt-BR")}{" "}
        {total === 1 ? "questão encontrada" : "questões encontradas"}
        {paginas > 1 && ` · página ${pagina} de ${paginas.toLocaleString("pt-BR")}`}
      </p>

      {questoes.length === 0 ? (
        <EmptyState
          ilustracao="/illustrations/vazio-busca.svg"
          titulo={
            sp.situacao === "erradas"
              ? "Nenhuma questão errada pendente"
              : sp.situacao === "favoritas"
                ? "Você ainda não favoritou nenhuma questão"
                : "Nenhuma questão para esse recorte"
          }
          descricao={
            sp.situacao === "erradas"
              ? "Bom sinal: tudo que você errou já foi refeito. Escolha outra situação para continuar praticando."
              : sp.situacao === "favoritas"
                ? "Use a estrela no canto de cada questão para guardar as que você quer revisar depois."
                : "Tente afrouxar um filtro — menos anos, outra banca, ou uma busca mais curta."
          }
          acao={
            temFiltro ? (
              <Link href="/questoes" className={buttonVariants({ variant: "brand" })}>
                Limpar filtros
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ol className="space-y-5">
          {questoes.map((q, i) => (
            <li key={q.id}>
              <QuestionCard
                ordem={(pagina - 1) * POR_PAGINA + i + 1}
                questao={{
                  id: q.id,
                  enunciado: q.enunciado,
                  numero: q.numero,
                  ano: q.ano,
                  instituicaoSlug: q.instituicaoSlug,
                  disciplinaSugerida: q.disciplinaSugerida,
                  alternativas: q.alternativas.map((a) => ({ letra: a.letra, texto: a.texto })),
                  respostaAnterior: respostas.get(q.id) ?? null,
                  favorita: favoritasSet.has(q.id),
                }}
              />
            </li>
          ))}
        </ol>
      )}

      {paginas > 1 && (
        <nav
          className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6"
          aria-label="Paginação"
        >
          {pagina > 1 ? (
            <Link
              href={linkCom({ p: pagina > 2 ? String(pagina - 1) : undefined })}
              className={buttonVariants({ variant: "outline" })}
            >
              <ChevronLeft data-icon="inline-start" aria-hidden />
              Anterior
            </Link>
          ) : (
            <span />
          )}

          <span className="tabular text-[0.875rem] text-text-muted">
            {pagina} / {paginas.toLocaleString("pt-BR")}
          </span>

          {pagina < paginas ? (
            <Link
              href={linkCom({ p: String(pagina + 1) })}
              className={buttonVariants({ variant: "outline" })}
            >
              Próxima
              <ChevronRight data-icon="inline-end" aria-hidden />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
