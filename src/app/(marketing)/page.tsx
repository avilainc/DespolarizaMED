import { Hero } from "@/features/marketing/components/hero";
import { SubjectsSection } from "@/features/marketing/components/subjects-section";
import { TeachersSection } from "@/features/marketing/components/teachers-section";
import { PlansSection } from "@/features/marketing/components/plans-section";
import { TestimonialsSection } from "@/features/marketing/components/testimonials-section";
import { FaqSection } from "@/features/marketing/components/faq-section";
import { CtaSection } from "@/features/marketing/components/cta-section";

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
