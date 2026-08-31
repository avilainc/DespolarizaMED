import nodemailer from "nodemailer";

/**
 * Envio de e-mail pelo mail.avilaops.com, o MTA da casa.
 *
 * Não usamos serviço de terceiro: o padrão da Ávila Ops manda o provedor sair
 * do catálogo próprio, e o remetente é `noreply@despolarizamed.com.br`, com
 * SPF, DKIM e DMARC publicados na zona do domínio. E-mail saindo por outro
 * domínio cairia em spam por conta do `-all` do SPF.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "mail.avilaops.com",
  port: Number(process.env.SMTP_PORT ?? 587),
  // 587 é submission com STARTTLS: começa em claro e sobe para TLS.
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASSWORD!,
  },
});

const REMETENTE = process.env.MAIL_FROM ?? "DespolarizaMED <noreply@despolarizamed.com.br>";

export async function enviarEmail(input: {
  para: string;
  assunto: string;
  html: string;
  texto: string;
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    // Em dev sem credencial o e-mail vai para o log em vez de estourar: o
    // cadastro continua funcionando, e quem estiver testando vê o link.
    console.warn(`[email] sem SMTP configurado; ${input.assunto} para ${input.para}`);
    console.warn(`[email] ${input.texto}`);
    return;
  }

  await transporter.sendMail({
    from: REMETENTE,
    to: input.para,
    subject: input.assunto,
    text: input.texto,
    html: input.html,
  });
}

/**
 * Molde único das mensagens transacionais.
 *
 * HTML de e-mail é o lugar onde CSS moderno não funciona: cliente de e-mail
 * ignora flex, grid e boa parte de `<style>`. Tabela e atributo inline é o que
 * chega igual no Gmail, no Outlook e no app do iPhone.
 */
/**
 * URL absoluta do emblema. E-mail não tem origem: caminho relativo não
 * resolve em cliente nenhum, então a imagem precisa vir de um endereço
 * público completo.
 */
const LOGO = `${process.env.BETTER_AUTH_URL ?? "https://despolarizamed.com.br"}/logo.png`;

export function moldeEmail(input: { titulo: string; corpo: string; botao?: { texto: string; url: string } }) {
  const botao = input.botao
    ? `<tr><td style="padding:24px 0">
         <a href="${input.botao.url}"
            style="background:#0f172a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;display:inline-block;font-weight:600">
           ${input.botao.texto}
         </a>
       </td></tr>
       <tr><td style="color:#64748b;font-size:13px;line-height:1.6">
         Se o botão não funcionar, copie este endereço:<br>
         <span style="color:#334155;word-break:break-all">${input.botao.url}</span>
       </td></tr>`
    : "";

  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:12px;padding:32px">
        <tr><td style="padding-bottom:14px">
          <img src="${LOGO}" width="44" height="44" alt=""
               style="display:block;border:0">
        </td></tr>
        <tr><td style="font-size:20px;font-weight:700;color:#0f172a;padding-bottom:8px">DespolarizaMED</td></tr>
        <tr><td style="font-size:17px;font-weight:600;color:#0f172a;padding-bottom:12px">${input.titulo}</td></tr>
        <tr><td style="color:#475569;font-size:15px;line-height:1.6">${input.corpo}</td></tr>
        ${botao}
        <tr><td style="border-top:1px solid #e2e8f0;padding-top:20px;color:#94a3b8;font-size:12px;line-height:1.5">
          Você recebeu este e-mail porque tem uma conta no DespolarizaMED.
          Se não foi você, ignore esta mensagem.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
