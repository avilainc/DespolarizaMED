"use client";

import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type FacetaValor = { valor: string; rotulo: string; total: number };

export type ValoresFiltro = {
  q?: string;
  banca?: string;
  ano?: string;
  disciplina?: string;
  tema?: string;
  situacao?: string;
};

const SITUACOES = [
  { valor: "", rotulo: "Todas as questões" },
  { valor: "nao-respondidas", rotulo: "Não respondidas" },
  { valor: "respondidas", rotulo: "Já respondidas" },
  { valor: "erradas", rotulo: "Que errei" },
  { valor: "favoritas", rotulo: "Favoritas" },
];

/**
 * Barra de filtros do banco de questões.
 *
 * Um formulário só, com os mesmos campos nos dois tamanhos de tela: no
 * desktop ele fica numa barra grudada no topo; no celular os selects moram
 * numa gaveta que sobe de baixo, e só a busca fica sempre visível. Campos
 * duplicados (um jogo escondido para desktop, outro para mobile) seriam
 * submetidos junto e mandariam o valor errado, então a diferença é só de
 * contêiner e classe.
 *
 * O estado continua na URL, por GET: um recorte ("FUVEST 2024 de genética")
 * pode ser compartilhado e volta pelo histórico do navegador.
 */
export function QuestionFilters({
  valores,
  bancas,
  anos,
  temas,
  totalFiltros,
}: {
  valores: ValoresFiltro;
  bancas: FacetaValor[];
  anos: FacetaValor[];
  temas: FacetaValor[];
  /** Quantos filtros estão ativos agora, para o botão do celular dizer. */
  totalFiltros: number;
}) {
  const [gavetaAberta, setGavetaAberta] = useState(false);

  useEffect(() => {
    if (!gavetaAberta) return;
    const fechar = (e: KeyboardEvent) => e.key === "Escape" && setGavetaAberta(false);
    document.addEventListener("keydown", fechar);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", fechar);
      document.body.style.overflow = "";
    };
  }, [gavetaAberta]);

  const selects = (
    <>
      <Campo rotulo="Banca" nome="banca" valor={valores.banca} vazio="Todas as bancas" opcoes={bancas} />
      <Campo rotulo="Ano" nome="ano" valor={valores.ano} vazio="Todos os anos" opcoes={anos} />
      <Campo
        rotulo="Situação"
        nome="situacao"
        valor={valores.situacao}
        opcoes={SITUACOES.filter((s) => s.valor).map((s) => ({ valor: s.valor, rotulo: s.rotulo, total: 0 }))}
        vazio="Todas as questões"
      />
      {temas.length > 0 && (
        <Campo rotulo="Tema" nome="tema" valor={valores.tema} vazio="Todos os temas" opcoes={temas} />
      )}
    </>
  );

  return (
    <form
      role="search"
      className="sticky top-16 z-20 -mx-4 mb-6 border-b border-border bg-[var(--app-bg)]/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6"
    >
      {/* A disciplina vem das fichas abaixo da barra, não de um select; sem o
          hidden ela se perderia ao filtrar por banca. */}
      {valores.disciplina && <input type="hidden" name="disciplina" value={valores.disciplina} />}

      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            name="q"
            defaultValue={valores.q ?? ""}
            placeholder="Buscar no enunciado: ciclo de Krebs, mitose…"
            aria-label="Buscar no enunciado"
            className="pl-9"
          />
        </div>

        {/* Celular: um botão que abre a gaveta. Quatro selects lado a lado numa
            tela de 390px é o que produzia o estouro horizontal da auditoria. */}
        <Button
          type="button"
          variant="outline"
          onClick={() => setGavetaAberta(true)}
          aria-expanded={gavetaAberta}
          aria-controls="filtros-questoes"
          className="shrink-0 lg:hidden"
        >
          <SlidersHorizontal />
          Filtros
          {totalFiltros > 0 && (
            <span className="ml-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[0.6875rem] font-semibold text-primary-foreground">
              {totalFiltros}
            </span>
          )}
        </Button>

        <Button type="submit" className="shrink-0 max-lg:hidden">
          Filtrar
        </Button>
      </div>

      <div className="mt-3 hidden gap-3 lg:grid lg:grid-cols-4">{selects}</div>

      {gavetaAberta && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden">
          <button
            type="button"
            aria-label="Fechar filtros"
            onClick={() => setGavetaAberta(false)}
            className="absolute inset-0 bg-foreground/30"
          />
          <div
            id="filtros-questoes"
            role="dialog"
            aria-modal="true"
            aria-label="Filtros do banco de questões"
            className="relative max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-background p-5 shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-foreground">Filtros</h2>
              <button
                type="button"
                onClick={() => setGavetaAberta(false)}
                aria-label="Fechar filtros"
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="grid gap-4">{selects}</div>
            <Button type="submit" size="lg" className="mt-5 w-full">
              Ver resultados
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}

function Campo({
  rotulo,
  nome,
  valor,
  vazio,
  opcoes,
}: {
  rotulo: string;
  nome: string;
  valor?: string;
  vazio: string;
  opcoes: FacetaValor[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.8125rem] font-medium text-foreground">{rotulo}</span>
      <select
        name={nome}
        defaultValue={valor ?? ""}
        className={cn(
          "h-11 w-full rounded-lg border border-input bg-background px-3 text-[0.9375rem] text-foreground",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        )}
      >
        <option value="">{vazio}</option>
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
            {o.total > 0 ? ` (${o.total.toLocaleString("pt-BR")})` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
