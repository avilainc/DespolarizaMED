import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, PenLine } from "lucide-react";

import { requireAssinatura } from "@/lib/auth/require-subscription";
import {
  buscarQuestoes,
  contarQuestoes,
  facetasDoAcervo,
  type FiltroQuestoes,
} from "@/features/library/queries";
import { idsErradas, idsFavoritas, idsRespondidas, ultimasRespostas } from "@/features/practice/queries";
import { QuestionCard } from "@/features/library/components/question-card";
import { QuestionFilters } from "@/features/library/components/question-filters";
import { PageHeader, PageShell } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { IllustrationSearch, IllustrationStar } from "@/components/illustrations";
import { SubjectIcon } from "@/components/subject-icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Banco de questões — DespolarizaMED" };

const POR_PAGINA = 20;

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

  const temasDaDisciplina = sp.disciplina ? facetas.temas.filter((t) => t.disciplina === sp.disciplina) : [];

  const paginas = Math.ceil(total / POR_PAGINA);
  const linkCom = (mudancas: Partial<Params>) => {
    const p = new URLSearchParams();
    const atual: Params = { ...sp, p: undefined, ...mudancas };
    for (const [k, v] of Object.entries(atual)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/questoes?${s}` : "/questoes";
  };

  const filtrosAtivos = [sp.banca, sp.ano, sp.situacao, sp.tema].filter(Boolean).length;
  const temFiltro = filtrosAtivos > 0 || Boolean(sp.q) || Boolean(sp.disciplina);

  return (
    <PageShell>
      <PageHeader
        titulo="Banco de questões"
        migalhas={[{ rotulo: "Início", href: "/dashboard" }, { rotulo: "Banco de questões" }]}
        descricao={
          <>
            {total.toLocaleString("pt-BR")} {total === 1 ? "questão" : "questões"} de provas originais, com
            gabarito conferido.
          </>
        }
        acoes={
          <Button variant="outline" render={<Link href="/questoes/autorais" />}>
            <PenLine />
            Questões dos professores
          </Button>
        }
      />

      <QuestionFilters
        valores={sp}
        totalFiltros={filtrosAtivos}
        bancas={facetas.instituicoes
          .filter((i) => i.valor)
          .map((i) => ({ valor: i.valor!, rotulo: i.valor!.toUpperCase(), total: i.total }))}
        anos={facetas.anos
          .filter((a) => a.ano != null)
          .map((a) => ({ valor: String(a.ano), rotulo: String(a.ano), total: a.total }))}
        temas={temasDaDisciplina
          .filter((t) => t.tema)
          .map((t) => ({ valor: t.tema!, rotulo: t.tema!, total: t.total }))}
      />

      {/* Fichas de disciplina com o ícone da matéria: é o filtro mais usado e
          o que dá identidade à página, então fica fora da gaveta, sempre à
          vista. Rolagem horizontal própria no celular, para as fichas não
          empurrarem a largura da página. */}
      {facetas.disciplinas.length > 0 && (
        <div className="-mx-4 mb-6 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
          <div className="flex w-max items-center gap-2">
            <Link
              href={linkCom({ disciplina: undefined, tema: undefined })}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                !sp.disciplina
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted",
              )}
            >
              Todas
            </Link>
            {facetas.disciplinas
              .filter((d) => d.disciplina)
              .map((d) => (
                <Link
                  key={d.disciplina}
                  href={linkCom({ disciplina: d.disciplina ?? undefined, tema: undefined })}
                  aria-current={sp.disciplina === d.disciplina ? "true" : undefined}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full border py-1.5 pr-3.5 pl-1.5 text-sm font-medium transition-colors",
                    sp.disciplina === d.disciplina
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-foreground hover:bg-muted",
                  )}
                >
                  <SubjectIcon disciplina={d.disciplina} size="sm" className="size-7 [&>svg]:size-3.5" />
                  {d.disciplina}
                  <span className="text-xs font-normal text-muted-foreground">
                    {d.total.toLocaleString("pt-BR")}
                  </span>
                </Link>
              ))}
          </div>
        </div>
      )}

      {questoes.length === 0 ? (
        <EmptyState
          ilustracao={sp.situacao === "favoritas" ? <IllustrationStar /> : <IllustrationSearch />}
          titulo={
            sp.situacao === "erradas"
              ? "Nenhuma questão errada pendente"
              : sp.situacao === "favoritas"
                ? "Nenhuma questão favoritada"
                : "Nenhuma questão para esses filtros"
          }
          descricao={
            sp.situacao === "erradas"
              ? "Você não tem questões erradas esperando revisão. Bom sinal."
              : sp.situacao === "favoritas"
                ? "Use a estrela no canto do card para guardar uma questão e voltar a ela depois."
                : "Tente tirar um filtro, trocar a banca ou buscar por outro termo."
          }
          acao={
            temFiltro ? (
              <Button variant="outline" render={<Link href="/questoes" />}>
                Limpar filtros
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {questoes.map((q) => (
            <QuestionCard
              key={q.id}
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
          ))}
        </div>
      )}

      {paginas > 1 && (
        <nav className="mt-8 flex items-center justify-between gap-4" aria-label="Paginação">
          {pagina > 1 ? (
            <Button variant="outline" render={<Link href={linkCom({ p: pagina > 2 ? String(pagina - 1) : undefined })} />}>
              <ArrowLeft />
              Anterior
            </Button>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted-foreground">
            Página {pagina.toLocaleString("pt-BR")} de {paginas.toLocaleString("pt-BR")}
          </span>
          {pagina < paginas ? (
            <Button variant="outline" render={<Link href={linkCom({ p: String(pagina + 1) })} />}>
              Próxima
              <ArrowRight />
            </Button>
          ) : (
            <span />
          )}
        </nav>
      )}
    </PageShell>
  );
}
