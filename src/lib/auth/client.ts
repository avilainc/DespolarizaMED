import { createAuthClient } from "better-auth/react";

// No explicit baseURL: Better Auth infers it from window.location when the
// client and server run on the same origin (true for this app).
export const authClient = createAuthClient();
