import type { Metadata } from "next";
import { SignupForm } from "@/features/auth/components/signup-form";

export const metadata: Metadata = {
  title: "Criar conta — DespolarizaMED",
};

export default function CadastroPage() {
  return <SignupForm />;
}
