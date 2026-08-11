import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd(), true);

import { getPayload } from "payload";

const config = (await import("../src/payload/payload.config.ts")).default;

const payload = await getPayload({ config });

await payload.db.createMigration({
  forceAcceptWarning: true,
  migrationName: process.argv[2] ?? "unnamed",
  payload,
});

process.exit(0);
