import type { Metadata } from "next";
import Link from "next/link";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { contarQuestoesAutorais, listarQuestoesAutorais } from "@/features/questions/queries";
import { getSubjects } from "@/lib/payload/queries";
import { renderizarMath } from "@/lib/math-html";
import { AuthoredQuestionCard } from "@/features/questions/components/authored-question-card";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Questões dos professores — DespolarizaMED" };

const POR_PAGINA = 20;

/**
 * Questões autorais para o aluno. Diferente de /questoes (acervo extraído),
 * aqui a disciplina e o tema são curados e a resolução é escrita pelo
 * professor. As respostas ainda não entram no histórico de desempenho — o
 * histórico é por id do acervo (ver `practice_answers`).
 */
export default async function QuestoesAutoraisPage({
  searchParams,
}: {
  searchParams: Promise<{ disciplina?: string; dificuldade?: string; p?: string }>;
}) {
  await requireAssinatura();
  const sp = await searchParams;
  const pagina = Math.max(1, Number(sp.p) || 1);
  const subjectId = sp.disciplina ? Number(sp.disciplina) : undefined;
  const difficulty = ["FACIL", "MEDIA", "DIFICIL"].includes(sp.dificuldade ?? "")
    ? (sp.dificuldade as "FACIL" | "MEDIA" | "DIFICIL")
    : undefined;

  const [questoes, total, disciplinas] = await Promise.all([
    listarQuestoesAutorais({ subjectId, difficulty, limite: POR_PAGINA, offset: (pagina - 1) * POR_PAGINA }),
    contarQuestoesAutorais({ subjectId, difficulty }),
    getSubjects(),
  ]);
  const paginas = Math.ceil(total / POR_PAGINA);

  const link = (mud: { disciplina?: string; dificuldade?: string; p?: string }) => {
    const p = new URLSearchParams();
    const atual = { disciplina: sp.disciplina, dificuldade: sp.dificuldade, ...mud };
    for (const [k, v] of Object.entries(atual)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/questoes/autorais?${s}` : "/questoes/autorais";
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        migalhas={[
          { rotulo: "Banco de questões", href: "/questoes" },
          { rotulo: "Questões dos professores" },
        ]}
        titulo="Questões dos professores"
        descricao={`${total} ${total === 1 ? "questão escrita" : "questões escritas"} pela equipe, com resolução comentada — disciplina e tema definidos por quem escreveu, não sugeridos por algoritmo.`}
      />

      <div className="mt-6 flex flex-wrap gap-2 text-xs">
        <Link href={link({ disciplina: undefined, p: undefined })} className={`rounded-full border px-2.5 py-1 ${!subjectId ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}>
          todas
        </Link>
        {disciplinas.map((d) => (
          <Link key={d.id} href={link({ disciplina: String(d.id), p: undefined })} className={`rounded-full border px-2.5 py-1 ${subjectId === d.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}>
            {d.name}
          </Link>
        ))}
        <span className="mx-1 text-muted-foreground">·</span>
        {(["FACIL", "MEDIA", "DIFICIL"] as const).map((d) => (
          <Link key={d} href={link({ dificuldade: difficulty === d ? undefined : d, p: undefined })} className={`rounded-full border px-2.5 py-1 ${difficulty === d ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}>
            {d.toLowerCase()}
          </Link>
        ))}
      </div>

      <div className="mt-8 space-y-5">
        {questoes.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">Nenhuma questão autoral ainda para esse filtro.</p>
        )}
        {questoes.map((q) => (
          <AuthoredQuestionCard
            key={q.id}
            questao={{
              id: q.id,
              disciplina: q.disciplina,
              topic: q.topic,
              subtopic: q.subtopic,
              difficulty: q.difficulty,
              vestibular: q.vestibular,
              year: q.year,
              type: q.type,
              statementHtml: renderizarMath(q.statement),
              alternativas: q.alternativas.map((a) => ({
                label: a.label,
                contentHtml: renderizarMath(a.content),
              })),
            }}
          />
        ))}
      </div>

      {paginas > 1 && (
        <nav className="mt-8 flex items-center justify-between text-sm" aria-label="Paginação">
          {pagina > 1 ? (
            <Link href={link({ p: pagina > 2 ? String(pagina - 1) : undefined })} className="text-primary hover:underline">← Anterior</Link>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground">Página {pagina} de {paginas}</span>
          {pagina < paginas ? (
            <Link href={link({ p: String(pagina + 1) })} className="text-primary hover:underline">Próxima →</Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
