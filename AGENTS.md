# Onde conferir o Next antes de escrever código

Este projeto usa **Next.js 15.5.x com App Router** (versão exata em
`package.json`). Não escreva código de Next de memória: confira a versão
instalada e a fonte antes.

Fontes que existem de verdade nesta instalação, em ordem de preferência:

1. **`docs/roadmap.md` e `docs/conventions.md`** — decisões já tomadas aqui
   (por que Next 15 e não 16, por que as migrations do Payload têm script
   próprio, instante × dia de calendário, o que é Drizzle e o que é Payload).
   Uma decisão documentada vale mais que a documentação oficial genérica,
   porque carrega o motivo.
2. **Os tipos do pacote instalado** — `node_modules/next/types/**` e os
   `.d.ts` ao lado do código que você vai chamar. É a assinatura real da
   versão em uso, não a de outra.
3. **Documentação oficial da versão certa** — <https://nextjs.org/docs>,
   conferindo que a página corresponde ao 15.x com App Router. O App Router
   e o Pages Router divergem em quase tudo; exemplo de Pages Router aplicado
   aqui não funciona.

## O que estava escrito aqui antes, e por que saiu

A versão anterior deste arquivo mandava ler
`node_modules/next/dist/docs/` antes de escrever qualquer código, e dizia
que o próprio bloco era reescrito por `next dev`, com verificação em
`node_modules/next/dist/server/lib/generate-agent-files.js`.

**Nenhum dos dois caminhos existe no Next 15.5.22**, que é o que está
instalado. Não é questão de `pnpm install` incompleto: não há nenhum
gerador de agent-files em lugar nenhum do pacote (`find node_modules/next
-iname "*agent-file*"` não devolve nada), e `next/dist` não traz `.md`
além dos READMEs de dependências compiladas. O bloco vinha de uma linha
canary do Next e não se aplica a esta versão.

Na prática, a instrução mandava o agente procurar um diretório inexistente
— e, pior, dizia que remover o bloco "só recria a alteração", o que
desencoraja corrigi-lo. Daí este registro: para quem vier depois não
reintroduzir a regra achando que ela apenas se perdeu.

Se um dia o projeto subir para uma versão do Next que realmente publique
guias dentro do pacote, confira o caminho no `node_modules` antes de voltar
a citá-lo aqui.
