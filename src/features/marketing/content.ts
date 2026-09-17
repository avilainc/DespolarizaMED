// Copy da landing page.
//
// PREÇO NÃO MORA AQUI. Ele vem da tabela `plans` (ver
// `features/billing/precos.ts`): esta constante já teve valores fixos que
// discordavam do que o checkout cobrava, e o visitante via um preço na home e
// encontrava outro ao assinar. O que fica aqui é só texto de venda.
//
// Ainda placeholder e pendente de dado real: `teachers` (foto, formação) e
// `testimonials` (nome e autorização de quem deu o depoimento).

/**
 * Texto de venda por plano, casado pelo `slug` da tabela `plans`.
 *
 * Sem preço e sem duração: esses dois vêm do banco e são formatados por
 * `features/billing/precos.ts`. Um slug que o banco tenha e este mapa não
 * conheça cai em `padrao`, então cadastrar um plano novo não quebra a landing.
 */
export const beneficiosPorSlug: Record<
  string,
  { descricao: string; itens: readonly string[] }
> = {
  mensal: {
    descricao: "Ideal para experimentar a plataforma sem compromisso longo.",
    itens: [
      "Acesso a todas as disciplinas",
      "Banco de questões completo",
      "Plantões semanais ao vivo",
      "Plano de estudos personalizado",
    ],
  },
  trimestral: {
    descricao: "O mais escolhido por quem está a poucos meses da prova.",
    itens: [
      "Tudo do plano Mensal",
      "Provas antigas com resolução comentada",
      "Prioridade no plantão de dúvidas",
      "Acompanhamento de progresso",
    ],
  },
  semestral: {
    descricao: "Melhor custo-benefício para uma preparação completa.",
    itens: [
      "Tudo do plano Trimestral",
      "Acompanhamento de progresso avançado",
      "Acesso a todas as palestras exclusivas",
      "Preparação do começo ao fim do ano",
    ],
  },
  padrao: {
    descricao: "Acesso completo à plataforma.",
    itens: [
      "Acesso a todas as disciplinas",
      "Banco de questões completo",
      "Provas antigas com resolução",
      "Plantões ao vivo",
    ],
  },
};

export const subjects = [
  {
    name: "Biologia",
    slug: "biologia",
    description: "Bioquímica, genética, citologia e ecologia com foco em vestibulares de Medicina.",
  },
  {
    name: "Física",
    slug: "fisica",
    description: "Mecânica, termodinâmica e eletromagnetismo com resolução guiada de exercícios.",
  },
  {
    name: "Química",
    slug: "quimica",
    description: "Química orgânica, inorgânica e físico-química aplicadas às principais bancas.",
  },
] as const;

/**
 * `photo` está ausente de propósito: apontava para `/perfil.jpg`, que nunca
 * existiu em `public/` — dava 404 no console e o card caía no fallback de
 * iniciais. Sem o campo, o fallback é a escolha, não o acidente.
 *
 * PENDENTE: foto real, formação e instituição. "Médico e educador" não diz
 * onde se formou nem há quanto tempo ensina, que é o que o aluno procura ao
 * decidir de quem vai assistir aula.
 */
export const teachers: readonly {
  name: string;
  role: string;
  photo?: string;
  bio: string;
}[] = [
  {
    name: "Prof. João Ávila",
    role: "Biologia — Bioquímica e Genética",
    bio: "Médico e educador, dedicado a preparar a próxima geração de estudantes de Medicina.",
  },
];

export const testimonials = [
  {
    name: "Aluna aprovada em Medicina",
    quote:
      "O acompanhamento semanal e o banco de questões fizeram toda a diferença na minha preparação para o vestibular.",
    result: "Aprovada — FUVEST 2026",
  },
  {
    name: "Aluno em preparação",
    quote:
      "Os plantões ao vivo tiraram dúvidas que eu levava meses tentando resolver sozinho.",
    result: "Em preparação — ENEM 2026",
  },
] as const;

export const faqs = [
  {
    question: "Como funciona o acesso à plataforma?",
    answer:
      "Após a confirmação do pagamento, você tem acesso imediato a todas as disciplinas, aulas, banco de questões e materiais do seu plano.",
  },
  {
    question: "Posso cancelar quando quiser?",
    // Este texto já afirmou "cobrança única (sem renovação automática)" para
    // trimestral e semestral. O `scripts/seed-planos.mjs` cria um
    // `preapproval_plan` no Mercado Pago com `auto_recurring` de 3 e 6 meses —
    // ou seja, renova. Prometer o contrário do que o sistema faz gera
    // chargeback e reclamação; o texto passou a descrever o comportamento real.
    answer:
      "Sim. Todos os planos renovam automaticamente ao fim do período contratado, e você pode cancelar a qualquer momento antes da próxima cobrança — o acesso continua até o fim do período já pago.",
  },
  {
    question: "Os plantões ao vivo ficam gravados?",
    answer:
      "Sim, sempre que possível a gravação fica disponível na plataforma junto com o material da aula.",
  },
  {
    question: "A plataforma é só para quem presta Medicina?",
    answer:
      "O foco principal é Medicina, mas o conteúdo de Biologia, Física e Química também atende quem presta ENEM e outros vestibulares.",
  },
] as const;
