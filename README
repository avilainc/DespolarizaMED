A estrutura mais consistente para o **DespolarizaMED** é tratá-lo como uma **plataforma educacional própria**, e não como um simples portal de vídeos. O YouTube fica como aquisição; o produto pago concentra conteúdo, estudo, exercícios, provas, acompanhamento e plantões.

# DespolarizaMED — Estrutura do Projeto

## 1. Visão do produto

**Nome:** DespolarizaMED
**Domínio:** [www.despolarizamed.com.br](http://www.despolarizamed.com.br)
**GitHub:** github.com/avilaops/despolarizamed
**Instagram:** instagram.com/despolarizamed
**YouTube:** youtube.com/@despolarizamed

### Proposta

O **DespolarizaMED** será uma plataforma completa de aprendizagem voltada principalmente para:

* Vestibulandos de Medicina
* Estudantes se preparando para ENEM e vestibulares
* Pessoas que desejam aprofundar conhecimentos em Biologia, Física e Química

O objetivo não é apenas disponibilizar aulas gravadas.

A plataforma deverá funcionar como um **ecossistema de preparação**, reunindo:

* Aulas
* Resolução de exercícios
* Resolução de provas
* Provas antigas
* Materiais didáticos
* Planejamento de estudos
* Atividades
* Calendário
* Glossário
* Plantões ao vivo
* Palestras
* Acompanhamento de progresso
* Área individual do aluno

---

# 2. Estratégia do ecossistema

## Conteúdo aberto

### YouTube

O canal do YouTube funcionará como:

* Aquisição de novos alunos
* Demonstração da qualidade das aulas
* Conteúdo gratuito
* Resoluções selecionadas
* Cortes de aulas
* Conteúdos introdutórios
* Divulgação de novos módulos

O YouTube será apenas uma **amostra do ecossistema DespolarizaMED**.

### Instagram

Função principal:

* Conteúdo rápido
* Questões
* Dicas de vestibular
* Divulgação de aulas
* Divulgação de plantões
* Conteúdo educacional
* Conversão para assinatura

### Site público

**despolarizamed.com.br**

Responsável por:

* Apresentar o método
* Mostrar professores
* Explicar disciplinas
* Mostrar planos
* Exibir aulas demonstrativas
* Mostrar depoimentos
* FAQ
* Blog/conteúdo SEO
* Login
* Cadastro
* Checkout

---

# 3. Plataforma interna

Após autenticação, o aluno entra no ambiente de aprendizagem.

Estrutura principal:

```text
DespolarizaMED
│
├── Dashboard
│
├── Disciplinas
│   ├── Biologia
│   ├── Física
│   └── Química
│
├── Meu plano de estudos
├── Atividades
├── Banco de questões
├── Provas
├── Calendário
├── Plantões
├── Palestras
├── Glossário
├── Meu progresso
├── Favoritos
├── Downloads
└── Minha conta
```

---

# 4. Organização pedagógica

A hierarquia principal do conteúdo será:

```text
DISCIPLINA
   ↓
MÓDULO
   ↓
AULA
   ↓
MATERIAIS
   ↓
EXERCÍCIOS
   ↓
AVALIAÇÃO / PROGRESSO
```

Exemplo real utilizando o conteúdo que já existe:

```text
BIOLOGIA

├── Módulo 1 — Bioquímica
│   ├── Aula 01 — Bioquímica
│   ├── Aula 02 — Carboidratos
│   ├── Aula 03 — Lipídios
│   ├── Aula 04 — Proteínas
│   └── Aula 05 — Vitaminas
│
└── Módulo 2
    ├── Aula 06 — Ácido nucleico
    ├── Aula 07 — Síntese proteica
    ├── Aula 08 — Célula e organelas
    ├── Aula 09 — Membrana plasmática e transportes
    └── Aula 10 — Respiração celular
```

Essa estrutura já corresponde ao padrão encontrado no Google Drive atual.

---

# 5. Estrutura de uma aula

Cada aula deve ser tratada como uma entidade própria no sistema.

## Página da aula

### Vídeo

Player principal da aula.

Funções desejáveis:

* Play/pause
* Velocidade de reprodução
* Tela cheia
* Controle de volume
* Continuar de onde o aluno parou
* Marcar aula como concluída
* Legenda
* Transcrição

### Legenda automática

Ao cadastrar um novo vídeo:

```text
Upload do vídeo
      ↓
Processamento
      ↓
Extração do áudio
      ↓
Transcrição automática
      ↓
Geração da legenda
      ↓
Revisão pelo professor
      ↓
Publicação
```

Idealmente gerar:

* `.vtt`
* transcrição textual da aula

A transcrição posteriormente também poderá servir para:

* Pesquisa dentro das aulas
* Glossário automático
* Resumos
* Localização de assuntos
* Recursos de IA

---

# 6. Material de cada aula

Cada aula poderá ter uma aba:

### Aula

Vídeo principal.

### Material de acompanhamento

PDF preparado para o aluno acompanhar a aula.

Pode ser:

* impresso;
* preenchido durante a aula;
* utilizado como caderno de acompanhamento.

### Slides

PDF dos slides utilizados pelo professor.

### Anotações da aula

O conteúdo produzido/escrito pelo professor durante a aula deverá ser exportado e disponibilizado ao final em PDF.

### Lista de exercícios

Lista específica relacionada ao assunto daquela aula.

### Resolução

Quando disponível:

* PDF da resolução
* vídeo da resolução
* resolução comentada dentro do sistema

Estrutura:

```text
Aula 03 — Lipídios

▶ Assistir aula

Materiais
├── 📄 Material de acompanhamento
├── 📊 Slides
├── 📝 Anotações da aula
├── 📚 Lista de exercícios
└── ✅ Resolução
```

---

# 7. Banco de questões

Esse deve se tornar um dos principais módulos do produto.

Cada questão deve possuir metadados.

Exemplo:

```text
Disciplina: Biologia
Tema: Citologia
Subtema: Membrana plasmática
Vestibular: FUVEST
Ano: 2024
Dificuldade: Média
Tipo: Múltipla escolha
```

Filtros:

* Disciplina
* Módulo
* Tema
* Subtema
* Vestibular
* Universidade
* Ano
* Dificuldade
* Questões já realizadas
* Questões erradas
* Questões favoritas

---

# 8. Provas antigas

Não deixar provas simplesmente armazenadas como PDFs.

Criar um catálogo estruturado:

```text
PROVAS

├── ENEM
│   ├── 2026
│   ├── 2025
│   └── ...
│
├── FUVEST
├── UNESP
├── UNICAMP
├── FAMERP
├── FAMEMA
└── Outros vestibulares
```

Cada prova poderá possuir:

* Prova original
* Gabarito
* Resolução
* Questões individualizadas
* Desempenho do aluno
* Tempo gasto

---

# 9. Resolução de provas

O aluno poderá:

1. Selecionar uma prova.
2. Iniciar uma tentativa.
3. Responder às questões.
4. Finalizar a prova.
5. Receber o resultado.
6. Identificar erros.
7. Assistir ou consultar resoluções.

Dashboard:

```text
FUVEST 2025

Questões: 30
Acertos: 23
Erros: 7
Desempenho: 76%

Pontos fortes
✓ Bioquímica
✓ Genética

Revisar
⚠ Citologia
⚠ Ecologia
```

---

# 10. Plano de estudos

O plano de estudos deve conectar todo o sistema.

O aluno informa inicialmente:

* Vestibular pretendido
* Data da prova
* Quantos dias estuda por semana
* Quantas horas disponíveis
* Disciplinas com maior dificuldade

O sistema monta um cronograma.

Exemplo:

```text
SEGUNDA

08:00 — Biologia
Módulo 1 / Aula 03 — Lipídios

09:10 — Exercícios
10 questões de Bioquímica

19:00 — Revisão
Questões erradas
```

---

# 11. Calendário

Centralizar:

* Plano de estudos
* Plantões
* Palestras
* Simulados
* Novas aulas
* Atividades
* Datas de vestibulares
* Revisões programadas

---

# 12. Organização de estudos

Dashboard individual:

```text
Olá, João 👋

Continue estudando

Biologia
████████░░ 82%

Física
████░░░░░░ 38%

Química
██████░░░░ 61%
```

Indicadores:

* Tempo de estudo
* Aulas concluídas
* Exercícios realizados
* Taxa de acerto
* Sequência de estudos
* Módulos concluídos
* Conteúdo pendente
* Próximas atividades

---

# 13. Glossário

Glossário integrado às disciplinas.

Exemplo:

```text
ATP

Adenosina trifosfato.

Molécula utilizada pelas células como principal
forma de armazenamento e transferência de energia.

Relacionado a:

Biologia
→ Bioquímica
→ Respiração celular
```

Os termos poderão estar vinculados diretamente às aulas.

---

# 14. Plantão semanal

O plantão será realizado via **Google Meet**.

Fluxo:

```text
Professor agenda plantão
        ↓
Evento aparece no calendário
        ↓
Aluno recebe aviso
        ↓
Aluno acessa o link do Google Meet
        ↓
Plantão acontece
        ↓
Material fica disponível na plataforma
```

Página:

```text
Plantão de Biologia

Quinta-feira
19h às 20h

Tema:
Genética e Biologia Molecular

[ Entrar no Google Meet ]
```

Depois:

```text
Materiais do plantão

📄 Anotações
📊 Slides
📚 Exercícios
🎥 Gravação — caso disponível
```

---

# 15. Palestras

Área separada para conteúdos especiais.

Exemplos:

* Como organizar os estudos
* Estratégia para vestibular
* Como revisar
* Como resolver provas
* Como controlar o tempo
* Profissões da área médica
* Conversas com médicos
* Psicologia da preparação

---

# 16. Área do aluno

Permissão:

`STUDENT`

Menu:

```text
Dashboard
Aulas
Disciplinas
Plano de estudos
Atividades
Questões
Provas
Plantões
Palestras
Calendário
Glossário
Favoritos
Downloads
Meu progresso
Minha assinatura
Perfil
```

---

# 17. Área do professor

Permissão:

`TEACHER`

O professor poderá:

### Conteúdo

* Criar disciplina
* Criar módulo
* Criar aula
* Enviar vídeo
* Enviar material
* Enviar slides
* Enviar exercícios
* Cadastrar questões

### Aulas

* Editar aula
* Publicar/despublicar
* Revisar legenda automática
* Gerenciar materiais

### Plantões

* Agendar plantão
* Inserir link Google Meet
* Inserir material após o plantão

### Alunos

Dependendo da permissão:

* Visualizar desempenho
* Visualizar dúvidas
* Acompanhar atividades

---

# 18. Área administrativa

Permissão:

`ADMIN`

O administrador terá acesso a todo o ecossistema.

```text
Administração
│
├── Dashboard
├── Usuários
├── Alunos
├── Professores
├── Assinaturas
├── Pagamentos
├── Disciplinas
├── Módulos
├── Aulas
├── Vídeos
├── Materiais
├── Questões
├── Provas
├── Plantões
├── Palestras
├── Calendário
├── Cupons
├── Comunicação
├── Relatórios
├── Logs
└── Configurações
```

---

# 19. Sistema de permissões

Não vincular permissões diretamente às páginas.

Utilizar RBAC.

Perfis iniciais:

```text
ADMIN
TEACHER
STUDENT
```

Posteriormente:

```text
CONTENT_MANAGER
SUPPORT
FINANCIAL
EDITOR
```

---

# 20. Assinaturas

Gateway:

**Mercado Pago**

Três planos:

### Mensal

Cobrança recorrente mensal.

### Trimestral

Acesso por três meses.

### Semestral

Acesso por seis meses.

A estrutura comercial deve permitir alterar os valores pelo painel administrativo, sem valores hardcoded no frontend.

Modelo:

```text
plans

id
name
slug
billing_period
price
active
mercadopago_plan_id
created_at
updated_at
```

---

# 21. Fluxo financeiro

```text
Aluno escolhe plano
        ↓
Cadastro
        ↓
Mercado Pago
        ↓
Pagamento aprovado
        ↓
Webhook
        ↓
Servidor valida pagamento
        ↓
Assinatura criada/ativada
        ↓
Acesso liberado
```

Eventos importantes:

```text
subscription.created
subscription.activated
payment.approved
payment.failed
subscription.cancelled
subscription.expired
```

O acesso nunca deve depender apenas do retorno do navegador.

A confirmação deve acontecer no backend através de webhook validado.

---

# 22. Status da assinatura

```text
PENDING
ACTIVE
PAST_DUE
CANCELLED
EXPIRED
```

Middleware:

```text
Usuário autenticado
        ↓
Assinatura válida?
        ↓
SIM → conteúdo premium

NÃO → página de planos
```

---

# 23. Banco de dados — entidades principais

## Autenticação

```text
users
roles
permissions
sessions
```

## Educação

```text
subjects
modules
lessons
lesson_materials
videos
captions
transcripts
```

## Exercícios

```text
questions
question_options
question_topics
exercise_lists
exercise_list_questions
```

## Provas

```text
exams
exam_questions
exam_attempts
exam_answers
```

## Aprendizado

```text
student_progress
lesson_progress
study_plans
study_plan_items
student_activities
student_notes
favorites
```

## Eventos

```text
events
live_sessions
lectures
```

## Conteúdo

```text
glossary_terms
attachments
```

## Comercial

```text
plans
subscriptions
payments
coupons
payment_events
```

---

# 24. Organização recomendada do Google Drive

O Drive não deve funcionar como banco de dados da aplicação.

Ele deve ser utilizado como **acervo editorial/original**.

Estrutura:

```text
DESPOLARIZAMED
│
├── 00_ASSETS
│   ├── Logos
│   ├── Identidade
│   ├── Thumbnails
│   └── Templates
│
├── 01_BIOLOGIA
│   │
│   ├── MODULO_01_BIOQUIMICA
│   │   │
│   │   ├── AULA_01_BIOQUIMICA
│   │   │   ├── 01_VIDEO
│   │   │   ├── 02_SLIDES
│   │   │   ├── 03_APOSTILA
│   │   │   ├── 04_EXERCICIOS
│   │   │   └── 05_RESOLUCOES
│   │   │
│   │   └── ...
│   │
│   └── MODULO_02_BIOLOGIA_MOLECULAR
│
├── 02_FISICA
│
├── 03_QUIMICA
│
├── 04_PROVAS
│   ├── ENEM
│   ├── FUVEST
│   ├── UNESP
│   ├── UNICAMP
│   ├── FAMERP
│   └── FAMEMA
│
├── 05_PLANTOES
│
├── 06_PALESTRAS
│
└── 07_DOCUMENTOS
```

---

# 25. Organização das provas

O trabalho de organização das provas deve seguir um processo.

## Etapa 1 — Inventário

Identificar:

* Instituição
* Vestibular
* Ano
* Fase
* Disciplina
* Arquivo
* Gabarito

## Etapa 2 — Classificação

Cada questão deverá receber:

```text
Disciplina
Tema
Subtema
Dificuldade
Competência
Vestibular
Ano
```

## Etapa 3 — Padronização

Criar documentos mantendo uma mesma identidade visual.

Exemplo:

```text
DespolarizaMED
Banco de Questões

BIOLOGIA
Citologia

Questão 01 — FUVEST 2025

[enunciado]

A)
B)
C)
D)
E)
```

Assim o material deixa de ser apenas um acervo de PDFs e passa a alimentar o banco de questões da própria plataforma.

---

# 26. Pipeline de vídeo

Não recomendo servir diretamente vídeos de aproximadamente 2–3 GB pelo Google Drive para o player final da plataforma.

O fluxo ideal é:

```text
UPLOAD ORIGINAL
      ↓
ARQUIVO MASTER
      ↓
PROCESSAMENTO
      ├── vídeo otimizado
      ├── streaming
      ├── thumbnail
      ├── áudio
      ├── legenda
      └── transcrição
      ↓
PUBLICAÇÃO
```

Isso evita transformar o Google Drive em infraestrutura de streaming.

---

# 27. CMS educacional

A administração de conteúdo deve ser feita dentro do próprio DespolarizaMED.

Exemplo:

```text
Nova aula

Disciplina
[ Biologia ]

Módulo
[ Bioquímica ]

Título
[ Aula 05 — Vitaminas ]

Professor
[ ... ]

Descrição
[ ... ]

Vídeo
[ Upload ]

Materiais
+ Slide
+ Apostila
+ Exercícios
+ Resolução

[ Salvar rascunho ]
[ Publicar ]
```

O professor não deveria precisar mexer diretamente no código para publicar conteúdo.

---

# 28. Arquitetura do produto

Sugestão:

```text
despolarizamed.com.br
│
├── Site público
│
└── Plataforma
    │
    ├── /login
    ├── /cadastro
    ├── /dashboard
    ├── /disciplinas
    ├── /aulas
    ├── /questoes
    ├── /provas
    ├── /plano-de-estudos
    ├── /calendario
    ├── /plantoes
    ├── /palestras
    ├── /glossario
    │
    ├── /professor
    │
    └── /admin
```

Neste projeto, não há necessidade inicial de separar vários subdomínios.

Uma única aplicação pode controlar:

* site;
* autenticação;
* aluno;
* professor;
* administração.

---

# 29. Arquitetura técnica sugerida

```text
Frontend
Next.js + TypeScript

Backend
API própria

Database
PostgreSQL

Storage
Object Storage

Vídeo
Pipeline de streaming

Pagamentos
Mercado Pago

Live
Google Meet

E-mail
Resend

Automação
n8n

Infraestrutura
Servidor próprio
```

---

# 30. Estrutura de código

```text
despolarizamed/
│
├── apps/
│   └── web/
│
├── packages/
│   ├── database/
│   ├── auth/
│   ├── ui/
│   ├── payments/
│   ├── video/
│   ├── education/
│   └── email/
│
├── docs/
│   ├── architecture/
│   ├── product/
│   ├── database/
│   ├── security/
│   └── procedures/
│
└── README.md
```

Se o projeto inicialmente tiver apenas uma aplicação Next.js, não há necessidade de criar um monorepo excessivamente complexo.

A separação por domínio pode existir internamente:

```text
src/
├── app/
├── components/
├── features/
│   ├── auth/
│   ├── students/
│   ├── teachers/
│   ├── courses/
│   ├── lessons/
│   ├── questions/
│   ├── exams/
│   ├── study-plan/
│   ├── live/
│   ├── billing/
│   └── admin/
│
├── lib/
├── server/
└── types/
```

---

# 31. Dashboard administrativo

Indicadores:

### Alunos

* Alunos ativos
* Novos alunos
* Cancelamentos
* Alunos inadimplentes

### Financeiro

* MRR
* Receita mensal
* Ticket médio
* Planos ativos
* Conversão

### Educação

* Aulas assistidas
* Tempo de estudo
* Exercícios respondidos
* Média de acertos
* Conteúdos mais assistidos
* Conteúdos com maior abandono

### Plataforma

* Usuários ativos
* Vídeos publicados
* Armazenamento
* Erros
* Processamentos pendentes

---

# 32. MVP

Não é recomendável desenvolver tudo simultaneamente.

## Fase 1 — Fundação

Entregar:

* Site público
* Login
* Cadastro
* Aluno
* Professor
* Administrador
* Mercado Pago
* Planos
* Assinatura
* Disciplinas
* Módulos
* Aulas
* Player
* Materiais
* Progresso básico

## Fase 2 — Aprendizado

Adicionar:

* Exercícios
* Banco de questões
* Provas
* Resoluções
* Glossário
* Favoritos
* Busca

## Fase 3 — Organização

Adicionar:

* Plano de estudos
* Calendário
* Atividades
* Histórico
* Dashboard de desempenho

## Fase 4 — Ao vivo

Adicionar:

* Plantões
* Google Meet
* Palestras
* Notificações

## Fase 5 — Inteligência educacional

Posteriormente:

* Transcrição integral
* Busca semântica
* Resumos
* Recomendações
* Revisões personalizadas
* Identificação de dificuldades
* Plano de estudo adaptativo

---

# 33. Jornada principal

## Aquisição

```text
Google / Instagram / YouTube
              ↓
         DespolarizaMED
              ↓
          Página de venda
```

## Conversão

```text
Escolher plano
      ↓
Cadastro
      ↓
Mercado Pago
      ↓
Pagamento
      ↓
Acesso
```

## Aprendizagem

```text
Dashboard
   ↓
Plano de estudos
   ↓
Disciplina
   ↓
Módulo
   ↓
Aula
   ↓
Exercícios
   ↓
Correção
   ↓
Revisão
```

## Retenção

```text
Progresso
+
Calendário
+
Plantão semanal
+
Novos conteúdos
+
Provas
+
Plano de estudos
```

---

# 34. Conceito central

O DespolarizaMED não deverá ser comunicado como:

> "um site com videoaulas."

A estrutura deverá comunicar:

> **Uma plataforma completa de preparação para vestibulares de Medicina, reunindo aulas, exercícios, provas, organização dos estudos, acompanhamento de desempenho e suporte ao vivo em um único ambiente.**

O conteúdo gratuito do YouTube gera descoberta.

O **DespolarizaMED transforma esse conteúdo em uma jornada organizada de aprendizagem.**

Um ponto importante que apareceu ao analisar o Drive: a estrutura real já está bastante alinhada com esse modelo. A raiz atualmente contém `Assets` e `biologia`, e Biologia já possui módulos separados.  No primeiro módulo encontrei as aulas de Bioquímica, Carboidratos, Lipídios, Proteínas e Vitaminas; no segundo, Ácido Nucleico, Síntese Proteica, Célula e Organelas, Membrana Plasmática/Transportes e Respiração Celular. Portanto, **eu manteria Disciplina → Módulo → Aula como regra oficial do projeto**.

Eu também mudaria uma coisa importante em relação à ideia inicial: **Drive como origem/editorial, não como infraestrutura definitiva de vídeo**. Os arquivos atuais chegam a vários gigabytes por aula; para uma plataforma paga, vale processá-los e entregá-los por streaming, enquanto o Drive permanece como acervo master dos professores. Isso também facilita legenda automática, retomada do vídeo e medição de progresso.
