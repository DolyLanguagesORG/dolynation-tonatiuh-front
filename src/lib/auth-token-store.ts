/**
 * Coordinación de ciclo de vida de sesión en el cliente.
 *
 * Seguridad BFF (HttpOnly cookies):
 * Ni el `accessToken` ni el `refreshToken` se guardan en `localStorage`,
 * `sessionStorage` ni memoria JavaScript del navegador. El proxy `/api/v1/*`
 * gestiona ambos tokens en cookies `HttpOnly` inaccesibles a JS/XSS.
 *
 * Este módulo conserva únicamente la coordinación single-flight de recuperación
 * ante 401 y la notificación al proveedor React si la sesión expiró definitivamente.
 */

type RefreshHandler = () => Promise<boolean>;
type UnauthorizedHandler = () => void;

let refreshHandler: RefreshHandler | null = null;
let unauthorizedHandler: UnauthorizedHandler | null = null;
let activeRefreshPromise: Promise<boolean> | null = null;

/**
 * Registra callbacks del contexto de sesión para renovar vía BFF ante un 401
 * o limpiar la sesión y redirigir a `/login` si la renovación falla.
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
export async function executeSingleFlightRefresh(): Promise<boolean> {
  if (!refreshHandler) {
    return false;
  }

  if (!activeRefreshPromise) {
    activeRefreshPromise = refreshHandler().finally(() => {
      activeRefreshPromise = null;
    });
  }

  return activeRefreshPromise;
}

/**
 * Notifica al proveedor de sesión que la sesión expiró definitivamente
 * y debe limpiarse el estado local y redirigir a `/login`.
 */
export function notifySessionUnauthorized(): void {
  unauthorizedHandler?.();
}
