import "server-only";

/**
 * Configuracion **de servidor** para el proxy hacia el backend.
 *
 * Este modulo NUNCA se importa desde un componente de cliente: la variable
 * `BACKEND_INTERNAL_URL` no lleva el prefijo `NEXT_PUBLIC_` a proposito, de
 * modo que Next.js no la compile en el bundle del navegador. El navegador
 * habla siempre con este mismo origen (`/api/v1/...`) y es el servidor de
 * Next.js quien resuelve la URL real del backend.
 */

const DEFAULT_BACKEND_INTERNAL_URL = "http://backend:3333/api/v1";

/**
 * Normaliza la URL base: quita la barra final y valida que sea http(s).
 */
function normalizeBaseUrl(raw: string | undefined): string {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) {
    return DEFAULT_BACKEND_INTERNAL_URL;
  }

  const withoutTrailingSlash = trimmed.replace(/\/+$/, "");

  let parsed: URL;
  try {
    parsed = new URL(withoutTrailingSlash);
  } catch {
    throw new Error(
      `BACKEND_INTERNAL_URL no es una URL valida: "${trimmed}". Debe ser algo como http://backend:3333/api/v1`,
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(
      `BACKEND_INTERNAL_URL debe usar http o https, no "${parsed.protocol}"`,
    );
  }

  return withoutTrailingSlash;
}

/**
 * URL base interna del backend, resoluta solo en el servidor.
 */
export const backendInternalUrl: string = normalizeBaseUrl(
  process.env.BACKEND_INTERNAL_URL,
);
