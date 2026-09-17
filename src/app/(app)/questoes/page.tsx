import type { Metadata } from "next";
import Link from "next/link";
import { requireAssinatura } from "@/lib/auth/require-subscription";
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
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Banco de questões — DespolarizaMED" };

const POR_PAGINA = 20;

const SITUACOES = [
  { valor: "", rotulo: "Todas" },
  { valor: "nao-respondidas", rotulo: "Não respondidas" },
  { valor: "respondidas", rotulo: "Já respondidas" },
  { valor: "erradas", rotulo: "Que errei" },
  { valor: "favoritas", rotulo: "Favoritas" },
] as const;

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">Banco de questões</h1>
      <p className="mt-1 text-muted-foreground">
        {total.toLocaleString("pt-BR")}{" "}
        {total === 1 ? "questão encontrada" : "questões encontradas"} · extraídas de provas
        originais, com gabarito conferido ·{" "}
        <Link href="/questoes/autorais" className="text-primary hover:underline">
          ver questões dos professores
        </Link>
      </p>

      {/* Busca e filtros por GET: o estado fica na URL, então dá para
          compartilhar um recorte ("FUVEST 2024 de genética") e voltar a ele
          pelo histórico. */}
      <form className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]" role="search">
        <Input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Buscar por assunto: ciclo de Krebs, mitose…"
          aria-label="Buscar no enunciado"
        />
        <select
          name="banca"
          defaultValue={sp.banca ?? ""}
          aria-label="Vestibular"
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">Todas as bancas</option>
          {facetas.instituicoes.map((i) => (
            <option key={i.valor} value={i.valor ?? ""}>
              {i.valor?.toUpperCase()} ({i.total})
            </option>
          ))}
        </select>
        <select
          name="ano"
          defaultValue={sp.ano ?? ""}
          aria-label="Ano"
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">Todos os anos</option>
          {facetas.anos.map((a) => (
            <option key={a.ano} value={a.ano ?? ""}>
              {a.ano} ({a.total})
            </option>
          ))}
        </select>
        <select
          name="situacao"
          defaultValue={sp.situacao ?? ""}
          aria-label="Situação"
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          {SITUACOES.map((s) => (
            <option key={s.valor} value={s.valor}>
              {s.valor ? s.rotulo : "Situação: todas"}
            </option>
          ))}
        </select>
        {sp.disciplina && <input type="hidden" name="disciplina" value={sp.disciplina} />}
        {sp.disciplina && temasDaDisciplina.length > 0 ? (
          <select
            name="tema"
            defaultValue={sp.tema ?? ""}
            aria-label="Tema"
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">Todos os temas de {sp.disciplina}</option>
            {temasDaDisciplina.map((t) => (
              <option key={t.tema} value={t.tema ?? ""}>
                {t.tema} ({t.total})
              </option>
            ))}
          </select>
        ) : (
          <span />
        )}
        <button
          type="submit"
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Filtrar
        </button>
      </form>

      {facetas.disciplinas.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Disciplina sugerida:</span>
          <Link
            href={linkCom({ disciplina: undefined, tema: undefined })}
            className={`rounded-full border px-2.5 py-1 ${!sp.disciplina ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}
          >
            todas
          </Link>
          {facetas.disciplinas.map((d) => (
            <Link
              key={d.disciplina}
              href={linkCom({ disciplina: d.disciplina ?? undefined, tema: undefined })}
              className={`rounded-full border px-2.5 py-1 ${sp.disciplina === d.disciplina ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}
            >
              {d.disciplina} ({d.total})
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 space-y-5">
        {questoes.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">
            {sp.situacao === "erradas"
              ? "Nenhuma questão errada pendente. Bom sinal."
              : sp.situacao === "favoritas"
                ? "Você ainda não favoritou nenhuma questão. Use a estrela no card."
                : "Nenhuma questão para esses filtros."}
          </p>
        )}
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

      {paginas > 1 && (
        <nav className="mt-8 flex items-center justify-between text-sm" aria-label="Paginação">
          {pagina > 1 ? (
            <Link href={linkCom({ p: pagina > 2 ? String(pagina - 1) : undefined })} className="text-primary hover:underline">
              ← Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground">
            Página {pagina} de {paginas.toLocaleString("pt-BR")}
          </span>
          {pagina < paginas ? (
            <Link href={linkCom({ p: String(pagina + 1) })} className="text-primary hover:underline">
              Próxima →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
