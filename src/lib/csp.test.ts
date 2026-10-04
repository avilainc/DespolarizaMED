import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  FiltroDeRelatorios,
  HEADER_CSP,
  POLITICA,
  headersDeCsp,
  lerCorpoLimitado,
  lerRelatoriosCsp,
  serializarPolitica,
} from "./csp";

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

describe("CSP: leitura do corpo com teto", () => {
  const stream = (pedacos: string[]) =>
    new ReadableStream<Uint8Array>({
      start(c) {
        for (const p of pedacos) c.enqueue(new TextEncoder().encode(p));
        c.close();
      },
    });

  it("devolve o corpo quando cabe", async () => {
    assert.equal(await lerCorpoLimitado(stream(['{"a":', "1}"]), 100), '{"a":1}');
  });

  it("para no primeiro pedaço que estoura, sem ler o resto", async () => {
    let puxados = 0;
    const infinito = new ReadableStream<Uint8Array>({
      pull(c) {
        puxados++;
        c.enqueue(new Uint8Array(1024));
      },
    });
    assert.equal(await lerCorpoLimitado(infinito, 4096), null);
    // highWaterMark padrão do stream é 1, então puxa no máximo um à frente.
    assert.ok(puxados <= 7, `leu ${puxados} pedaços de um stream sem fim`);
  });

  it("corpo ausente vira texto vazio", async () => {
    assert.equal(await lerCorpoLimitado(null, 10), "");
  });
});

describe("CSP: volume de log entre requisições", () => {
  const r = (n: number) => ({ diretiva: "img-src", bloqueado: `https://x.com/${n}`, pagina: "/" });

  it("a mesma violação repetida vira uma linha só na janela", () => {
    const f = new FiltroDeRelatorios(60_000, 30, () => 1_000);
    const linhas = Array.from({ length: 500 }, () => f.registrar(r(1))).flat();
    assert.equal(linhas.length, 1);
  });

  it("violações distintas param no orçamento, e o excesso aparece resumido depois", () => {
    let t = 1_000;
    const f = new FiltroDeRelatorios(60_000, 3, () => t);
    const naJanela = Array.from({ length: 10 }, (_, i) => f.registrar(r(i))).flat();
    assert.equal(naJanela.length, 3);

    t += 60_000;
    const proxima = f.registrar(r(99));
    assert.deepEqual(proxima[0], { evento: "csp-violation-descartadas", quantidade: 7 });
    assert.equal(proxima[1].evento, "csp-violation");
  });

  it("a janela nova esquece o que viu, então um problema persistente reaparece", () => {
    let t = 1_000;
    const f = new FiltroDeRelatorios(60_000, 30, () => t);
    assert.equal(f.registrar(r(1)).length, 1);
    t += 60_000;
    assert.equal(f.registrar(r(1)).length, 1);
  });
});
