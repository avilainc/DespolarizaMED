"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Check,
  Eye,
  EyeOff,
  Lightbulb,
  Loader2,
  Maximize2,
  Star,
  X,
} from "lucide-react";
import { Tag } from "@/components/ui/chip";
import { visualDaMateria } from "@/lib/materias";
import { alternarFavorito, responderQuestao, revelarGabarito } from "@/features/practice/actions";

type Alternativa = { letra: string; texto: string };

export type QuestaoResumo = {
  id: string;
  enunciado: string | null;
  numero: number | null;
  ano: number | null;
  instituicaoSlug: string | null;
  disciplinaSugerida: string | null;
  alternativas: Alternativa[];
  /** Última resposta do aluno a esta questão, se já respondeu. */
  respostaAnterior?: { letra: string; correta: boolean } | null;
  favorita?: boolean;
};

/**
 * Uma questão do acervo.
 *
 * O gabarito não vem nas props: a tela só o recebe do servidor, ou ao
 * responder (que registra em `practice_answers`) ou ao pedir "ver gabarito".
 * Assim o HTML/RSC da listagem nunca carrega a resposta certa. Essa regra é
 * anterior ao redesenho e continua valendo — nada aqui a afrouxa.
 *
 * O que mudou foi a leitura. Uma página de vinte questões era uma parede de
 * blocos idênticos: cabeçalho, enunciado e alternativas com o mesmo peso
 * tipográfico, sem nenhuma âncora visual. Agora cada questão tem um cabeçalho
 * identificável (banca, ano, matéria), o enunciado ganha medida e entrelinha
 * de leitura, e o resultado depois de responder é explícito — verde ou
 * vermelho suaves, com ÍCONE, porque cor sozinha não informa quem não a
 * distingue.
 */
export function QuestionCard({
  questao,
  mostrarLinkDetalhe = true,
  ordem,
}: {
  questao: QuestaoResumo;
  mostrarLinkDetalhe?: boolean;
  /** Posição na página, mostrada no rodapé quando a questão não tem número. */
  ordem?: number;
}) {
  const [gabarito, setGabarito] = useState<string | null>(null);
  const [revelado, setRevelado] = useState(false);
  const [escolhida, setEscolhida] = useState<string | null>(null);
  const [favorita, setFavorita] = useState(questao.favorita ?? false);
  const [erro, setErro] = useState<string | null>(null);
  const [respondendo, startResposta] = useTransition();
  const [revelando, startRevelar] = useTransition();
  const [favoritando, startFavorito] = useTransition();

  const anterior = questao.respostaAnterior ?? null;
  const visual = visualDaMateria(questao.disciplinaSugerida);
  const acertou = revelado && escolhida !== null && escolhida === gabarito;
  const errou = revelado && escolhida !== null && escolhida !== gabarito;

  function responder(letra: string) {
    if (revelado || respondendo) return;
    setEscolhida(letra);
    setErro(null);
    startResposta(async () => {
      const r = await responderQuestao({ questionId: questao.id, letra });
      if (r.ok) {
        setGabarito(r.dados.gabarito);
        setRevelado(true);
      } else setErro(r.erro);
    });
  }

  function alternarGabarito() {
    if (revelado) {
      setRevelado(false);
      return;
    }
    if (gabarito) {
      setRevelado(true);
      return;
    }
    setErro(null);
    startRevelar(async () => {
      const r = await revelarGabarito(questao.id);
      if (r.ok) {
        setGabarito(r.dados.gabarito);
        setRevelado(true);
      } else setErro(r.erro);
    });
  }

  function favoritar() {
    startFavorito(async () => {
      const r = await alternarFavorito({ tipo: "QUESTION", id: questao.id });
      if (r.ok) setFavorita(r.dados.favorito);
    });
  }

  return (
    <article
      className="overflow-hidden cartao"
      data-testid="question-card"
      data-question-id={questao.id}
    >
      <header className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-subtle/60 px-4 py-3 sm:px-5">
        {questao.instituicaoSlug && (
          <Tag tom="marca">{questao.instituicaoSlug.toUpperCase()}</Tag>
        )}
        {questao.ano && <Tag tom="neutro">{questao.ano}</Tag>}
        {questao.disciplinaSugerida && (
          <Tag
            tom="materia"
            cor={visual.cor}
            icone={visual.icone}
            className="cursor-help"
          >
            <span title="Disciplina sugerida automaticamente, ainda não revisada">
              {questao.disciplinaSugerida}
            </span>
          </Tag>
        )}
        {anterior && !revelado && (
          <Tag tom={anterior.correta ? "positivo" : "negativo"}>
            {anterior.correta ? "você acertou antes" : "você errou antes"}
          </Tag>
        )}

        <div className="ml-auto flex items-center gap-1">
          {(questao.numero ?? ordem) && (
            <span className="t-meta tabular mr-1 hidden sm:inline">
              Questão {questao.numero ?? ordem}
            </span>
          )}
          <button
            type="button"
            onClick={favoritar}
            disabled={favoritando}
            aria-pressed={favorita}
            aria-label={favorita ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            title={favorita ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            data-testid="favoritar"
            className="inline-flex size-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface hover:text-warning-text disabled:opacity-50"
          >
            <Star
              className={`size-[1.125rem] ${favorita ? "fill-warning text-warning" : ""}`}
              aria-hidden
            />
          </button>
          {mostrarLinkDetalhe && (
            <Link
              href={`/questoes/${questao.id}`}
              aria-label="Abrir questão em página própria"
              title="Abrir em página própria"
              className="inline-flex size-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
            >
              <Maximize2 className="size-4" aria-hidden />
            </Link>
          )}
        </div>
      </header>

      <div className="px-4 py-5 sm:px-5">
        {questao.enunciado && (
          <p className="t-leitura whitespace-pre-line text-text-primary">{questao.enunciado}</p>
        )}

        <ol className="mt-5 space-y-2">
          {questao.alternativas.map((alt) => {
            const letra = alt.letra.toUpperCase();
            const ehCorreta = revelado && gabarito === letra;
            const errouAqui = revelado && escolhida === letra && gabarito !== letra;
            const marcada = escolhida === letra;

            return (
              <li key={letra}>
                <button
                  type="button"
                  onClick={() => responder(letra)}
                  disabled={revelado || respondendo}
                  aria-pressed={marcada}
                  data-testid={`alternativa-${letra}`}
                  className={[
                    "flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-[0.9375rem] leading-relaxed transition-colors disabled:cursor-default",
                    ehCorreta
                      ? "border-success/45 bg-success-soft"
                      : errouAqui
                        ? "border-danger/40 bg-danger-soft"
                        : marcada
                          ? "border-brand-400 bg-brand-50"
                          : "border-border hover:border-brand-300 hover:bg-surface-subtle/70",
                  ].join(" ")}
                >
                  <span
                    aria-hidden
                    className={[
                      "mt-px inline-flex size-6 shrink-0 items-center justify-center rounded-md text-[0.8125rem] font-semibold",
                      ehCorreta
                        ? "bg-success text-white"
                        : errouAqui
                          ? "bg-danger text-white"
                          : marcada
                            ? "bg-acao text-white"
                            : "bg-surface-subtle text-text-secondary",
                    ].join(" ")}
                  >
                    {letra}
                  </span>
                  <span className="flex-1 [overflow-wrap:anywhere]">{alt.texto}</span>
                  {respondendo && marcada && (
                    <Loader2
                      className="mt-0.5 size-4 shrink-0 animate-spin text-text-muted"
                      aria-hidden
                    />
                  )}
                  {ehCorreta && (
                    <Check className="mt-0.5 size-4 shrink-0 text-success-text" aria-hidden />
                  )}
                  {errouAqui && (
                    <X className="mt-0.5 size-4 shrink-0 text-danger-text" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ol>

        {erro && (
          <p role="alert" className="mt-4 text-[0.875rem] text-danger-text">
            {erro}
          </p>
        )}

        {/* Bloco de resultado, separado das alternativas: depois de responder, o
            que o aluno procura é "acertei?" e "qual era a certa?", nessa ordem. */}
        {revelado && gabarito && (
          <div
            data-testid="resultado"
            className={[
              "mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg px-4 py-3 text-[0.875rem]",
              acertou
                ? "bg-success-soft text-success-text"
                : errou
                  ? "bg-danger-soft text-danger-text"
                  : "bg-brand-50 text-brand-800",
            ].join(" ")}
          >
            {acertou ? (
              <Check className="size-4 shrink-0" aria-hidden />
            ) : errou ? (
              <X className="size-4 shrink-0" aria-hidden />
            ) : (
              <Lightbulb className="size-4 shrink-0" aria-hidden />
            )}
            <strong className="font-semibold">
              {acertou ? "Você acertou." : errou ? "Você errou." : "Gabarito revelado."}
            </strong>
            <span>
              Resposta correta: <strong className="font-semibold">{gabarito}</strong>
              {escolhida && escolhida !== gabarito && <> · você marcou {escolhida}</>}
            </span>
          </div>
        )}
      </div>

      <footer className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={alternarGabarito}
          disabled={revelando}
          data-testid="ver-gabarito"
          className="inline-flex min-h-8 items-center gap-1.5 rounded-lg text-[0.8125rem] font-medium text-text-secondary transition-colors hover:text-text-primary disabled:opacity-50"
        >
          {revelando ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : revelado ? (
            <EyeOff className="size-4" aria-hidden />
          ) : (
            <Eye className="size-4" aria-hidden />
          )}
          {revelado ? "Esconder gabarito" : "Ver gabarito"}
        </button>

        {(questao.numero ?? ordem) && (
          <span className="t-meta tabular ml-auto sm:hidden">
            Questão {questao.numero ?? ordem}
          </span>
        )}
      </footer>
    </article>
  );
}
