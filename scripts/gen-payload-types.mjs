// `payload generate:types` fails standalone with ERR_REQUIRE_ASYNC_MODULE
// (same root cause as the migration CLI — see docs/roadmap.md "Bloqueios").
// This calls the underlying function directly instead.
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd(), true);

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const payloadEntry = require.resolve("payload"); // .../payload/dist/exports/default.js (or similar)
const generateTypesPath = payloadEntry.replace(/dist[\\/].*/, "dist/bin/generateTypes.js");
const { generateTypes } = await import(`file://${generateTypesPath}`);

// payload.config.ts already runs buildConfig(), which is already sanitized
// internally — calling sanitizeConfig() again duplicates Payload's own
// internal collections (payload-kv, etc.) and throws DuplicateCollection.
const config = await (await import("../src/payload/payload.config.ts")).default;

await generateTypes(config);

process.exit(0);
