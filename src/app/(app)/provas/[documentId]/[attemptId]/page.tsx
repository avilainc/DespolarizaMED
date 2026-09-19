import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAssinatura } from "@/lib/auth/require-subscription";
import { obterProva } from "@/features/library/queries";
import { obterTentativa } from "@/features/practice/queries";
import { AnswerSheet, type QuestaoDaProva } from "@/features/practice/components/answer-sheet";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";

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
    <div className="mx-auto max-w-5xl">
      <PageHeader
        migalhas={[
          { rotulo: "Provas antigas", href: "/provas" },
          {
            rotulo: `${prova.instituicao ?? "Prova"} ${prova.ano ?? ""}`.trim(),
            href: `/provas/${documentId}`,
          },
          { rotulo: "Resolvendo" },
        ]}
        titulo={
          <>
            {prova.instituicao} {prova.ano}
            {prova.fase ? <span className="text-text-muted"> · {prova.fase}</span> : null}
          </>
        }
        acoes={
          <Link href={`/provas/${documentId}`} className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft data-icon="inline-start" aria-hidden />
            Sair — as respostas ficam salvas
          </Link>
        }
      />

      <AnswerSheet
        attemptId={attemptId}
        documentId={documentId}
        questoes={questoes}
        respostasIniciais={respostasIniciais}
      />
    </div>
  );
}
