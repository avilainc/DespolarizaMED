import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { HEADER_CSP, POLITICA, headersDeCsp, lerRelatoriosCsp, serializarPolitica } from "./csp";

describe("CSP: a política", () => {
  const valor = serializarPolitica();

  it("está em modo relatório até alguém decidir o contrário", () => {
    // Trocar para o header que bloqueia é decisão de propósito, com o log de
    // violações limpo — não um efeito colateral de editar este arquivo.
    assert.equal(HEADER_CSP, "Content-Security-Policy-Report-Only");
    assert.equal(headersDeCsp[0].key, HEADER_CSP);
  });

  it("nunca libera eval", () => {
    assert.ok(!valor.includes("'unsafe-eval'"));
  });

  it("não deixa ninguém nos embutir nem carregar plugin", () => {
    assert.deepEqual(POLITICA["frame-ancestors"], ["'none'"]);
    assert.deepEqual(POLITICA["object-src"], ["'none'"]);
  });

  it("não tem curinga nem esquema aberto em nenhuma diretiva", () => {
    for (const [diretiva, fontes] of Object.entries(POLITICA)) {
      for (const f of fontes) {
        assert.ok(f !== "*" && f !== "https:" && f !== "http:", `${diretiva} aceita ${f}`);
      }
    }
  });

  it("aponta os relatórios para a rota que existe, só por report-uri", () => {
    assert.match(valor, /report-uri \/api\/csp-report/);
    // Com report-to presente, o Chromium ignora report-uri e entrega em lote
    // atrasado — ver o comentário em POLITICA.
    assert.ok(!("report-to" in POLITICA));
  });

  it("não manda diretiva que Report-Only ignora com aviso no console", () => {
    assert.ok(!("upgrade-insecure-requests" in POLITICA));
  });

  it("serializa diretiva sem fonte como palavra solta", () => {
    assert.equal(serializarPolitica({ a: ["x", "y"], b: [] }), "a x y; b");
  });
});

describe("CSP: leitura dos relatórios", () => {
  it("lê o formato antigo (report-uri) e tira a query string", () => {
    const [r] = lerRelatoriosCsp({
      "csp-report": {
        "document-uri": "https://despolarizamed.com.br/aulas/x?token=segredo#t",
        "effective-directive": "script-src-elem",
        "blocked-uri": "https://cdn.exemplo.com/a.js?k=1",
        "script-sample": "alert(document.cookie)",
      },
    });
    assert.deepEqual(r, {
      diretiva: "script-src-elem",
      bloqueado: "https://cdn.exemplo.com/a.js",
      pagina: "https://despolarizamed.com.br/aulas/x",
    });
  });

  it("lê o formato novo (report-to), que chega em lote", () => {
    const lidos = lerRelatoriosCsp([
      { type: "csp-violation", body: { documentURL: "https://d.com/", effectiveDirective: "img-src", blockedURL: "https://i.com/x.png" } },
      { type: "deprecation", body: { message: "outro tipo, ignorado" } },
    ]);
    assert.equal(lidos.length, 1);
    assert.equal(lidos[0].diretiva, "img-src");
  });

  it("mantém palavras como inline e eval", () => {
    const [r] = lerRelatoriosCsp({ "csp-report": { "blocked-uri": "inline", "violated-directive": "style-src" } });
    assert.equal(r.bloqueado, "inline");
    assert.equal(r.diretiva, "style-src");
  });

  it("ignora lixo sem quebrar", () => {
    for (const lixo of [null, 42, "x", {}, [], [null], { "csp-report": "x" }]) {
      assert.deepEqual(lerRelatoriosCsp(lixo), []);
    }
  });

  it("corta campos enormes", () => {
    const [r] = lerRelatoriosCsp({ "csp-report": { "blocked-uri": "https://a.com/" + "x".repeat(5000) } });
    assert.ok(r.bloqueado.length <= 256);
  });
});
