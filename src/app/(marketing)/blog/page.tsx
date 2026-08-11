import type { Metadata } from "next";
import { Newspaper } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog — DespolarizaMED",
  description: "Conteúdo sobre estudos, vestibulares e preparação para Medicina.",
};

export default function BlogPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <Newspaper className="size-8" />
      </div>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
        O blog está a caminho
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Em breve, conteúdo sobre estratégias de estudo, dicas de vestibular e novidades do
        DespolarizaMED. Enquanto isso, acompanhe as aulas gratuitas no nosso{" "}
        <a
          href="https://youtube.com/@despolarizamed"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary underline underline-offset-4"
        >
          YouTube
        </a>
        .
      </p>
    </div>
  );
}
