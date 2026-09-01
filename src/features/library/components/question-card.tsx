"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Check, Eye, EyeOff } from "lucide-react";

type Alternativa = { letra: string; texto: string; correta: boolean | null };

export type QuestaoResumo = {
  id: string;
  enunciado: string | null;
  numero: number | null;
  ano: number | null;
  instituicaoSlug: string | null;
  disciplinaSugerida: string | null;
  gabaritoLetra: string | null;
  alternativas: Alternativa[];
};

/**
 * Uma questão do acervo.
 *
 * O gabarito começa escondido de propósito: a tela serve para estudar, e
 * mostrar a resposta junto do enunciado transforma banco de questões em
 * gabarito comentado. Quem quiser conferir clica.
 */
export function QuestionCard({ questao }: { questao: QuestaoResumo }) {
  const [revelado, setRevelado] = useState(false);
  const [escolhida, setEscolhida] = useState<string | null>(null);

  const gabarito = questao.gabaritoLetra?.toUpperCase() ?? null;

  return (
    <article className="rounded-lg border border-border bg-card p-5">
      <header className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        {questao.instituicaoSlug && (
          <Badge variant="secondary">{questao.instituicaoSlug.toUpperCase()}</Badge>
        )}
        {questao.ano && <Badge variant="outline">{questao.ano}</Badge>}
        {questao.numero && (
          <span className="text-muted-foreground">Questão {questao.numero}</span>
        )}
        {questao.disciplinaSugerida && (
          <span
            className="ml-auto text-muted-foreground"
            title="Disciplina sugerida automaticamente, ainda não revisada"
          >
            {questao.disciplinaSugerida} <span aria-hidden>·</span> sugerida
          </span>
        )}
      </header>

      {questao.enunciado && (
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
          {questao.enunciado}
        </p>
      )}

      <ol className="mt-4 space-y-1.5">
        {questao.alternativas.map((alt) => {
          const letra = alt.letra.toUpperCase();
          const ehCorreta = revelado && gabarito === letra;
          const errouAqui = revelado && escolhida === letra && gabarito !== letra;

          return (
            <li key={letra}>
              <button
                type="button"
                onClick={() => setEscolhida(letra)}
                aria-pressed={escolhida === letra}
                className={[
                  "flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                  ehCorreta
                    ? "border-primary bg-primary/10 text-foreground"
                    : errouAqui
                      ? "border-destructive/50 bg-destructive/5 text-foreground"
                      : escolhida === letra
                        ? "border-primary/60 bg-muted"
                        : "border-border hover:bg-muted/60",
                ].join(" ")}
              >
                <span className="font-semibold text-muted-foreground">{letra})</span>
                <span className="flex-1">{alt.texto}</span>
                {ehCorreta && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
              </button>
            </li>
          );
        })}
      </ol>

      <footer className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setRevelado((v) => !v)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {revelado ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          {revelado ? "Esconder gabarito" : "Ver gabarito"}
        </button>

        {revelado && gabarito && (
          <span className="text-sm text-muted-foreground">
            Resposta: <strong className="text-foreground">{gabarito}</strong>
            {escolhida && (
              <> · você marcou <strong className="text-foreground">{escolhida}</strong></>
            )}
          </span>
        )}
      </footer>
    </article>
  );
}
