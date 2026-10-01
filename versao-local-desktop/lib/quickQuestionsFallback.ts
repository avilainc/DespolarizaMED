// Mesmo conteúdo seedado em create-tables.sql — usado como fallback
// enquanto o SQL não roda no Supabase (ver /conquistas: só usa isso se
// a query voltar vazia).
import { EXAM_BANK } from './examBank'

export type FallbackOption = { letra: string; texto: string }
export type FallbackQuestion = {
  id: string
  subject: string
  question: string
  options: FallbackOption[]
  correct_option: string
}

// Texto-base das 5 questões reais abaixo (Unifesp 2025, prova de Língua
// Inglesa, questões 16/17/18/20/21 — conferidas 1 a 1 com o gabarito
// oficial "gabarito da prova objetiva_.pdf": 16-B, 17-A, 18-C, 20-B, 21-A).
const UNIFESP_TEXT = `Eat your heart out, Victor Frankenstein! Researchers have succeeded in creating living machines made from electronic parts and living fungi. In the past, so-called biohybrid robots — which combine living tissue with robotic materials — have generally employed animal cells, but these are hard to keep alive. Fungi, by contrast, are incredibly resilient. Their branching networks of rootlike filaments, called mycelia, which allow mushrooms to connect and communicate underground, can both sense the environment and fire off electrical signals in response — just like neurons in the human brain.

The team behind the project cultured these filaments from the king oyster mushroom (Pleurotus eryngii) onto electrodes in a 3D-printed platform, then hooked them up to a computer interface — allowing electrical impulses from the fungi to be converted into digital commands.

The end result was a soft, starfish-shaped walking robot, as well as another hard robot with wheels. In both cases, the team used ultraviolet light to stimulate the mycelium, triggering electrical signals that directed the robots to walk and roll at different speeds, the researchers report in Science Robotics.

(Phie Jacobs. www.science.org, 28.08.2024. Adaptado.)`

export const QUICK_QUESTIONS_FALLBACK: FallbackQuestion[] = [
  { id: 'qqfb-1', subject: 'Biologia', question: 'Qual organela é responsável pela respiração celular?', options: [{ letra: 'A', texto: 'Ribossomo' }, { letra: 'B', texto: 'Mitocôndria' }, { letra: 'C', texto: 'Complexo de Golgi' }, { letra: 'D', texto: 'Vacúolo' }], correct_option: 'B' },
  { id: 'qqfb-2', subject: 'Biologia', question: 'O processo de divisão celular que forma os gametas é chamado de:', options: [{ letra: 'A', texto: 'Mitose' }, { letra: 'B', texto: 'Meiose' }, { letra: 'C', texto: 'Fecundação' }, { letra: 'D', texto: 'Mutação' }], correct_option: 'B' },
  { id: 'qqfb-3', subject: 'Biologia', question: 'Qual molécula carrega a informação genética das células?', options: [{ letra: 'A', texto: 'RNA' }, { letra: 'B', texto: 'ATP' }, { letra: 'C', texto: 'DNA' }, { letra: 'D', texto: 'Glicose' }], correct_option: 'C' },
  { id: 'qqfb-4', subject: 'Biologia', question: 'As hemácias são responsáveis principalmente por transportar:', options: [{ letra: 'A', texto: 'Nutrientes' }, { letra: 'B', texto: 'Oxigênio' }, { letra: 'C', texto: 'Hormônios' }, { letra: 'D', texto: 'Anticorpos' }], correct_option: 'B' },
  { id: 'qqfb-5', subject: 'Biologia', question: 'O processo pelo qual as plantas produzem seu próprio alimento é a:', options: [{ letra: 'A', texto: 'Respiração' }, { letra: 'B', texto: 'Fotossíntese' }, { letra: 'C', texto: 'Digestão' }, { letra: 'D', texto: 'Excreção' }], correct_option: 'B' },

  { id: 'qqfb-6', subject: 'Matemática', question: 'Quanto é 7 ao quadrado (7²)?', options: [{ letra: 'A', texto: '14' }, { letra: 'B', texto: '49' }, { letra: 'C', texto: '21' }, { letra: 'D', texto: '77' }], correct_option: 'B' },
  { id: 'qqfb-7', subject: 'Matemática', question: 'Qual é o valor aproximado de π (pi)?', options: [{ letra: 'A', texto: '3,14' }, { letra: 'B', texto: '2,71' }, { letra: 'C', texto: '1,61' }, { letra: 'D', texto: '4,20' }], correct_option: 'A' },
  { id: 'qqfb-8', subject: 'Matemática', question: 'Numa PA de razão 3 começando em 2 (2, 5, 8...), qual é o 4º termo?', options: [{ letra: 'A', texto: '8' }, { letra: 'B', texto: '11' }, { letra: 'C', texto: '9' }, { letra: 'D', texto: '14' }], correct_option: 'B' },
  { id: 'qqfb-9', subject: 'Matemática', question: 'Qual é a raiz quadrada de 144?', options: [{ letra: 'A', texto: '11' }, { letra: 'B', texto: '13' }, { letra: 'C', texto: '12' }, { letra: 'D', texto: '14' }], correct_option: 'C' },
  { id: 'qqfb-10', subject: 'Matemática', question: 'Se x + 5 = 12, quanto vale x?', options: [{ letra: 'A', texto: '5' }, { letra: 'B', texto: '6' }, { letra: 'C', texto: '7' }, { letra: 'D', texto: '17' }], correct_option: 'C' },

  { id: 'qqfb-11', subject: 'Física', question: 'Qual é a unidade de medida de força no Sistema Internacional?', options: [{ letra: 'A', texto: 'Joule' }, { letra: 'B', texto: 'Newton' }, { letra: 'C', texto: 'Watt' }, { letra: 'D', texto: 'Pascal' }], correct_option: 'B' },
  { id: 'qqfb-12', subject: 'Física', question: 'A velocidade da luz no vácuo é aproximadamente:', options: [{ letra: 'A', texto: '300 mil km/s' }, { letra: 'B', texto: '30 mil km/s' }, { letra: 'C', texto: '3 mil km/s' }, { letra: 'D', texto: '3 milhões km/s' }], correct_option: 'A' },
  { id: 'qqfb-13', subject: 'Física', question: 'Qual lei de Newton diz que "para toda ação existe uma reação"?', options: [{ letra: 'A', texto: '1ª lei' }, { letra: 'B', texto: '2ª lei' }, { letra: 'C', texto: '3ª lei' }, { letra: 'D', texto: 'Lei da gravitação' }], correct_option: 'C' },
  { id: 'qqfb-14', subject: 'Física', question: 'A energia cinética de um corpo depende de:', options: [{ letra: 'A', texto: 'Massa e velocidade' }, { letra: 'B', texto: 'Só da massa' }, { letra: 'C', texto: 'Só da altura' }, { letra: 'D', texto: 'Temperatura' }], correct_option: 'A' },
  { id: 'qqfb-15', subject: 'Física', question: 'O que um termômetro mede?', options: [{ letra: 'A', texto: 'Pressão' }, { letra: 'B', texto: 'Temperatura' }, { letra: 'C', texto: 'Volume' }, { letra: 'D', texto: 'Densidade' }], correct_option: 'B' },

  { id: 'qqfb-16', subject: 'Química', question: 'Qual é o símbolo químico do sódio?', options: [{ letra: 'A', texto: 'So' }, { letra: 'B', texto: 'Sd' }, { letra: 'C', texto: 'Na' }, { letra: 'D', texto: 'S' }], correct_option: 'C' },
  { id: 'qqfb-17', subject: 'Química', question: 'A água é formada por quais elementos?', options: [{ letra: 'A', texto: 'Hidrogênio e Oxigênio' }, { letra: 'B', texto: 'Carbono e Oxigênio' }, { letra: 'C', texto: 'Hidrogênio e Nitrogênio' }, { letra: 'D', texto: 'Oxigênio e Nitrogênio' }], correct_option: 'A' },
  { id: 'qqfb-18', subject: 'Química', question: 'O pH considerado neutro é igual a:', options: [{ letra: 'A', texto: '0' }, { letra: 'B', texto: '14' }, { letra: 'C', texto: '7' }, { letra: 'D', texto: '1' }], correct_option: 'C' },
  { id: 'qqfb-19', subject: 'Química', question: 'Qual é a menor partícula que mantém as propriedades químicas de um elemento?', options: [{ letra: 'A', texto: 'Molécula' }, { letra: 'B', texto: 'Átomo' }, { letra: 'C', texto: 'Elétron' }, { letra: 'D', texto: 'Íon' }], correct_option: 'B' },
  { id: 'qqfb-20', subject: 'Química', question: 'Uma reação exotérmica é aquela que:', options: [{ letra: 'A', texto: 'Absorve calor' }, { letra: 'B', texto: 'Libera calor' }, { letra: 'C', texto: 'Não envolve calor' }, { letra: 'D', texto: 'Só ocorre em gases' }], correct_option: 'B' },

  { id: 'qqfb-21', subject: 'Geografia', question: 'Qual é o maior bioma brasileiro em extensão?', options: [{ letra: 'A', texto: 'Cerrado' }, { letra: 'B', texto: 'Mata Atlântica' }, { letra: 'C', texto: 'Amazônia' }, { letra: 'D', texto: 'Caatinga' }], correct_option: 'C' },
  { id: 'qqfb-22', subject: 'Geografia', question: 'O Brasil é dividido em quantas regiões oficiais?', options: [{ letra: 'A', texto: '4' }, { letra: 'B', texto: '5' }, { letra: 'C', texto: '6' }, { letra: 'D', texto: '7' }], correct_option: 'B' },
  { id: 'qqfb-23', subject: 'Geografia', question: 'Qual é a capital do Brasil?', options: [{ letra: 'A', texto: 'Rio de Janeiro' }, { letra: 'B', texto: 'São Paulo' }, { letra: 'C', texto: 'Brasília' }, { letra: 'D', texto: 'Salvador' }], correct_option: 'C' },
  { id: 'qqfb-24', subject: 'Geografia', question: 'O que é o Efeito Estufa?', options: [{ letra: 'A', texto: 'Resfriamento da Terra' }, { letra: 'B', texto: 'Retenção de calor na atmosfera' }, { letra: 'C', texto: 'Formação de furacões' }, { letra: 'D', texto: 'Derretimento de rochas' }], correct_option: 'B' },
  { id: 'qqfb-25', subject: 'Geografia', question: 'Qual oceano banha o litoral leste do Brasil?', options: [{ letra: 'A', texto: 'Pacífico' }, { letra: 'B', texto: 'Índico' }, { letra: 'C', texto: 'Atlântico' }, { letra: 'D', texto: 'Ártico' }], correct_option: 'C' },

  { id: 'qqfb-26', subject: 'História', question: 'Em que ano o Brasil se tornou independente?', options: [{ letra: 'A', texto: '1822' }, { letra: 'B', texto: '1889' }, { letra: 'C', texto: '1500' }, { letra: 'D', texto: '1888' }], correct_option: 'A' },
  { id: 'qqfb-27', subject: 'História', question: 'Quem proclamou a independência do Brasil?', options: [{ letra: 'A', texto: 'Dom Pedro I' }, { letra: 'B', texto: 'Dom Pedro II' }, { letra: 'C', texto: 'Tiradentes' }, { letra: 'D', texto: 'Getúlio Vargas' }], correct_option: 'A' },
  { id: 'qqfb-28', subject: 'História', question: 'Em que ano foi abolida a escravidão no Brasil?', options: [{ letra: 'A', texto: '1822' }, { letra: 'B', texto: '1889' }, { letra: 'C', texto: '1888' }, { letra: 'D', texto: '1500' }], correct_option: 'C' },
  { id: 'qqfb-29', subject: 'História', question: 'A Proclamação da República no Brasil ocorreu em:', options: [{ letra: 'A', texto: '1822' }, { letra: 'B', texto: '1889' }, { letra: 'C', texto: '1888' }, { letra: 'D', texto: '1930' }], correct_option: 'B' },
  { id: 'qqfb-30', subject: 'História', question: 'Qual evento marcou o fim da Segunda Guerra Mundial no Japão?', options: [{ letra: 'A', texto: 'Revolução Francesa' }, { letra: 'B', texto: 'Queda do Muro de Berlim' }, { letra: 'C', texto: 'Rendição do Japão' }, { letra: 'D', texto: 'Guerra Fria' }], correct_option: 'C' },

  { id: 'qqfb-31', subject: 'Redação', question: 'Uma redação dissertativo-argumentativa (padrão ENEM) deve ter no mínimo quantos parágrafos?', options: [{ letra: 'A', texto: '2' }, { letra: 'B', texto: '3' }, { letra: 'C', texto: '4' }, { letra: 'D', texto: '5' }], correct_option: 'C' },
  { id: 'qqfb-32', subject: 'Redação', question: 'O que é uma tese, no contexto da redação dissertativa?', options: [{ letra: 'A', texto: 'Um exemplo' }, { letra: 'B', texto: 'O ponto de vista defendido pelo autor' }, { letra: 'C', texto: 'A conclusão do texto' }, { letra: 'D', texto: 'Uma citação' }], correct_option: 'B' },
  { id: 'qqfb-33', subject: 'Redação', question: 'A proposta de intervenção deve aparecer em qual parte do texto?', options: [{ letra: 'A', texto: 'Introdução' }, { letra: 'B', texto: 'Primeiro parágrafo de desenvolvimento' }, { letra: 'C', texto: 'Conclusão' }, { letra: 'D', texto: 'Não é obrigatória' }], correct_option: 'C' },
  { id: 'qqfb-34', subject: 'Redação', question: 'Repetir a mesma palavra várias vezes seguidas prejudica principalmente qual competência do ENEM?', options: [{ letra: 'A', texto: 'Domínio da norma culta' }, { letra: 'B', texto: 'Coesão textual' }, { letra: 'C', texto: 'Conhecimento de mundo' }, { letra: 'D', texto: 'Proposta de intervenção' }], correct_option: 'B' },
  { id: 'qqfb-35', subject: 'Redação', question: 'O que caracteriza um argumento de autoridade?', options: [{ letra: 'A', texto: 'Uma opinião pessoal' }, { letra: 'B', texto: 'Uma citação de especialista ou dado oficial' }, { letra: 'C', texto: 'Um exemplo do cotidiano' }, { letra: 'D', texto: 'Uma pergunta retórica' }], correct_option: 'B' },

  // ---- 5 questões REAIS (Unifesp 2025, prova de Língua Inglesa) ----
  // Fonte: prova objetiva_.pdf + gabarito da prova objetiva_.pdf (baixados
  // por Paulo em despolarizaMED\bcano de daods de provas\). Gabarito
  // conferido 1 a 1 com o oficial, não inferido por IA.
  {
    id: 'qqfb-real-1', subject: 'Inglês',
    question: `${UNIFESP_TEXT}\n\nThe main purpose of the text is to`,
    options: [
      { letra: 'A', texto: 'justify the use of a combination of fungi and human cells in robots.' },
      { letra: 'B', texto: 'present the functioning of an innovative robot.' },
      { letra: 'C', texto: 'compare robots and humans in terms of resistance.' },
      { letra: 'D', texto: 'discuss the potential profitability of a new product.' },
      { letra: 'E', texto: 'show that fungi culture may be economically viable.' },
    ],
    correct_option: 'B',
  },
  {
    id: 'qqfb-real-2', subject: 'Inglês',
    question: `${UNIFESP_TEXT}\n\nNo trecho inicial do primeiro parágrafo "Eat your heart out, Victor Frankenstein!", a expressão sublinhada equivale, em português, a:`,
    options: [
      { letra: 'A', texto: 'Morra de inveja.' },
      { letra: 'B', texto: 'Não chega a seus pés.' },
      { letra: 'C', texto: 'Quanta bobagem.' },
      { letra: 'D', texto: 'O coração vai sair pela boca.' },
      { letra: 'E', texto: 'Você tem um coração de ouro.' },
    ],
    correct_option: 'A',
  },
  {
    id: 'qqfb-real-3', subject: 'Inglês',
    question: `${UNIFESP_TEXT}\n\nDe acordo com o texto, os novos robôs bio-híbridos utilizam fungos porque`,
    options: [
      { letra: 'A', texto: 'as ostras marinhas tornam o cultivo de fungos fácil e viável.' },
      { letra: 'B', texto: 'os fungos emitem sinais elétricos para estimular os neurônios humanos.' },
      { letra: 'C', texto: 'os fungos são resistentes e adaptáveis.' },
      { letra: 'D', texto: 'as células vivas de animais são muito dispendiosas.' },
      { letra: 'E', texto: 'os robôs com formato de estrela-do-mar são compatíveis com os fungos.' },
    ],
    correct_option: 'C',
  },
  {
    id: 'qqfb-real-4', subject: 'Inglês',
    question: `${UNIFESP_TEXT}\n\nThe excerpt from the first paragraph "which combine living tissue with robotic materials"`,
    options: [
      { letra: 'A', texto: 'offers a contrasting viewpoint.' },
      { letra: 'B', texto: 'provides an explanation.' },
      { letra: 'C', texto: 'introduces a quotation.' },
      { letra: 'D', texto: 'presents a counter-argument.' },
      { letra: 'E', texto: 'suggests a speculative remark.' },
    ],
    correct_option: 'B',
  },
  {
    id: 'qqfb-real-5', subject: 'Inglês',
    question: `${UNIFESP_TEXT}\n\nNo trecho do primeiro parágrafo "Fungi, by contrast, are incredibly resilient", a expressão sublinhada pode ser substituída, sem alteração de sentido, por:`,
    options: [
      { letra: 'A', texto: 'on the other hand.' },
      { letra: 'B', texto: 'so to speak.' },
      { letra: 'C', texto: 'apart from that.' },
      { letra: 'D', texto: 'for this reason.' },
      { letra: 'E', texto: 'to say the least.' },
    ],
    correct_option: 'A',
  },

  // ---- 100 questões REAIS (Famerp 2026 e Famema 2026, provas objetivas)
  // ---- ver lib/examBank.ts pra matéria+assunto detalhados (usado pelo
  // ---- /simulado); aqui entram só no pool geral do desafio diário.
  ...EXAM_BANK.map((q) => ({ id: q.id, subject: q.subject, question: q.question, options: q.options, correct_option: q.correct_option })),
]
