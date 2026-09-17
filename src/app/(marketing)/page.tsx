import { Hero } from "@/features/marketing/components/hero";
import { SubjectsSection } from "@/features/marketing/components/subjects-section";
import { TeachersSection } from "@/features/marketing/components/teachers-section";
import { PlansSection } from "@/features/marketing/components/plans-section";
import { TestimonialsSection } from "@/features/marketing/components/testimonials-section";
import { FaqSection } from "@/features/marketing/components/faq-section";
import { CtaSection } from "@/features/marketing/components/cta-section";

/**
 * A landing passou a ler os preços da tabela `plans` (antes eram constantes que
 * divergiam do que o checkout cobra). Isso a tornaria dinâmica, e ela é a
 * página de maior tráfego — perder o cache de CDN aqui custaria caro.
 *
 * ISR resolve os dois lados: a página continua sendo servida do cache, e preço
 * alterado no banco aparece em até 5 minutos sem deploy. Preço muda raramente;
 * 5 minutos de defasagem é aceitável, ler o banco a cada visita não é.
 */
export const revalidate = 300;

export default function Home() {
  return (
    <>
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
