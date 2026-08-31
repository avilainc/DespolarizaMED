import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasRole, type UserRole } from "@/lib/auth/rbac";

export async function requireSessionWithRole(minRole: UserRole) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const role = (session.user as { role?: UserRole }).role ?? "STUDENT";
  if (!hasRole(role, minRole)) {
    redirect("/dashboard");
  }

  return { session, role };
}
