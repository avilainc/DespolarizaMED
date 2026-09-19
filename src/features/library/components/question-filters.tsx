"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, SelectField, TextField } from "@/components/ui/field";

export type Faceta = { valor: string; rotulo: string; total?: number };

export type ValoresFiltro = {
  q?: string;
  banca?: string;
  ano?: string;
  tema?: string;
  situacao?: string;
  /** Mantido escondido no formulário para não perder o recorte de disciplina. */
  disciplina?: string;
};

/**
 * Barra de filtros do banco de questões.
 *
 * Continua sendo um `<form method="get">`: o recorte fica na URL, dá para
 * compartilhar "FUVEST 2024 de genética" e voltar pelo histórico. O que mudou
 * é o arranjo.
 *
 * No desktop a barra é `sticky` logo abaixo do cabeçalho — numa página de
 * vinte questões, ter que subir até o topo para trocar de banca era o motivo
 * de a tela parecer uma lista infinita sem controle.
 *
 * No celular ela vira: campo de busca sempre visível + botão "Filtros" que
 * abre uma folha por baixo. Os mesmos campos, o MESMO formulário (um nó de
 * DOM só, com duas apresentações) — duplicar a marcação faria o navegador
 * enviar o campo duas vezes.
 */
export function QuestionFilters({
  valores,
  bancas,
  anos,
  temas,
  situacoes,
  total,
}: {
  valores: ValoresFiltro;
  bancas: Faceta[];
  anos: Faceta[];
  temas: Faceta[];
  situacoes: { valor: string; rotulo: string }[];
  total: number;
}) {
  const [aberto, setAberto] = useState(false);

  const ativos = [valores.banca, valores.ano, valores.tema, valores.situacao].filter(
    Boolean,
  ).length;

  return (
    <form
      role="search"
      className="sticky top-[var(--shell-header)] z-20 -mx-4 mb-6 border-b border-border bg-background/92 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
    >
      {/* disciplina vem dos chips, não de um <select>: sem este hidden, filtrar
          por banca zeraria a disciplina escolhida. */}
      {valores.disciplina && <input type="hidden" name="disciplina" value={valores.disciplina} />}

      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
          />
          <TextField
            name="q"
            type="search"
            defaultValue={valores.q ?? ""}
            placeholder="Buscar no enunciado: ciclo de Krebs, mitose…"
            aria-label="Buscar no enunciado"
            className="pl-9"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          aria-controls="painel-filtros"
          className="shrink-0 md:hidden"
        >
          <SlidersHorizontal data-icon="inline-start" aria-hidden />
          Filtros
          {ativos > 0 && (
            <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-brand-600 text-[0.6875rem] font-semibold text-white">
              {ativos}
            </span>
          )}
        </Button>

        <Button type="submit" className="hidden shrink-0 md:inline-flex">
          Filtrar
        </Button>
      </div>

      <div
        id="painel-filtros"
        className={
          aberto
            ? "fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-border bg-surface p-5 shadow-lg md:static md:mt-3 md:max-h-none md:overflow-visible md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none"
            : "hidden md:mt-3 md:block"
        }
      >
        {aberto && (
          <div className="mb-4 flex items-center justify-between md:hidden">
            <p className="t-section text-text-primary">Filtros</p>
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar filtros"
              className="inline-flex size-10 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-subtle"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <Field rotulo="Vestibular">
            {({ id }) => (
              <SelectField id={id} name="banca" defaultValue={valores.banca ?? ""}>
                <option value="">Todas as bancas</option>
                {bancas.map((b) => (
                  <option key={b.valor} value={b.valor}>
                    {b.rotulo}
                    {b.total !== undefined ? ` (${b.total})` : ""}
                  </option>
                ))}
              </SelectField>
            )}
          </Field>

          <Field rotulo="Ano">
            {({ id }) => (
              <SelectField id={id} name="ano" defaultValue={valores.ano ?? ""}>
                <option value="">Todos os anos</option>
                {anos.map((a) => (
                  <option key={a.valor} value={a.valor}>
                    {a.rotulo}
                    {a.total !== undefined ? ` (${a.total})` : ""}
                  </option>
                ))}
              </SelectField>
            )}
          </Field>

          <Field rotulo="Situação">
            {({ id }) => (
              <SelectField id={id} name="situacao" defaultValue={valores.situacao ?? ""}>
                {situacoes.map((s) => (
                  <option key={s.valor} value={s.valor}>
                    {s.rotulo}
                  </option>
                ))}
              </SelectField>
            )}
          </Field>

          {/* O seletor de tema só existe quando há uma disciplina escolhida:
              a lista de temas do acervo inteiro tem centenas de entradas e não
              ajuda ninguém. */}
          {valores.disciplina && temas.length > 0 ? (
            <Field rotulo={`Tema de ${valores.disciplina}`}>
              {({ id }) => (
                <SelectField id={id} name="tema" defaultValue={valores.tema ?? ""}>
                  <option value="">Todos os temas</option>
                  {temas.map((t) => (
                    <option key={t.valor} value={t.valor}>
                      {t.rotulo}
                      {t.total !== undefined ? ` (${t.total})` : ""}
                    </option>
                  ))}
                </SelectField>
              )}
            </Field>
          ) : (
            <p className="hidden self-end pb-2.5 text-[0.8125rem] text-text-muted md:block">
              {total.toLocaleString("pt-BR")} {total === 1 ? "questão" : "questões"} neste recorte
            </p>
          )}
        </div>

        <div className={aberto ? "mt-5 flex gap-2 md:hidden" : "hidden"}>
          <Button type="submit" size="lg" className="flex-1">
            Ver {total.toLocaleString("pt-BR")} {total === 1 ? "questão" : "questões"}
          </Button>
        </div>
      </div>

      {/* Fundo escuro da folha de filtros no celular. */}
      {aberto && (
        <button
          type="button"
          aria-label="Fechar filtros"
          onClick={() => setAberto(false)}
          className="fixed inset-0 z-40 bg-brand-950/40 md:hidden"
        />
      )}
    </form>
  );
}
