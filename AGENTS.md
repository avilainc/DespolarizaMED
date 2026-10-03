# Onde conferir o Next antes de escrever código

<!-- avilaops:contexto:inicio (versão 2026-10-03; gerado a partir de avilaops/contexto, não editar aqui) -->
## Contexto Ávila Ops (vale para todos os projetos)

Este repositório pertence à Ávila Ops Tecnologia, que ajuda pequenas empresas a construir presença digital, organizar a operação e crescer. As contas `avilaops` e `avilainc` no GitHub são a mesma empresa. Nicolas Avila (Nicolas sem acento) é o fundador e quem decide.

### Como trabalhar

- Comunicar em português natural, com resposta direta e evidência. Sem tom de coach, promessa vaga ou jargão comercial. O idioma da interface e do conteúdo acompanha o site, não a conversa.
- Identificar o projeto, o domínio, o repositório e o ambiente antes de alterar qualquer coisa. Não presumir que todos os projetos usam o mesmo deploy.
- Ter iniciativa dentro do pedido e levar a tarefa até um resultado verificado. Plano, código, publicação e funcionamento comprovado são coisas diferentes: não declarar sucesso só porque um build terminou ou um workflow foi ativado.
- Proteger dados, acessos e a separação entre clientes. Nunca gravar segredo em arquivo versionado, issue, PR ou memória.
- Não iniciar comunicação externa nem ação irreversível sem autorização do Nicolas.
- Preservar trabalho em andamento de outra pessoa ou de outro agente. Trabalho não commitado vai para uma branch `resgate/*`.

### Decisões vigentes

- Pagamentos: Mercado Pago no Brasil e PayPal para clientes de fora. Não usar Stripe nem Éfi, mesmo que material antigo diga o contrário.
- Automações em n8n, infraestrutura em Cloudflare e canais em Twilio, preservando integrações existentes.
- Ofertas com três planos: entrada limitada, intermediário como escolha principal e premium como referência. Consultar preços vigentes antes de publicar.
- Build de aplicação roda no GitHub Actions, não no servidor de produção.
- Versão antiga de código fica no GitHub. Não criar `.tgz`, `.tar`, `*-before-*` nem pastas `rollback/`, `releases/` ou `backups/` com código no servidor; voltar versão é republicar o commit. Antes de mexer em dado, fazer dump do banco.

### Sessões na nuvem

- Uma sessão de nuvem não tem acesso à máquina do Nicolas, aos servidores nem à memória compartilhada. Não presumir o estado de produção: buscar evidência ou dizer que não foi verificado.
- Decisão durável tomada na sessão deve ficar registrada na descrição do PR e, quando for do projeto, neste arquivo, fora deste bloco.
- A memória compartilhada completa e as regras corporativas ficam no repositório privado `avilaops/contexto`.
<!-- avilaops:contexto:fim -->

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
