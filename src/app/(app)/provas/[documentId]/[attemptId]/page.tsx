import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { obterProva } from "@/features/library/queries";
import { obterTentativa } from "@/features/practice/queries";
import { AnswerSheet, type QuestaoDaProva } from "@/features/practice/components/answer-sheet";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Resolvendo prova — DespolarizaMED" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function TentativaPage({
  params,
}: {
  params: Promise<{ documentId: string; attemptId: string }>;
}) {
  const { session } = await requireAssinatura();
  const { documentId, attemptId } = await params;
  if (!UUID.test(documentId) || !UUID.test(attemptId)) notFound();

  const tentativa = await obterTentativa(attemptId, session.user.id);
  if (!tentativa || tentativa.documentId !== documentId) notFound();
  if (tentativa.finishedAt) redirect(`/provas/${documentId}/${attemptId}/resultado`);

  const prova = await obterProva(documentId);
  if (!prova) notFound();

  // Texto-base de uma questão é o enunciado de outra da mesma prova.
  const enunciadoPorNumero = new Map(prova.questoes.map((q) => [q.numero, q.enunciado]));

  // Sem gabarito: o cliente não recebe a resposta certa em hipótese alguma.
  const questoes: QuestaoDaProva[] = prova.questoes.map((q) => ({
    id: q.id,
    numero: q.numero,
    enunciado: q.enunciado,
    contexto: q.contextoNumero !== null ? (enunciadoPorNumero.get(q.contextoNumero) ?? null) : null,
    alternativas: q.alternativas.map((a) => ({ letra: a.letra, texto: a.texto })),
  }));

  const respostasIniciais: Record<string, string> = {};
  for (const [id, r] of tentativa.respostas) respostasIniciais[id] = r.letra.toUpperCase();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={`/provas/${documentId}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Sair (as respostas ficam salvas)
          </Link>
          <h1 className="mt-2 text-xl font-bold text-foreground">
            {prova.instituicao} {prova.ano}
            {prova.fase ? ` · ${prova.fase}` : ""}
          </h1>
        </div>
      </div>

      <AnswerSheet
        attemptId={attemptId}
        documentId={documentId}
        questoes={questoes}
        respostasIniciais={respostasIniciais}
      />
    </div>
  );
}
