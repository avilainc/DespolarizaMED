import { faqs } from "@/features/marketing/content";
import { SITE_URL } from "@/lib/site";

/**
 * JSON-LD da home: `Organization` e `FAQPage`.
 *
 * O FAQ já existe na página em HTML; o schema apenas diz ao buscador que
 * aquilo é pergunta e resposta, o que habilita o resultado expandido. As
 * perguntas vêm da MESMA constante que a seção visível renderiza — duplicar o
 * texto aqui criaria a chance de o schema afirmar uma coisa e a página mostrar
 * outra, que é exatamente o que os buscadores penalizam.
 *
 * Não declara `Product`/`Offer` com preço: o preço vem do banco e muda sem
 * deploy, e um schema de oferta desatualizado é pior que nenhum.
 */
export function DadosEstruturados() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "DespolarizaMED",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      "Plataforma de preparação para vestibulares de Medicina: aulas, banco de questões, provas antigas e plantões ao vivo.",
    sameAs: [
      "https://instagram.com/despolarizamed",
      "https://youtube.com/@despolarizamed",
    ],
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // O conteúdo é nosso e estático (constantes do próprio módulo), não
        // entrada de usuário. JSON.stringify já escapa o que precisa.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      />
    </>
  );
}
