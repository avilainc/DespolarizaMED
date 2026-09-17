import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

/**
 * Guarda contra "autentica depois de ler o banco" nas server actions.
 *
 * Toda action exportada é um endpoint HTTP: o Next registra uma referência de
 * servidor para ela, e qualquer um pode fazer POST com o `Next-Action` dela
 * sem cookie nenhum. O portão não é a tela que renderiza o botão — é a
 * primeira linha da própria action.
 *
 * O bug que originou este teste: em `library/actions.ts` o guard de ADMIN
 * morava dentro do helper `aplicar()`, e `aprovarQuestao`/`corrigirGabarito`
 * consultavam o acervo *antes* de chegar nele. A mutação seguia barrada, mas
 * o anônimo já fazia o servidor ler o banco e ainda distinguia
 * "questão não encontrada" de "defina o gabarito antes de aprovar" e de
 * "a questão não tem alternativa X" — um oráculo sobre o acervo, de graça.
 *
 * Ler o código não pega isso: cada action parecia certa, e `aplicar()` também.
 * O que estava errado era só a ORDEM entre elas, que só aparece quando se
 * segue a chamada. Por isso a varredura resolve as chamadas locais em vez de
 * olhar uma função de cada vez.
 *
 * Premissa, explícita: um helper que chama guard é tratado como se guardasse
 * logo de início. Vale para os helpers de hoje (`revisor()`); um helper que
 * guardasse no meio passaria batido aqui e precisa de revisão humana.
 */

const GUARDAS = new Set([
  "requireSessionWithRole",
  "requireAssinatura",
  "requireAssinaturaApi",
  "requireRole",
]);

/** Identificadores que significam "encostou no banco". */
const BANCO = new Set(["db", "tx"]);

type Funcao = {
  nome: string;
  exportada: boolean;
  no: ts.FunctionDeclaration;
  guardaDireta: boolean;
  bancoDireto: boolean;
  chamadas: Set<string>;
};

function lerArquivosDeActions(): { caminho: string; nome: string; fonte: string }[] {
  const features = join(import.meta.dirname, "..", "..", "features");
  const achados: { caminho: string; nome: string; fonte: string }[] = [];
  for (const dir of readdirSync(features, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const caminho = join(features, dir.name, "actions.ts");
    try {
      achados.push({ caminho, nome: `${dir.name}/actions.ts`, fonte: readFileSync(caminho, "utf8") });
    } catch {
      // Nem toda feature tem actions.ts; só as que têm entram na varredura.
    }
  }
  return achados.sort((a, b) => a.nome.localeCompare(b.nome));
}

function mapearFuncoes(fonte: string, nomeArquivo: string): Map<string, Funcao> {
  const sf = ts.createSourceFile(nomeArquivo, fonte, ts.ScriptTarget.ESNext, true);
  const tabela = new Map<string, Funcao>();

  for (const stmt of sf.statements) {
    if (!ts.isFunctionDeclaration(stmt) || !stmt.name) continue;
    const f: Funcao = {
      nome: stmt.name.text,
      exportada: !!stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword),
      no: stmt,
      guardaDireta: false,
      bancoDireto: false,
      chamadas: new Set(),
    };

    // O nó inteiro, não só o corpo: `snapshot(id, executor = db)` encosta no
    // banco pelo valor padrão do parâmetro.
    const anotar = (no: ts.Node) => {
      if (ts.isCallExpression(no) && ts.isIdentifier(no.expression)) {
        const chamada = no.expression.text;
        if (GUARDAS.has(chamada)) f.guardaDireta = true;
        else f.chamadas.add(chamada);
      }
      if (ts.isIdentifier(no) && BANCO.has(no.text)) f.bancoDireto = true;
      ts.forEachChild(no, anotar);
    };
    ts.forEachChild(stmt, anotar);

    tabela.set(f.nome, f);
  }
  return tabela;
}

/** Ponto fixo: propaga "guarda" e "encosta no banco" pelas chamadas locais. */
function resolverTransitivo(tabela: Map<string, Funcao>) {
  const guarda = new Map<string, boolean>();
  const banco = new Map<string, boolean>();
  for (const f of tabela.values()) {
    guarda.set(f.nome, f.guardaDireta);
    banco.set(f.nome, f.bancoDireto);
  }

  let mudou = true;
  while (mudou) {
    mudou = false;
    for (const f of tabela.values()) {
      for (const chamada of f.chamadas) {
        if (!tabela.has(chamada)) continue;
        if (guarda.get(chamada) && !guarda.get(f.nome)) {
          guarda.set(f.nome, true);
          mudou = true;
        }
        if (banco.get(chamada) && !banco.get(f.nome)) {
          banco.set(f.nome, true);
          mudou = true;
        }
      }
    }
  }
  return { guarda, banco };
}

/**
 * Percorre o corpo em ordem de código e devolve a primeira coisa que encosta
 * no banco antes de a guarda ter passado. `null` = a action está em ordem.
 */
function primeiroAcessoAntesDaGuarda(
  f: Funcao,
  tabela: Map<string, Funcao>,
  guarda: Map<string, boolean>,
  banco: Map<string, boolean>,
): string | null {
  let guardaVista = false;
  let problema: string | null = null;

  const visitar = (no: ts.Node) => {
    if (problema) return;

    if (ts.isCallExpression(no) && ts.isIdentifier(no.expression)) {
      const chamada = no.expression.text;
      if (GUARDAS.has(chamada)) {
        guardaVista = true;
        return;
      }
      if (tabela.has(chamada)) {
        if (guarda.get(chamada)) {
          guardaVista = true;
          return;
        }
        if (banco.get(chamada) && !guardaVista) {
          problema = `chama ${chamada}(), que lê o banco, antes de autenticar`;
          return;
        }
      }
    }

    if (ts.isIdentifier(no) && BANCO.has(no.text) && !guardaVista) {
      problema = `usa \`${no.text}\` antes de autenticar`;
      return;
    }

    ts.forEachChild(no, visitar);
  };

  if (f.no.body) ts.forEachChild(f.no.body, visitar);
  return problema;
}

describe("server actions: autenticar antes de tocar no banco", () => {
  const arquivos = lerArquivosDeActions();

  it("encontra os arquivos de actions (a varredura não é vazia)", () => {
    assert.ok(arquivos.length >= 5, `esperava as actions das features, achei ${arquivos.length} arquivos`);
  });

  it("toda action exportada passa pela guarda antes de ler o banco", () => {
    const violacoes: string[] = [];
    let exportadas = 0;

    for (const arquivo of arquivos) {
      const tabela = mapearFuncoes(arquivo.fonte, arquivo.nome);
      const { guarda, banco } = resolverTransitivo(tabela);

      for (const f of tabela.values()) {
        if (!f.exportada) continue;
        exportadas++;
        const problema = primeiroAcessoAntesDaGuarda(f, tabela, guarda, banco);
        if (problema) violacoes.push(`${arquivo.nome} → ${f.nome}(): ${problema}`);
      }
    }

    assert.ok(exportadas > 0, "nenhuma action exportada encontrada — a varredura quebrou");
    assert.deepEqual(
      violacoes,
      [],
      `actions que leem o banco antes de autenticar:\n  ${violacoes.join("\n  ")}`,
    );
  });

  it("toda action exportada tem alguma guarda no caminho", () => {
    const semGuarda: string[] = [];

    for (const arquivo of arquivos) {
      const tabela = mapearFuncoes(arquivo.fonte, arquivo.nome);
      const { guarda } = resolverTransitivo(tabela);
      for (const f of tabela.values()) {
        if (f.exportada && !guarda.get(f.nome)) semGuarda.push(`${arquivo.nome} → ${f.nome}()`);
      }
    }

    assert.deepEqual(
      semGuarda,
      [],
      `actions exportadas sem nenhuma guarda de sessão:\n  ${semGuarda.join("\n  ")}`,
    );
  });
});
