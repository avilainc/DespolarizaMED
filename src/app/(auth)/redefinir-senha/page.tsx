import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = { title: "Nova senha — DespolarizaMED" };

// useSearchParams precisa de Suspense: sem ele a página inteira vira dinâmica
// e o build reclama.
export default function RedefinirSenhaPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
