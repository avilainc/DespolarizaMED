import Link from 'next/link'

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-app px-4 sm:px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-muted hover:text-fg text-sm transition">← Voltar</Link>
        <h1 className="text-2xl font-bold text-fg mt-4 mb-1">Política de Privacidade</h1>
        <p className="text-faint text-xs mb-8">Última atualização: 14 de setembro de 2026</p>

        <div className="space-y-6 text-sm text-muted leading-relaxed">
          <section>
            <p>
              Esta política explica como o DespolarizaMed coleta, usa e protege seus dados
              pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 —
              LGPD).
            </p>
          </section>

          <section>
            <h2 className="text-fg font-semibold mb-2">1. Dados que coletamos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-fg">Cadastro:</strong> nome e e-mail.</li>
              <li><strong className="text-fg">Perfil (opcionais):</strong> foto, se você estuda em escola ou cursinho e há quantos anos.</li>
              <li><strong className="text-fg">Uso da plataforma:</strong> progresso nas aulas, respostas do desafio diário, XP, provas cadastradas e anotações que você mesmo insere no calendário.</li>
              <li><strong className="text-fg">Pagamento:</strong> processado inteiramente pelo Mercado Pago — não armazenamos dados de cartão ou de pagamento em nossos servidores.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-fg font-semibold mb-2">2. Para que usamos esses dados</h2>
            <p>
              Usamos seus dados para: viabilizar seu acesso e progresso na plataforma, personalizar
              sua experiência (como o desafio diário e o acompanhamento de desempenho), processar
              sua assinatura, e enviar comunicações relevantes sobre sua conta ou novidades do
              DespolarizaMed. Não vendemos seus dados a terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-fg font-semibold mb-2">3. Com quem compartilhamos</h2>
            <p>
              Seus dados podem ser processados pelos seguintes prestadores de serviço, estritamente
              para operar a plataforma:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong className="text-fg">Supabase</strong> — hospedagem do banco de dados e autenticação.</li>
              <li><strong className="text-fg">Mercado Pago</strong> — processamento de pagamentos e assinaturas.</li>
              <li>Provedor de streaming de vídeo utilizado para entrega das aulas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-fg font-semibold mb-2">4. Seus direitos (LGPD)</h2>
            <p>Você pode, a qualquer momento:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Acessar os dados que temos sobre você;</li>
              <li>Corrigir dados incompletos ou desatualizados (editável em Configurações);</li>
              <li>Solicitar a exclusão da sua conta e dos dados associados;</li>
              <li>Revogar consentimentos e solicitar a portabilidade dos seus dados.</li>
            </ul>
            <p className="mt-2">
              Para exercer esses direitos, entre em contato pelos canais oficiais do DespolarizaMed.
            </p>
          </section>

          <section>
            <h2 className="text-fg font-semibold mb-2">5. Segurança</h2>
            <p>
              Adotamos medidas técnicas razoáveis para proteger seus dados, incluindo controle de
              acesso por autenticação e regras de segurança em nível de linha no banco de dados
              (Row Level Security), que garantem que cada aluno só acessa os próprios dados.
            </p>
          </section>

          <section>
            <h2 className="text-fg font-semibold mb-2">6. Retenção de dados</h2>
            <p>
              Mantemos seus dados enquanto sua conta estiver ativa ou enquanto necessário para
              cumprir obrigações legais. Ao solicitar exclusão de conta, seus dados pessoais são
              removidos, ressalvado o que a lei exigir que seja mantido (como registros fiscais de
              pagamento).
            </p>
          </section>

          <section>
            <h2 className="text-fg font-semibold mb-2">7. Alterações desta política</h2>
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente. Mudanças relevantes
              serão comunicadas pelos canais da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-fg font-semibold mb-2">8. Contato</h2>
            <p>
              Dúvidas sobre esta política ou sobre seus dados podem ser enviadas pelos canais
              oficiais do DespolarizaMed no Instagram (@despolarizamed).
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
