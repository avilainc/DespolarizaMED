// Popula a disciplina Biologia (módulos + aulas) via API REST do Payload,
// usando a estrutura descrita em docs/product-plan.md seção 4. Idempotente:
// pula qualquer subject/module/lesson cujo slug já exista.
//
// Uso: node scripts/seed-biologia.mjs <staff-email> <staff-password>
// (crie um usuário Staff/ADMIN antes, via /admin ou /api/staff/first-register)

const BASE_URL = process.env.SEED_BASE_URL ?? "http://localhost:3000";
const [, , email, password] = process.argv;

if (!email || !password) {
  console.error("Uso: node scripts/seed-biologia.mjs <staff-email> <staff-password>");
  process.exit(1);
}

async function login() {
  const res = await fetch(`${BASE_URL}/api/staff/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.token;
}

async function findBySlug(collection, slug, token) {
  const res = await fetch(
    `${BASE_URL}/api/${collection}?where[slug][equals]=${encodeURIComponent(slug)}`,
    { headers: { Authorization: `JWT ${token}` } },
  );
  const data = await res.json();
  return data.docs?.[0] ?? null;
}

async function createOrGet(collection, slug, body, token) {
  const existing = await findBySlug(collection, slug, token);
  if (existing) {
    console.log(`SKIP (já existe): ${collection}/${slug} (id: ${existing.id})`);
    return existing;
  }

  const res = await fetch(`${BASE_URL}/api/${collection}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `JWT ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (res.status !== 201) {
    throw new Error(`Failed to create ${collection}/${slug}: ${res.status} ${JSON.stringify(data)}`);
  }
  console.log(`OK: ${collection}/${slug} (id: ${data.doc.id})`);
  return data.doc;
}

const token = await login();

const subject = await createOrGet(
  "subjects",
  "biologia",
  {
    name: "Biologia",
    slug: "biologia",
    description: "Bioquímica, genética, citologia e ecologia com foco em vestibulares de Medicina.",
    order: 1,
  },
  token,
);

const module1 = await createOrGet(
  "modules",
  "bioquimica",
  { subject: subject.id, name: "Bioquímica", slug: "bioquimica", order: 1 },
  token,
);

const module2 = await createOrGet(
  "modules",
  "biologia-molecular",
  { subject: subject.id, name: "Biologia Molecular", slug: "biologia-molecular", order: 2 },
  token,
);

const lessons = [
  { module: module1.id, title: "Aula 01 — Bioquímica", slug: "aula-01-bioquimica", order: 1,
    description: "Introdução à bioquímica: composição molecular dos seres vivos e suas funções biológicas." },
  { module: module1.id, title: "Aula 02 — Carboidratos", slug: "aula-02-carboidratos", order: 2,
    description: "Estrutura, classificação e função dos carboidratos no metabolismo celular." },
  { module: module1.id, title: "Aula 03 — Lipídios", slug: "aula-03-lipidios", order: 3,
    description: "Lipídios: estrutura, tipos e seu papel em membranas e reserva energética." },
  { module: module1.id, title: "Aula 04 — Proteínas", slug: "aula-04-proteinas", order: 4,
    description: "Aminoácidos, estrutura proteica e função das proteínas nos organismos." },
  { module: module1.id, title: "Aula 05 — Vitaminas", slug: "aula-05-vitaminas", order: 5,
    description: "Vitaminas hidrossolúveis e lipossolúveis: funções e importância na dieta." },
  { module: module2.id, title: "Aula 06 — Ácido Nucleico", slug: "aula-06-acido-nucleico", order: 1,
    description: "DNA e RNA: estrutura, replicação e papel na hereditariedade." },
  { module: module2.id, title: "Aula 07 — Síntese Proteica", slug: "aula-07-sintese-proteica", order: 2,
    description: "Transcrição e tradução: como a informação genética vira proteína." },
  { module: module2.id, title: "Aula 08 — Célula e Organelas", slug: "aula-08-celula-e-organelas", order: 3,
    description: "Estrutura celular e função das principais organelas." },
  { module: module2.id, title: "Aula 09 — Membrana Plasmática e Transportes", slug: "aula-09-membrana-plasmatica-e-transportes", order: 4,
    description: "Estrutura da membrana plasmática e mecanismos de transporte celular." },
  { module: module2.id, title: "Aula 10 — Respiração Celular", slug: "aula-10-respiracao-celular", order: 5,
    description: "Glicólise, ciclo de Krebs e cadeia respiratória: como a célula produz energia." },
];

for (const lesson of lessons) {
  await createOrGet(
    "lessons",
    lesson.slug,
    {
      module: lesson.module,
      title: lesson.title,
      slug: lesson.slug,
      description: lesson.description,
      order: lesson.order,
      published: true,
    },
    token,
  );
}

console.log("Seed de Biologia concluído.");
