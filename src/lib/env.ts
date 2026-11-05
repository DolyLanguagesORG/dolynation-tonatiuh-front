/**
 * Configuracion del frontend del lado del **navegador**.
 *
 * El frontend NO conoce la direccion del backend. Todas las peticiones van al
 * proxy de Next.js (`/api/v1/...`), que corre en el servidor y las reenvia a
 * `BACKEND_INTERNAL_URL` (variable de servidor, sin prefijo `NEXT_PUBLIC_`, por
 * lo que nunca se compila en el bundle del navegador).
 *
 * Ventaja: la URL y el puerto del backend no se filtran al cliente, y no hay
 * CORS ni preflight porque el navegador solo habla con un origen.
 */

/**
 * Prefijo publico bajo el que se expone el proxy. Coincide con el
 * `API_PREFIX` del backend (`api/v1`), de modo que la ruta publica es la
 * misma que la interna y no hay que traducir nada.
 */
export const API_BASE_PATH = "/api/v1";

export const env = {
  /**
   * Ruta base contra la que el cliente HTTP construye sus peticiones.
   * Es siempre relativa: nunca revela el host del backend.
   */
  get apiBaseUrl(): string {
    return API_BASE_PATH;
  },

  /**
   * El proxy siempre esta disponible: es este mismo origen, asi que no
   * depende de ninguna variable de entorno del cliente.
   */
  get isApiConfigured(): boolean {
    return true;
  },
} as const;

/**
 * Construye la URL de un endpoint del backend a traves del proxy.
 *
 * @param path Ruta relativa del recurso (p. ej. `/readings` o `auth/login`).
 * @param query Parametros query opcionales.
 */
export function buildApiUrl(
  path: string,
  query?: Record<string, string | number | boolean | undefined | null>,
): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const fullPath = `${API_BASE_PATH}${cleanPath}`;

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
