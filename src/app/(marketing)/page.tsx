import { Hero } from "@/features/marketing/components/hero";
import { SubjectsSection } from "@/features/marketing/components/subjects-section";
import { TeachersSection } from "@/features/marketing/components/teachers-section";
import { PlansSection } from "@/features/marketing/components/plans-section";
import { TestimonialsSection } from "@/features/marketing/components/testimonials-section";
import { FaqSection } from "@/features/marketing/components/faq-section";
import { CtaSection } from "@/features/marketing/components/cta-section";
import { DadosEstruturados } from "@/features/marketing/components/dados-estruturados";

/**
 * A landing lê os preços da tabela `plans` (antes eram constantes que
 * divergiam do que o checkout cobra), e por isso NÃO pode ser pré-renderizada.
 *
 * O Dockerfile compila de propósito sem acesso a banco
 * (`DATABASE_URL=...@127.0.0.1:1/build`, ver commit "separar configuracao de
 * compilacao das credenciais de producao"): a imagem não deve carregar
 * credencial de produção. Qualquer página gerada no build que consulte o
 * Postgres quebra a compilação — foi o que aconteceu ao tentar ISR aqui
 * (`Error occurred prerendering page "/"`), e o erro só aparece no build do
 * CI, nunca em `pnpm build` local com banco no ar.
 *
 * Então a página é dinâmica e quem segura a carga é o cache de dados: a
 * consulta em `plans-section.tsx` passa por `unstable_cache` com 5 minutos, e
 * o Postgres é consultado no máximo uma vez a cada 5 min, não a cada visita.
 * A alternativa (ISR com leitura tolerante a falha) faria o build produzir uma
 * home sem preço, servida por até 5 minutos depois de cada deploy.
 */
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <DadosEstruturados />
      <Hero />
      <SubjectsSection />
      <TeachersSection />
      <PlansSection />
      <TestimonialsSection />
      <FaqSection />
      <CtaSection />
    </>
  );
}
