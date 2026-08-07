// KNOWN BLOCKER (2026-08-07): tables for the collections below are NOT yet
// created in Postgres. Two separate issues were found and only the first is
// fixed — see docs/roadmap.md "Bloqueios" for full details and next steps:
//  1. [FIXED by downgrading Next 16->15] payload/dist/bin/loadEnv.js's default
//     import of @next/env threw at runtime under Next 16.
//  2. [STILL OPEN] Payload's dev-mode schema push (triggered by visiting
//     /admin) always calls drizzle-kit's pushSchema, which requires a real
//     TTY to prompt — it fails non-interactively even with an empty/no-op
//     diff. `payload migrate:create` also fails standalone (ERR_REQUIRE_ASYNC_MODULE,
//     a tsx/Node ESM-CJS interop issue unrelated to this app's code). Needs a
//     real interactive terminal (not this harness) to run once, OR the
//     migration files can be generated on a machine/shell with a real TTY and
//     committed under src/payload/migrations.
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
  }),
  typescript: {
    outputFile: "src/payload/payload-types.ts",
  },
});
