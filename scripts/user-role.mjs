/**
 * Promove ou rebaixa uma conta: pnpm user:role <email> <ADMIN|TEACHER|STUDENT>
 *
 * Existe porque `role` é `input: false` no Better Auth (ninguém escolhe o
 * próprio papel no cadastro, que é o correto), e sem isto não haveria como
 * criar o primeiro ADMIN: a tela /gestao ficaria inacessível para todo mundo,
 * inclusive para quem a construiu.
 *
 * Depois do primeiro ADMIN, o caminho normal é a tela de usuários; este script
 * fica como saída de emergência (perder o acesso admin) e para automação.
 */
import postgres from "postgres";

const PAPEIS = ["ADMIN", "TEACHER", "STUDENT"];
const [email, papel] = process.argv.slice(2);

if (!email || !papel) {
  console.error("uso: pnpm user:role <email> <ADMIN|TEACHER|STUDENT>");
  process.exit(1);
}

if (!PAPEIS.includes(papel)) {
  console.error(`papel inválido: ${papel} (use ${PAPEIS.join(", ")})`);
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL não definida");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

try {
  const [antes] = await sql`select id, name, role from users where email = ${email}`;

  if (!antes) {
    console.error(`nenhuma conta com e-mail ${email}`);
    process.exit(1);
  }

  if (antes.role === papel) {
    console.log(`${email} já é ${papel}, nada a fazer`);
    process.exit(0);
  }

  await sql`update users set role = ${papel}, updated_at = now() where email = ${email}`;
  console.log(`${email} (${antes.name}): ${antes.role} -> ${papel}`);

  // Um rebaixamento que deixa a plataforma sem nenhum ADMIN tranca a tela de
  // gestão para todo mundo, e a única saída seria rodar este script de novo.
  // Avisar é mais útil do que impedir: pode ser exatamente o que se quis fazer.
  if (antes.role === "ADMIN" && papel !== "ADMIN") {
    const [{ count }] = await sql`select count(*)::int from users where role = 'ADMIN'`;
    if (count === 0) {
      console.warn("atenção: não há mais nenhum ADMIN; /gestao ficou inacessível pela interface");
    }
  }
} finally {
  await sql.end();
}
