import { type AuthUser } from "@/lib";

/**
 * Calcula hasta dos iniciales en mayúsculas a partir del nombre completo o correo.
 */
export function getUserInitials(nameOrEmail: string): string {
  const clean = nameOrEmail.trim();
  if (!clean) {
    return "ER";
  }
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

/**
 * Resuelve los datos visuales resumidos de la tarjeta de cuenta en cabecera y drawer.
 */
export function getUserAccountSummary(
  user: AuthUser | null,
  fallbackLabel: string,
) {
  const displayName = user?.fullName?.trim() || user?.email || fallbackLabel;
  return {
    displayName,
    email: user?.email ?? "",
    initials: getUserInitials(displayName),
    isVerified: Boolean(user?.emailVerifiedAt),
  };
}
