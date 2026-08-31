import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { enviarEmail, moldeEmail } from "@/lib/email";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // Verificação não bloqueia o login: o aluno que acabou de pagar precisa
    // entrar agora, e um e-mail preso no spam viraria um chamado de suporte.
    // O aviso "não verificado" aparece na gestão de usuários.
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await enviarEmail({
        para: user.email,
        assunto: "Redefinir sua senha",
        texto: `Para criar uma nova senha, acesse: ${url}`,
        html: moldeEmail({
          titulo: "Redefinir sua senha",
          corpo: "Recebemos um pedido para trocar a senha da sua conta. O link vale por uma hora.",
          botao: { texto: "Criar nova senha", url },
        }),
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await enviarEmail({
        para: user.email,
        assunto: "Confirme seu e-mail",
        texto: `Confirme seu e-mail acessando: ${url}`,
        html: moldeEmail({
          titulo: `Boas-vindas, ${user.name.split(" ")[0]}`,
          corpo: "Confirme seu e-mail para garantir que você receba avisos de plantão, novas aulas e recibos de pagamento.",
          botao: { texto: "Confirmar e-mail", url },
        }),
      });
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "STUDENT",
        input: false,
      },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  // Next dev falls back to 3001/3002/... whenever port 3000 is already
  // taken by another project on this machine, so BETTER_AUTH_URL alone
  // (fixed at :3000) isn't enough — trust the common dev ports too.
  trustedOrigins:
    process.env.NODE_ENV === "production"
      ? undefined
      : Array.from({ length: 10 }, (_, i) => `http://localhost:${3000 + i}`),
});

export type Session = typeof auth.$Infer.Session;
