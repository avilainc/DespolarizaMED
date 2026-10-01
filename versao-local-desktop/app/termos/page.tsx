import Link from 'next/link'

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-app px-4 sm:px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-muted hover:text-fg text-sm transition">← Voltar</Link>
        <h1 className="text-2xl font-bold text-fg mt-4 mb-1">Termos de Uso</h1>
        <p className="text-faint text-xs mb-8">Última atualização: 14 de setembro de 2026</p>

        <div className="space-y-6 text-sm text-muted leading-relaxed">
          <section>
            <h2 className="text-fg font-semibold mb-2">1. Sobre a plataforma</h2>
            <p>
              O DespolarizaMed é uma plataforma de ensino online que oferece videoaulas gravadas,
              materiais de apoio e recursos de estudo voltados a estudantes que se preparam para
              vestibulares e residência médica. Ao criar uma conta, você concorda com estes Termos
              de Uso e com nossa <Link href="/privacidade" className="text-primary-light hover:underline">Política de Privacidade</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-fg font-semibold mb-2">2. Cadastro e conta</h2>
            <p>
              Você é responsável por manter a confidencialidade da sua senha e por todas as
              atividades realizadas na sua conta. As informações fornecidas no cadastro (nome,
              e-mail e demais dados de perfil) devem ser verdadeiras e atualizadas. Contas não podem
              ser compartilhadas entre múltiplas pessoas.
            </p>
          </section>

          <section>
            <h2 className="text-fg font-semibold mb-2">3. Assinatura e pagamento</h2>
            <p>
              O acesso ao conteúdo completo da plataforma é feito por assinatura recorrente
              (mensal ou anual), processada através do Mercado Pago. A cobrança é renovada
              automaticamente ao final de cada ciclo, salvo cancelamento prévio pelo aluno. O
              cancelamento pode ser feito a qualquer momento e produz efeito ao término do período
              já pago — não há reembolso proporcional de período parcial, salvo disposição legal em
              contrário.
            </p>
          </section>

          <section>
            <h2 className="text-fg font-semibold mb-2">4. Conteúdo e propriedade intelectual</h2>
            <p>
              Todo o conteúdo disponibilizado (videoaulas, materiais, textos e demais recursos) é de
              propriedade do DespolarizaMed e protegido por direitos autorais. É proibido baixar,
              gravar, redistribuir, revender ou compartilhar publicamente qualquer conteúdo da
              plataforma, integral ou parcialmente, sem autorização expressa. O acesso é pessoal e
              intransferível, vinculado à assinatura ativa do aluno.
            </p>
          </section>

          <section>
            <h2 className="text-fg font-semibold mb-2">5. Conduta do usuário</h2>
            <p>
              É vedado o uso da plataforma para fins ilícitos, o envio de conteúdo ofensivo em áreas
              de interação (como comentários ou anotações compartilhadas, quando existirem), ou
              qualquer tentativa de burlar as medidas de proteção do conteúdo. O descumprimento pode
              resultar em suspensão ou cancelamento da conta, sem direito a reembolso.
            </p>
          </section>

          <section>
            <h2 className="text-fg font-semibold mb-2">6. Disponibilidade do serviço</h2>
            <p>
              Empregamos esforços razoáveis para manter a plataforma disponível, mas não garantimos
              operação ininterrupta ou livre de falhas. Manutenções, atualizações ou instabilidades
              de terceiros (provedores de vídeo, pagamento ou infraestrutura) podem causar
              indisponibilidade temporária.
            </p>
          </section>

          <section>
            <h2 className="text-fg font-semibold mb-2">7. Limitação de responsabilidade</h2>
            <p>
              O conteúdo oferecido tem finalidade educacional e não substitui orientação
              individualizada de professores, coordenadores pedagógicos ou instituições de ensino.
              O DespolarizaMed não garante aprovação em vestibulares ou exames de residência.
            </p>
          </section>

          <section>
            <h2 className="text-fg font-semibold mb-2">8. Alterações destes termos</h2>
            <p>
              Podemos atualizar estes Termos de Uso periodicamente. Alterações relevantes serão
              comunicadas por e-mail ou aviso na plataforma. O uso continuado após a alteração
              representa concordância com os novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-fg font-semibold mb-2">9. Contato</h2>
            <p>
              Dúvidas sobre estes termos podem ser enviadas pelos canais oficiais do DespolarizaMed
              no Instagram (@despolarizamed) ou pelo e-mail de suporte da plataforma.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
