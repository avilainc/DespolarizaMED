import katex from "katex";

/**
 * Converte o HTML salvo pelo editor (TipTap + math extension) para HTML final
 * com as fórmulas já renderizadas pelo KaTeX no servidor. O editor grava cada
 * fórmula como `<span data-type="inlineMath" data-latex="…" data-display="…">`;
 * aqui isso vira o markup do KaTeX, sem JavaScript no cliente.
 */
const NO_MATH = /<span\b[^>]*data-type="inlineMath"[^>]*>[\s\S]*?<\/span>/g;
const ATTR = (nome: string, tag: string) => {
  const m = tag.match(new RegExp(`${nome}="([^"]*)"`));
  return m ? m[1] : null;
};

function desescapar(s: string) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

export function renderizarMath(html: string) {
  return html.replace(NO_MATH, (tag) => {
    const latex = ATTR("data-latex", tag);
    if (latex === null) return tag;
    const display = ATTR("data-display", tag) === "yes";
    try {
      return katex.renderToString(desescapar(latex), {
        displayMode: display,
        throwOnError: false,
        output: "html",
      });
    } catch {
      return tag;
    }
  });
}

/** Versão em texto puro, para listas e buscas: fórmulas viram o LaTeX cru. */
export function textoSemHtml(html: string) {
  return desescapar(
    html
      .replace(NO_MATH, (tag) => ` ${ATTR("data-latex", tag) ?? ""} `)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}
