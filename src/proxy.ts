import { type NextRequest, NextResponse } from "next/server";

import { isDesignSystemEnabled } from "@/lib/feature-flags";

const PROTECTED_PREFIXES = [
  "/admin",
  "/generate",
  "/readings",
  "/history",
  "/glossary",
  "/friends",
  "/profile",
  "/select-plan",
  "/setup-preferences",
  "/billing",
  "/checkout",
] as const;

const NO_CACHE_AUTH_PREFIXES = [
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
] as const;

function requiresServerSessionRedirect(pathname: string): boolean {
  if (pathname === "/friends/invite" || pathname.startsWith("/friends/invite/")) {
    return false;
  }
  if (pathname === "/") {
    return true;
  }
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function shouldDisableBrowserCache(pathname: string): boolean {
  if (pathname === "/") {
    return true;
  }
  return (
    PROTECTED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    ) ||
    NO_CACHE_AUTH_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  );
}

function applyNoStoreHeaders(response: NextResponse): NextResponse {
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private",
  );
  response.headers.set("Pragma", "no-cache");
  return response;
}

/**
 * Proxy de protección de rutas en el borde del servidor:
 * bloquea el acceso directo sin sesión a las vistas privadas del sistema y
 * redirige a `/login`, preservando públicas únicamente autenticación, onboarding por token,
 * páginas informativas y `/design-system`.
 *
 * En Next.js 16 el archivo `middleware.ts` está deprecado y se renombró a
 * `proxy.ts` (`export function proxy`). Solo se renombró el archivo y la
 * función: el comportamiento y el `matcher` quedan igual.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;

  if (
    (pathname === "/design-system" || pathname.startsWith("/design-system/")) &&
    !isDesignSystemEnabled()
  ) {
    return NextResponse.rewrite(
      new URL("/__design_system_disabled__", request.url),
      { status: 404 },
    );
  }

  if (requiresServerSessionRedirect(pathname)) {
    const hasSessionCookie =
      Boolean(request.cookies.get("doly_session")?.value) ||
      Boolean(request.cookies.get("doly_access_token")?.value) ||
      Boolean(request.cookies.get("doly_refresh_token")?.value);

    if (!hasSessionCookie) {
      const loginUrl =
        pathname === "/"
          ? new URL("/login", request.url)
          : new URL(
              `/login?redirect=${encodeURIComponent(`${pathname}${search}`)}`,
              request.url,
            );
      return applyNoStoreHeaders(NextResponse.redirect(loginUrl));
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-dolynation-pathname", pathname);
  if (shouldDisableBrowserCache(pathname)) {
    applyNoStoreHeaders(response);
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|icon$|apple-icon$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
