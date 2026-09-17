import type { Metadata } from "next";
import Link from "next/link";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { getGlossaryTerms } from "@/lib/payload/glossary";
import { getSubjects } from "@/lib/payload/queries";
import { idsFavoritas } from "@/features/practice/queries";
import { FavoriteButton } from "@/features/practice/components/favorite-button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Glossário — DespolarizaMED" };

export default async function GlossarioPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; disciplina?: string }>;
}) {
  const { session } = await requireAssinatura();
  const sp = await searchParams;
  const subjectId = sp.disciplina ? Number(sp.disciplina) : undefined;

  const [termos, disciplinas, favoritos] = await Promise.all([
    getGlossaryTerms({ busca: sp.q, subjectId }),
    getSubjects(),
    idsFavoritas(session.user.id, "GLOSSARY_TERM"),
  ]);
  const favoritosSet = new Set(favoritos);

  // Agrupado por inicial, como um glossário impresso; a busca ignora isso e
  // mostra a lista corrida.
  const porLetra = new Map<string, typeof termos>();
  for (const t of termos) {
    const inicial = t.term.charAt(0).toLocaleUpperCase("pt-BR").normalize("NFD").replace(/\p{M}/gu, "");
    const lista = porLetra.get(inicial) ?? [];
    lista.push(t);
    porLetra.set(inicial, lista);
  }
  const letras = [...porLetra.keys()].sort((a, b) => a.localeCompare(b, "pt-BR"));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">Glossário</h1>
      <p className="mt-1 text-muted-foreground">
        {termos.length.toLocaleString("pt-BR")} {termos.length === 1 ? "termo" : "termos"} ·
        definições escritas pelos professores
      </p>

      <form className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]" role="search">
        <Input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Buscar termo ou definição…"
          aria-label="Buscar no glossário"
        />
        <select
          name="disciplina"
          defaultValue={sp.disciplina ?? ""}
          aria-label="Disciplina"
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">Todas as disciplinas</option>
          {disciplinas.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Buscar
        </button>
      </form>

      {termos.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          {sp.q || sp.disciplina
            ? "Nenhum termo para essa busca."
            : "O glossário ainda está vazio. Os termos são cadastrados pelos professores no painel."}
        </p>
      ) : (
        <>
          {!sp.q && letras.length > 1 && (
            <nav className="mt-6 flex flex-wrap gap-1.5 text-xs" aria-label="Iniciais">
              {letras.map((l) => (
                <a
                  key={l}
                  href={`#letra-${l}`}
                  className="rounded-md border border-border px-2 py-1 font-medium text-muted-foreground hover:bg-muted"
                >
                  {l}
                </a>
              ))}
            </nav>
          )}

          <div className="mt-8 space-y-8">
            {letras.map((l) => (
              <section key={l} id={`letra-${l}`}>
                {!sp.q && (
                  <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{l}</h2>
                )}
                <dl className="space-y-3">
                  {porLetra.get(l)!.map((t) => {
                    const disciplina =
                      t.subject && typeof t.subject === "object" ? t.subject.name : null;
                    return (
                      <div key={t.id} className="rounded-lg border border-border bg-card p-4">
                        <dt className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{t.term}</span>
                          {disciplina && (
                            <Link
                              href={`/glossario?disciplina=${typeof t.subject === "object" ? t.subject?.id : ""}`}
                              className="text-xs text-muted-foreground hover:text-foreground"
                            >
                              {disciplina}
                            </Link>
                          )}
                          <span className="ml-auto">
                            <FavoriteButton
                              tipo="GLOSSARY_TERM"
                              id={String(t.id)}
                              inicial={favoritosSet.has(String(t.id))}
                            />
                          </span>
                        </dt>
                        <dd className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                          {t.definition}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
