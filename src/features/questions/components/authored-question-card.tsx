"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import "katex/dist/katex.min.css";
import { revelarQuestaoAutoral } from "../actions";

/**
 * Questão autoral para o aluno. O enunciado e as alternativas chegam com o
 * KaTeX já renderizado no servidor; gabarito e resolução só vêm quando o
 * aluno pede, por server action — nunca no HTML da listagem.
 */
export function AuthoredQuestionCard({
  questao,
}: {
  questao: {
    id: string;
    disciplina: string | null;
    topic: string;
    subtopic: string | null;
    difficulty: "FACIL" | "MEDIA" | "DIFICIL";
    vestibular: string | null;
    year: number | null;
    type: "MULTIPLA_ESCOLHA" | "DISSERTATIVA";
    statementHtml: string;
    alternativas: { label: string; contentHtml: string }[];
  };
}) {
  const [revelado, setRevelado] = useState(false);
  const [gabarito, setGabarito] = useState<string | null>(null);
  const [explicacaoHtml, setExplicacaoHtml] = useState<string | null>(null);
  const [carregado, setCarregado] = useState(false);
  const [escolhida, setEscolhida] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  const dificuldade = { FACIL: "fácil", MEDIA: "média", DIFICIL: "difícil" }[questao.difficulty];

  function alternar() {
    if (revelado) return setRevelado(false);
    if (carregado) return setRevelado(true);
    setErro(null);
    startTransition(async () => {
      const r = await revelarQuestaoAutoral(questao.id);
      if (r.ok) {
        setGabarito(r.dados.gabarito);
        setExplicacaoHtml(r.dados.explicacaoHtml);
        setCarregado(true);
        setRevelado(true);
      } else setErro(r.erro);
    });
  }

  return (
    <article className="rounded-lg border border-border bg-card p-5" data-testid="authored-card">
      <header className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        {questao.vestibular && <Badge variant="secondary">{questao.vestibular}</Badge>}
        {questao.year && <Badge variant="outline">{questao.year}</Badge>}
        <Badge variant="outline">{dificuldade}</Badge>
        <span className="ml-auto text-muted-foreground">
          {questao.disciplina} · {questao.topic}
          {questao.subtopic ? ` · ${questao.subtopic}` : ""}
        </span>
      </header>

      <div
        className="prose prose-sm max-w-none text-sm leading-relaxed text-foreground [&_p]:my-1.5"
        dangerouslySetInnerHTML={{ __html: questao.statementHtml }}
      />

      {questao.type === "MULTIPLA_ESCOLHA" && (
        <ol className="mt-4 space-y-1.5">
          {questao.alternativas.map((alt) => {
            const ehCorreta = revelado && gabarito === alt.label;
            const errouAqui = revelado && escolhida === alt.label && gabarito !== alt.label;
            return (
              <li key={alt.label}>
                <button
                  type="button"
                  onClick={() => !revelado && setEscolhida(alt.label)}
                  aria-pressed={escolhida === alt.label}
                  data-testid={`alternativa-${alt.label}`}
                  className={[
                    "flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                    ehCorreta
                      ? "border-primary bg-primary/10"
                      : errouAqui
                        ? "border-destructive/50 bg-destructive/5"
                        : escolhida === alt.label
                          ? "border-primary/60 bg-muted"
                          : "border-border hover:bg-muted/60",
                  ].join(" ")}
                >
                  <span className="font-semibold text-muted-foreground">{alt.label})</span>
                  <span className="flex-1 [&_p]:my-0" dangerouslySetInnerHTML={{ __html: alt.contentHtml }} />
                  {ehCorreta && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {erro && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {erro}
        </p>
      )}

      <footer className="mt-4 space-y-3">
        <button
          type="button"
          onClick={alternar}
          disabled={pendente}
          data-testid="ver-gabarito"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          {pendente ? <Loader2 className="size-4 animate-spin" /> : revelado ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          {revelado ? "Esconder resolução" : questao.type === "DISSERTATIVA" ? "Ver resolução" : "Ver gabarito"}
        </button>
        {revelado && gabarito && (
          <p className="text-sm text-muted-foreground" data-testid="resultado">
            Resposta: <strong className="text-foreground">{gabarito}</strong>
            {escolhida && (
              <>
                {" "}
                · você marcou <strong className="text-foreground">{escolhida}</strong>
                {escolhida === gabarito ? " — acertou" : " — errou"}
              </>
            )}
          </p>
        )}
        {revelado && explicacaoHtml && (
          <div
            className="prose prose-sm max-w-none rounded-md bg-muted/40 p-4 text-sm text-foreground [&_p]:my-1.5"
            dangerouslySetInnerHTML={{ __html: explicacaoHtml }}
          />
        )}
      </footer>
    </article>
  );
}
