import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderizarMath, textoSemHtml } from "./math-html";

const inline = (latex: string, display = "no") =>
  `<span data-type="inlineMath" data-latex="${latex}" data-evaluate="no" data-display="${display}"></span>`;

describe("renderizarMath", () => {
  it("troca o nó do editor por markup do KaTeX", () => {
    const html = renderizarMath(`<p>Energia: ${inline("E = mc^2")}</p>`);
    assert.match(html, /class="katex"/);
    assert.match(html, /mathnormal[^>]*>E</);
    assert.match(html, /mrel">=</);
    assert.doesNotMatch(html, /data-type="inlineMath"/);
    assert.doesNotMatch(html, /katex-error/);
  });

  it("desescapa entidades do atributo (&amp;, &quot;) antes de renderizar", () => {
    const html = renderizarMath(`<p>${inline("\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}")}</p>`);
    assert.match(html, /class="mfrac"/);
    assert.match(html, /class="mord sqrt/);
    assert.match(html, /mbin[^>]*>±</);
    assert.doesNotMatch(html, /katex-error/);
  });

  it("display=yes vira bloco (katex-display)", () => {
    const html = renderizarMath(inline("\\sum_i i", "yes"));
    assert.match(html, /katex-display/);
  });

  it("LaTeX inválido não derruba a página (throwOnError=false)", () => {
    const html = renderizarMath(inline("\\frac{"));
    assert.match(html, /katex-error|class="katex"/);
  });

  it("não toca em HTML sem fórmula", () => {
    const entrada = "<p>Sem <strong>fórmula</strong></p>";
    assert.equal(renderizarMath(entrada), entrada);
  });
});

describe("textoSemHtml", () => {
  it("remove tags e mantém o LaTeX cru no lugar da fórmula", () => {
    const t = textoSemHtml(`<p>Calcule ${inline("x^2")} para <em>x</em> = 2</p>`);
    assert.equal(t, "Calcule x^2 para x = 2");
  });
  it("string só com tags vazias vira vazio", () => {
    assert.equal(textoSemHtml("<p></p>"), "");
  });
});
