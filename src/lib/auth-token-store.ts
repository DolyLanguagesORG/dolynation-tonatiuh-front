/**
 * Almacén en memoria para tokens de sesión.
 *
 * Regla de seguridad (front#3 / RNF-02):
 * El `accessToken` vive exclusivamente en memoria del proceso JS (y en el
 * estado de React de `AuthProvider`). Jamás se persiste en `localStorage`
 * ni `sessionStorage`.
 */

export interface TokenPair {
  accessToken: string | null;
  refreshToken?: string | null;
}

type RefreshHandler = () => Promise<string | null>;
type UnauthorizedHandler = () => void;

let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;
let refreshHandler: RefreshHandler | null = null;
let unauthorizedHandler: UnauthorizedHandler | null = null;
let activeRefreshPromise: Promise<string | null> | null = null;

/**
 * Obtiene el `accessToken` actual desde la memoria.
 */
export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

/**
 * Obtiene el `refreshToken` actual desde la memoria (respaldo del cookie HttpOnly del BFF).
 */
export function getRefreshToken(): string | null {
  return inMemoryRefreshToken;
}

/**
 * Actualiza los tokens activos en memoria.
 */
export function setAuthTokens(tokens: TokenPair): void {
  inMemoryAccessToken = tokens.accessToken;
  if (tokens.refreshToken !== undefined) {
    inMemoryRefreshToken = tokens.refreshToken;
  }
}

/**
 * Limpia por completo los tokens en memoria.
 */
export function clearAuthTokens(): void {
  inMemoryAccessToken = null;
  inMemoryRefreshToken = null;
}

/**
 * Registra callbacks del contexto de sesión para renovar el token ante un 401
 * o limpiar la sesión y redirigir a `/login` si el refresh falla.
 */
export function registerAuthLifecycleHandlers(handlers: {
  onRefresh: RefreshHandler | null;
  onUnauthorized: UnauthorizedHandler | null;
}): void {
  refreshHandler = handlers.onRefresh;
  unauthorizedHandler = handlers.onUnauthorized;
}

/**
 * Ejecuta el refresh una sola vez aunque concurran múltiples peticiones con 401
 * (patrón single-flight).
 */
export async function executeSingleFlightRefresh(): Promise<string | null> {
  if (!refreshHandler) {
    return null;
  }

  if (!activeRefreshPromise) {
    activeRefreshPromise = refreshHandler().finally(() => {
      activeRefreshPromise = null;
    });
  }

  return activeRefreshPromise;
}

/**
 * Notifica al proveedor de sesión que la renovación tras un 401 falló
 * y debe limpiarse el estado y redirigir a `/login`.
 */
export function notifySessionUnauthorized(): void {
  clearAuthTokens();
  unauthorizedHandler?.();
}
