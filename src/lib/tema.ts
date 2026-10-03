/**
 * Tema da interface: escuro (padrão) ou claro.
 *
 * O escuro é o padrão porque é a identidade da versão do Paulo — azul-marinho
 * com as matérias em cor viva por cima. Quem prefere o claro troca uma vez e
 * fica salvo neste navegador.
 *
 * Por que `localStorage` e não cookie: o tema é preferência de aparelho, não
 * de conta, e cookie faria toda página depender de leitura de cabeçalho no
 * servidor — o que tira a landing do cache. O preço é o servidor não saber o
 * tema; quem resolve é o script abaixo, que roda no <head> antes da primeira
 * pintura. O HTML já sai com `class="dark"` (o padrão), e o script só tira a
 * classe de quem escolheu o claro — então ninguém vê o tema errado piscar.
 */
export const CHAVE_TEMA = "despolarizamed-tema";

export type Tema = "escuro" | "claro";

export const TEMA_PADRAO: Tema = "escuro";

/** Lê a escolha salva. Storage indisponível (aba anônima, bloqueio) cai no padrão. */
export function temaSalvo(): Tema {
  try {
    const valor = localStorage.getItem(CHAVE_TEMA);
    if (valor === "claro" || valor === "escuro") return valor;
  } catch {
    // storage indisponível: segue o padrão
  }
  return TEMA_PADRAO;
}

export function aplicarTema(tema: Tema) {
  document.documentElement.classList.toggle("dark", tema === "escuro");
  try {
    localStorage.setItem(CHAVE_TEMA, tema);
  } catch {
    // storage indisponível: vale só para esta visita
  }
}

/**
 * Injetado no <head> pelo layout raiz. Tem que ser string pura (não pode
 * importar nada) porque roda antes do React existir.
 */
export const SCRIPT_TEMA = `(function(){try{if(localStorage.getItem(${JSON.stringify(
  CHAVE_TEMA,
)})==="claro")document.documentElement.classList.remove("dark")}catch(e){}})();`;
