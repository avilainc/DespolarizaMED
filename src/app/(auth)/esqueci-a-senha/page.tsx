import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = { title: "Esqueci a senha — DespolarizaMED" };

export default function EsqueciASenhaPage() {
  return <ForgotPasswordForm />;
}
