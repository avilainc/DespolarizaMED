// Conteúdo placeholder da landing page. Substituir por dados reais
// (nomes de professores, preços definitivos, depoimentos de alunos) assim
// que disponíveis — ou migrar para o Payload CMS se precisar de edição
// visual sem deploy.

export const plans = [
  {
    slug: "mensal",
    name: "Mensal",
    priceLabel: "R$ 97",
    period: "/mês",
    description: "Ideal para experimentar a plataforma sem compromisso longo.",
    features: [
      "Acesso a todas as disciplinas",
      "Banco de questões completo",
      "Plantões semanais ao vivo",
      "Plano de estudos personalizado",
    ],
    highlighted: false,
  },
  {
    slug: "trimestral",
    name: "Trimestral",
    priceLabel: "R$ 79",
    period: "/mês",
    description: "O mais escolhido por quem está a poucos meses da prova.",
    features: [
      "Tudo do plano Mensal",
      "3 meses de acesso (cobrança única)",
      "Provas antigas com resolução comentada",
      "Prioridade no plantão de dúvidas",
    ],
    highlighted: true,
  },
  {
    slug: "semestral",
    name: "Semestral",
    priceLabel: "R$ 67",
    period: "/mês",
    description: "Melhor custo-benefício para uma preparação completa.",
    features: [
      "Tudo do plano Trimestral",
      "6 meses de acesso (cobrança única)",
      "Acompanhamento de progresso avançado",
      "Acesso a todas as palestras exclusivas",
    ],
    highlighted: false,
  },
] as const;

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

export const teachers = [
  {
    name: "Prof. João Ávila",
    role: "Biologia — Bioquímica e Genética",
    photo: "/perfil.jpg",
    bio: "Médico e educador, dedicado a preparar a próxima geração de estudantes de Medicina.",
  },
] as const;

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
    answer:
      "Sim. Planos trimestral e semestral são cobrança única (sem renovação automática); o plano mensal pode ser cancelado a qualquer momento antes da próxima cobrança.",
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
