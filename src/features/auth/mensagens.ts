/**
 * Erros do Better Auth em português.
 *
 * Os formulários renderizavam `error.message` cru, e o Better Auth responde em
 * inglês: errar a senha devolvia "Invalid email or password", senha curta
 * devolvia "Password too short". O usuário está num site inteiro em português,
 * no momento em que já está frustrado, e recebe inglês.
 *
 * O mapa é por `code`, não pelo texto: o código é estável entre versões, a
 * mensagem não. Código desconhecido cai num texto genérico em vez de vazar o
 * original — mensagem de erro de auth não deve ser detalhada, e uma frase em
 * inglês no meio da tela é pior que uma frase útil e vaga.
 */

const POR_CODIGO: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou senha incorretos.",
  INVALID_EMAIL: "Confira o e-mail digitado.",
  INVALID_PASSWORD: "E-mail ou senha incorretos.",
  USER_NOT_FOUND: "E-mail ou senha incorretos.",
  USER_ALREADY_EXISTS: "Já existe uma conta com este e-mail. Tente entrar.",
  EMAIL_CAN_NOT_BE_UPDATED: "Não é possível alterar este e-mail.",
  PASSWORD_TOO_SHORT: "A senha precisa ter pelo menos 8 caracteres.",
  PASSWORD_TOO_LONG: "A senha é longa demais.",
  INVALID_TOKEN: "Este link expirou ou já foi usado. Peça um novo.",
  TOKEN_EXPIRED: "Este link expirou. Peça um novo.",
  SESSION_EXPIRED: "Sua sessão expirou. Entre novamente.",
  FAILED_TO_CREATE_USER: "Não foi possível criar sua conta. Tente novamente.",
  EMAIL_NOT_VERIFIED: "Confirme seu e-mail para continuar.",
  TOO_MANY_REQUESTS: "Muitas tentativas seguidas. Aguarde um instante e tente de novo.",
};

/**
 * `USER_NOT_FOUND` e `INVALID_PASSWORD` respondem a mesma coisa de propósito:
 * distinguir "não existe conta" de "senha errada" diria a um estranho quais
 * e-mails estão cadastrados aqui.
 */
export function mensagemDeErro(
  erro: { code?: string; message?: string } | null | undefined,
  padrao = "Não foi possível concluir. Tente novamente.",
): string {
  if (!erro) return padrao;
  if (erro.code && POR_CODIGO[erro.code]) return POR_CODIGO[erro.code];
  return padrao;
}
