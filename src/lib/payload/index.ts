import { getPayload } from "payload";
import config from "@payload-config";

// Cached across requests in the same server process. Payload's own
// getPayload() already memoizes by config, so this just gives call sites
// a single import path instead of repeating the config import everywhere.
export async function getPayloadClient() {
  return getPayload({ config });
}
