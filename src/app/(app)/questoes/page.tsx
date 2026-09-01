import type { Metadata } from "next";
import Link from "next/link";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import {
  buscarQuestoes,
  contarQuestoes,
  facetasDoAcervo,
  type FiltroQuestoes,
} from "@/features/library/queries";
import { QuestionCard } from "@/features/library/components/question-card";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Banco de questões — DespolarizaMED" };

const POR_PAGINA = 20;

export default async function QuestoesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; banca?: string; ano?: string; disciplina?: string; p?: string }>;
}) {
  await requireAssinatura();

  const sp = await searchParams;
  const pagina = Math.max(1, Number(sp.p) || 1);

  const filtro: FiltroQuestoes = {
    busca: sp.q,
    instituicaoSlug: sp.banca || undefined,
    ano: sp.ano ? Number(sp.ano) : undefined,
    disciplina: sp.disciplina || undefined,
    limite: POR_PAGINA,
    offset: (pagina - 1) * POR_PAGINA,
  };

  const [questoes, total, facetas] = await Promise.all([
    buscarQuestoes(filtro),
    contarQuestoes(filtro),
    facetasDoAcervo(),
  ]);

  const paginas = Math.ceil(total / POR_PAGINA);
  const linkPagina = (n: number) => {
    const p = new URLSearchParams();
    if (sp.q) p.set("q", sp.q);
    if (sp.banca) p.set("banca", sp.banca);
    if (sp.ano) p.set("ano", sp.ano);
    if (sp.disciplina) p.set("disciplina", sp.disciplina);
    if (n > 1) p.set("p", String(n));
    const s = p.toString();
    return s ? `/questoes?${s}` : "/questoes";
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">Banco de questões</h1>
      <p className="mt-1 text-muted-foreground">
        {total.toLocaleString("pt-BR")}{" "}
        {total === 1 ? "questão encontrada" : "questões encontradas"} · extraídas de provas
        originais, com gabarito conferido
      </p>

      {/* Busca e filtros por GET: o estado fica na URL, então dá para
          compartilhar um recorte ("FUVEST 2024 de genética") e voltar a ele
          pelo histórico. */}
      <form className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]" role="search">
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
            href={linkPagina(1).replace(/([?&])disciplina=[^&]*/, "$1").replace(/[?&]$/, "")}
            className={`rounded-full border px-2.5 py-1 ${!sp.disciplina ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}
          >
            todas
          </Link>
          {facetas.disciplinas.map((d) => (
            <Link
              key={d.disciplina}
              href={`/questoes?disciplina=${encodeURIComponent(d.disciplina ?? "")}`}
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
            Nenhuma questão para esses filtros.
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
              gabaritoLetra: q.gabaritoLetra,
              alternativas: q.alternativas.map((a) => ({
                letra: a.letra,
                texto: a.texto,
                correta: a.correta,
              })),
            }}
          />
        ))}
      </div>

      {paginas > 1 && (
        <nav className="mt-8 flex items-center justify-between text-sm" aria-label="Paginação">
          {pagina > 1 ? (
            <Link href={linkPagina(pagina - 1)} className="text-primary hover:underline">
              ← Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground">
            Página {pagina} de {paginas.toLocaleString("pt-BR")}
          </span>
          {pagina < paginas ? (
            <Link href={linkPagina(pagina + 1)} className="text-primary hover:underline">
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
