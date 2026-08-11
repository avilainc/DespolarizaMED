import { Card, CardContent } from "@/components/ui/card";
import { testimonials } from "@/features/marketing/content";
import { Quote } from "lucide-react";

export function TestimonialsSection() {
  return (
    <section className="bg-secondary/30 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Quem estuda com a gente
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="border-none bg-card shadow-sm">
              <CardContent className="pt-6">
                <Quote className="size-6 text-primary/50" />
                <p className="mt-4 text-sm text-foreground">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="mt-4 border-t pt-4">
                  <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-xs text-primary">{testimonial.result}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
