/**
 * Configuración de variables de entorno públicas del frontend.
 *
 * La URL base del backend se lee exclusivamente desde `NEXT_PUBLIC_API_BASE_URL`
 * (definida en `.env.local` o en las variables del entorno de despliegue, tomando
 * como plantilla `.env.example`).
 */

function normalizeBaseUrl(rawUrl: string | undefined): string {
  const trimmed = rawUrl?.trim() ?? "";
  if (!trimmed) {
    return "";
  }
  return trimmed.replace(/\/+$/, "");
}

export const env = {
  /**
   * URL base del API del backend (p. ej. `http://localhost:3333/api/v1`).
   * Si no está definida en el entorno, permanece vacía para evitar URLs
   * de producción hardcodeadas.
   */
  get apiBaseUrl(): string {
    return normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
  },

  /**
   * Indica si la variable `NEXT_PUBLIC_API_BASE_URL` fue configurada en el entorno.
   */
  get isApiConfigured(): boolean {
    return this.apiBaseUrl.length > 0;
  },
} as const;

/**
 * Construye una URL completa hacia un endpoint del backend a partir de `NEXT_PUBLIC_API_BASE_URL`.
 *
 * @param path Ruta relativa del recurso (p. ej. `/readings` o `auth/login`).
 * @param query Parámetros query opcionales.
 */
export function buildApiUrl(
  path: string,
  query?: Record<string, string | number | boolean | undefined | null>,
): string {
  const baseUrl = env.apiBaseUrl;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const fullPath = baseUrl ? `${baseUrl}${cleanPath}` : cleanPath;

  if (!query) {
    return fullPath;
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `${fullPath}?${queryString}` : fullPath;
}
