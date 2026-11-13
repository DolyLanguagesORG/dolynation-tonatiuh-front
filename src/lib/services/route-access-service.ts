/**
 * Servicio centralizado y extensible de políticas de acceso por estado de cuenta.
 *
 * Controla qué rutas puede visitar el usuario según la fase de su onboarding:
 * 1. `unverified_email`: solo puede permanecer en `/verify-email` hasta confirmar correo.
 * 2. `plan_required`: una vez confirmado su correo y sin suscripción, SOLO puede acceder
 *    a las rutas declaradas en `ROUTES_ALLOWED_WITHOUT_PLAN` (`/select-plan` por defecto).
 * 3. `ready`: ya cuenta con plan; puede navegar por el sistema (aunque generar lecturas
 *    se valida aparte según categorías mínimas e idiomas).
 * 4. `unauthenticated`: solo puede acceder a rutas públicas (`PUBLIC_ROUTES`).
 *
 * Para agregar en el futuro otra vista accesible sin haber elegido plan, añade una línea
 * en `ROUTES_ALLOWED_WITHOUT_PLAN` o pasa una lista extendida a `createRouteAccessPolicy()`.
 */

export type AccountAccessPhase =
  | "loading"
  | "unauthenticated"
  | "unverified_email"
  | "plan_required"
  | "ready";

export interface RoutePolicyEntry {
  path: string;
  match: "exact" | "prefix";
}

export interface RouteAccessContext {
  pathname: string;
  phase: AccountAccessPhase;
  hasVerifyToken?: boolean;
}

export type RouteAccessReason =
  | "allowed"
  | "loading"
  | "email_verification_required"
  | "subscription_plan_required"
  | "authentication_required"
  | "already_authenticated";

export interface RouteAccessDecision {
  allowed: boolean;
  redirectTo: string | null;
  reason: RouteAccessReason;
}

export const ROUTE_VERIFY_EMAIL = "/verify-email";
export const ROUTE_SELECT_PLAN = "/select-plan";
export const ROUTE_SETUP_PREFERENCES = "/setup-preferences";

/**
 * Únicas rutas accesibles mientras el usuario no haya confirmado su correo electrónico.
 */
export const ROUTES_ALLOWED_WHEN_UNVERIFIED_EMAIL: readonly RoutePolicyEntry[] =
  [{ path: ROUTE_VERIFY_EMAIL, match: "exact" }];

/**
 * Únicas rutas accesibles cuando el usuario ya confirmó su correo pero aún no
 * selecciona un plan de suscripción.
 *
 * Extensibilidad: agrega aquí cualquier nueva vista que deba ser accesible antes de
 * elegir plan (por ejemplo `{ path: "/billing-help", match: "prefix" }`).
 */
export const ROUTES_ALLOWED_WITHOUT_PLAN: readonly RoutePolicyEntry[] = [
  { path: ROUTE_SELECT_PLAN, match: "exact" },
];

/**
 * Rutas públicas accesibles sin sesión activa.
 */
export const PUBLIC_ROUTES: readonly RoutePolicyEntry[] = [
  { path: "/login", match: "exact" },
  { path: "/register", match: "exact" },
  { path: ROUTE_VERIFY_EMAIL, match: "exact" },
  { path: "/forgot-password", match: "exact" },
  { path: "/reset-password", match: "exact" },
  { path: "/terms", match: "exact" },
  { path: "/privacy", match: "exact" },
  { path: "/support", match: "exact" },
  { path: "/design-system", match: "exact" },
];

/**
 * Rutas públicas informativas accesibles en cualquier fase sin expulsar al usuario.
 */
export const INFORMATIONAL_ROUTES: readonly RoutePolicyEntry[] = [
  { path: "/terms", match: "exact" },
  { path: "/privacy", match: "exact" },
  { path: "/support", match: "exact" },
  { path: "/design-system", match: "exact" },
];

/**
 * Rutas que pueden renderizarse de inmediato durante hidratación de sesión.
 */
export const LOADING_PASS_THROUGH_ROUTES: readonly RoutePolicyEntry[] = [
  { path: "/login", match: "exact" },
  { path: "/register", match: "exact" },
  { path: ROUTE_VERIFY_EMAIL, match: "exact" },
  { path: "/forgot-password", match: "exact" },
  { path: "/reset-password", match: "exact" },
  ...INFORMATIONAL_ROUTES,
];

/**
 * Rutas exclusivas para usuarios sin suscripción activa o sin sesión.
 */
export const ONBOARDING_AUTH_ONLY_ROUTES: readonly RoutePolicyEntry[] = [
  { path: "/login", match: "exact" },
  { path: "/register", match: "exact" },
  { path: "/forgot-password", match: "exact" },
  { path: ROUTE_SELECT_PLAN, match: "exact" },
];

/**
 * Rutas de presentación sin barra lateral (onboarding, autenticación y vistas informativas/UI).
 */
export const MINIMAL_SHELL_ROUTES: readonly RoutePolicyEntry[] = [
  { path: "/login", match: "exact" },
  { path: "/register", match: "exact" },
  { path: ROUTE_VERIFY_EMAIL, match: "exact" },
  { path: "/forgot-password", match: "exact" },
  { path: "/reset-password", match: "exact" },
  { path: ROUTE_SELECT_PLAN, match: "exact" },
  { path: ROUTE_SETUP_PREFERENCES, match: "exact" },
  ...INFORMATIONAL_ROUTES,
];

export function normalizeRoutePath(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "/";
  }
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function matchesRoutePolicy(
  pathname: string,
  entries: readonly RoutePolicyEntry[],
): boolean {
  const normalized = normalizeRoutePath(pathname);
  return entries.some((entry) => {
    const base = normalizeRoutePath(entry.path);
    if (entry.match === "exact") {
      return normalized === base;
    }
    return normalized === base || normalized.startsWith(`${base}/`);
  });
}

export interface RouteAccessPolicyConfig {
  routesAllowedWithoutPlan?: readonly RoutePolicyEntry[];
  routesAllowedWhenUnverifiedEmail?: readonly RoutePolicyEntry[];
  publicRoutes?: readonly RoutePolicyEntry[];
}

/**
 * Construye una instancia configurable del evaluador de políticas de acceso por ruta.
 */
export function createRouteAccessPolicy(config: RouteAccessPolicyConfig = {}) {
  const withoutPlan =
    config.routesAllowedWithoutPlan ?? ROUTES_ALLOWED_WITHOUT_PLAN;
  const unverifiedEmail =
    config.routesAllowedWhenUnverifiedEmail ??
    ROUTES_ALLOWED_WHEN_UNVERIFIED_EMAIL;
  const publicRoutes = config.publicRoutes ?? PUBLIC_ROUTES;

  const fallbackPlanRoute = withoutPlan[0]?.path ?? ROUTE_SELECT_PLAN;
  const fallbackVerifyRoute = unverifiedEmail[0]?.path ?? ROUTE_VERIFY_EMAIL;

  return {
    getAllowedRoutesWithoutPlan(): readonly RoutePolicyEntry[] {
      return withoutPlan;
    },

    isRouteAllowedWithoutPlan(pathname: string): boolean {
      return matchesRoutePolicy(pathname, withoutPlan);
    },

    isMinimalShellRoute(pathname: string, phase: AccountAccessPhase): boolean {
      if (phase === "unverified_email" || phase === "plan_required") {
        return true;
      }
      return matchesRoutePolicy(pathname, MINIMAL_SHELL_ROUTES);
    },

    /**
     * Determina si la ruta pertenece al flujo limpio de login/registro/onboarding
     * donde se oculta la barra superior global (manteniéndola en la app y páginas informativas).
     */
    isHeaderlessAuthRoute(pathname: string, phase: AccountAccessPhase): boolean {
      const normalized = normalizeRoutePath(pathname);
      if (matchesRoutePolicy(normalized, INFORMATIONAL_ROUTES)) {
        return false;
      }
      if (phase === "unverified_email" || phase === "plan_required") {
        return true;
      }
      return matchesRoutePolicy(normalized, [
        { path: "/login", match: "exact" },
        { path: "/register", match: "exact" },
        { path: ROUTE_VERIFY_EMAIL, match: "exact" },
        { path: "/forgot-password", match: "exact" },
        { path: "/reset-password", match: "exact" },
        { path: ROUTE_SELECT_PLAN, match: "exact" },
        { path: "/setup-preferences", match: "exact" },
      ]);
    },

    evaluate(context: RouteAccessContext): RouteAccessDecision {
      const normalized = normalizeRoutePath(context.pathname);

      // El enlace firmado enviado al correo debe poder abrirse desde cualquier pestaña.
      if (
        (context.hasVerifyToken && normalized === ROUTE_VERIFY_EMAIL) ||
        normalized === "/reset-password" ||
        matchesRoutePolicy(normalized, INFORMATIONAL_ROUTES)
      ) {
        return { allowed: true, redirectTo: null, reason: "allowed" };
      }

      switch (context.phase) {
        case "loading": {
          if (matchesRoutePolicy(normalized, LOADING_PASS_THROUGH_ROUTES)) {
            return { allowed: true, redirectTo: null, reason: "allowed" };
          }
          return { allowed: false, redirectTo: null, reason: "loading" };
        }

        case "unverified_email": {
          if (matchesRoutePolicy(normalized, unverifiedEmail)) {
            return { allowed: true, redirectTo: null, reason: "allowed" };
          }
          return {
            allowed: false,
            redirectTo: fallbackVerifyRoute,
            reason: "email_verification_required",
          };
        }

        case "plan_required": {
          if (matchesRoutePolicy(normalized, withoutPlan)) {
            return { allowed: true, redirectTo: null, reason: "allowed" };
          }
          return {
            allowed: false,
            redirectTo: fallbackPlanRoute,
            reason: "subscription_plan_required",
          };
        }

        case "unauthenticated": {
          if (matchesRoutePolicy(normalized, publicRoutes)) {
            return { allowed: true, redirectTo: null, reason: "allowed" };
          }
          return {
            allowed: false,
            redirectTo: "/login",
            reason: "authentication_required",
          };
        }

        case "ready": {
          if (
            matchesRoutePolicy(normalized, ONBOARDING_AUTH_ONLY_ROUTES) ||
            normalized === ROUTE_VERIFY_EMAIL
          ) {
            return {
              allowed: false,
              redirectTo: "/",
              reason: "already_authenticated",
            };
          }
          return { allowed: true, redirectTo: null, reason: "allowed" };
        }
      }
    },
  };
}

/** Instancia global por defecto usada por el shell y los guards del cliente. */
export const routeAccessService = createRouteAccessPolicy();
