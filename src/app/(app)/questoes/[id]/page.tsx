import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { obterQuestao } from "@/features/library/queries";
import { idsFavoritas, ultimasRespostas } from "@/features/practice/queries";
import { QuestionCard } from "@/features/library/components/question-card";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Questão — DespolarizaMED" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function QuestaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { session, role } = await requireAssinatura();
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const q = await obterQuestao(id);
  // Questão não validada não é servida ao aluno, nem por link direto. Quem
  // revisa (ADMIN/TEACHER) precisa enxergá-la para decidir.
  const revisor = role === "ADMIN" || role === "TEACHER";
  if (!q || (!q.validada && !revisor)) notFound();

  const [respostas, favoritas] = await Promise.all([
    ultimasRespostas(session.user.id, [id]),
    idsFavoritas(session.user.id, "QUESTION"),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href="/questoes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Banco de questões
      </Link>

      {!q.validada && (
        <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          Questão não validada: visível só para revisores. O aluno recebe 404 aqui.
        </p>
      )}
      <h1 className="mt-4 text-2xl font-bold text-foreground">
        {q.instituicaoSlug?.toUpperCase()} {q.ano}
        {q.numero ? ` · Questão ${q.numero}` : ""}
      </h1>
      {(q.fase || q.curso) && (
        <p className="mt-1 text-sm text-muted-foreground">
          {[q.fase, q.curso].filter(Boolean).join(" · ")}
        </p>
      )}

      {q.contexto && (
        <section className="mt-6 rounded-lg border border-border bg-muted/40 p-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Texto-base (questão {q.contextoNumero})
          </h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{q.contexto}</p>
        </section>
      )}

      {q.figuras.length > 0 && (
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          {q.figuras.map((f) => (
            // eslint-disable-next-line @next/next/no-img-element -- rota autenticada, sem otimização do Next
            <img
              key={f.id}
              src={`/api/figuras/${f.arquivo}`}
              alt={`Figura ${f.indice + 1} da questão ${q.numero ?? ""}`}
              width={f.larguraPx ?? undefined}
              height={f.alturaPx ?? undefined}
              className="max-w-full rounded-md border border-border bg-white"
            />
          ))}
        </section>
      )}

      <div className="mt-6">
        <QuestionCard
          mostrarLinkDetalhe={false}
          questao={{
            id: q.id,
            enunciado: q.enunciado,
            numero: q.numero,
            ano: q.ano,
            instituicaoSlug: q.instituicaoSlug,
            disciplinaSugerida: q.disciplinaSugerida,
            alternativas: q.alternativas.map((a) => ({ letra: a.letra, texto: a.texto })),
            respostaAnterior: respostas.get(q.id) ?? null,
            favorita: favoritas.includes(q.id),
          }}
        />
      </div>

      {q.temaSugerido && (
        <p className="mt-4 text-xs text-muted-foreground">
          Tema sugerido: {q.temaSugerido} · classificação automática, pode estar errada.
        </p>
      )}
    </div>
  );
}
