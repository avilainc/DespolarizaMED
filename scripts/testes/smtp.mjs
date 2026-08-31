import nodemailer from "nodemailer";
const t = nodemailer.createTransport({
  host: process.env.SMTP_HOST, port: 587, secure: false, requireTLS: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
});
console.log("verificando conexao e autenticacao...");
await t.verify();
console.log("  AUTH OK");
const r = await t.sendMail({
  from: "DespolarizaMED <noreply@despolarizamed.com.br>",
  to: "noreply@despolarizamed.com.br",
  subject: "Teste de envio, DespolarizaMED",
  text: "Se esta mensagem chegou, o SMTP do DespolarizaMED esta funcionando.",
});
console.log("  ENVIADO:", r.messageId, "| aceitos:", r.accepted.length);
