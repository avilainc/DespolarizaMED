import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd(), true);

import { getPayload } from "payload";

const config = (await import("../src/payload/payload.config.ts")).default;

const payload = await getPayload({ config });

await payload.db.migrate();

process.exit(0);
