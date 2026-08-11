// Dev-mode auto schema push is disabled via PAYLOAD_DISABLE_PUSH (set in
// .env.local/.env.example) — it requires an interactive TTY prompt that
// breaks non-interactive shells. Use `pnpm payload:migrate:create` /
// `pnpm payload:migrate` instead. See docs/roadmap.md "Bloqueios" for the
// full diagnosis and why those scripts exist.
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";

import { Staff } from "./collections/Staff";
import { Media } from "./collections/Media";
import { Subjects } from "./collections/Subjects";
import { Modules } from "./collections/Modules";
import { Lessons } from "./collections/Lessons";
import { LessonMaterials } from "./collections/LessonMaterials";
import { Captions } from "./collections/Captions";
import { Transcripts } from "./collections/Transcripts";
import { GlossaryTerms } from "./collections/GlossaryTerms";

export default buildConfig({
  admin: {
    user: Staff.slug,
  },
  collections: [
    Staff,
    Media,
    Subjects,
    Modules,
    Lessons,
    LessonMaterials,
    Captions,
    Transcripts,
    GlossaryTerms,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET ?? "",
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
    push: process.env.PAYLOAD_DISABLE_PUSH === "true" ? false : undefined,
  }),
  typescript: {
    outputFile: "src/payload/payload-types.ts",
  },
});
