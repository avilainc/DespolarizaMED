import nodemailer from "nodemailer";
const t = nodemailer.createTransport({
  host: "mail.avilaops.com", port: 587, secure: false, requireTLS: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
});
const r = await t.sendMail({
  from: "DespolarizaMED <noreply@despolarizamed.com.br>",
  to: process.env.PARA,
  subject: "Teste de autenticacao SPF/DKIM/DMARC",
  text: "Verificando se SPF, DKIM e DMARC passam depois da correcao.",
});
console.log("enviado:", r.messageId, "| aceitos:", r.accepted.length);
