export type UserRole = "ADMIN" | "TEACHER" | "STUDENT";

const ROLE_HIERARCHY: Record<UserRole, number> = {
  STUDENT: 0,
  TEACHER: 1,
  ADMIN: 2,
};

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function requireRole(userRole: UserRole | undefined, requiredRole: UserRole): void {
  if (!userRole || !hasRole(userRole, requiredRole)) {
    throw new Error(`Forbidden: requires role ${requiredRole}, got ${userRole ?? "none"}`);
  }
}
