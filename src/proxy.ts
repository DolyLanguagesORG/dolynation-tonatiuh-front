import { type NextRequest, NextResponse } from "next/server";

import { isDesignSystemEnabled } from "@/lib/feature-flags";

const PROTECTED_PREFIXES = [
  "/generate",
  "/readings",
  "/history",
  "/glossary",
  "/profile",
  "/select-plan",
  "/setup-preferences",
] as const;

function requiresServerSessionRedirect(pathname: string): boolean {
  if (pathname === "/") {
    return true;
  }
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
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
  const { pathname } = request.nextUrl;

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
      Boolean(request.cookies.get("doly_access_token")?.value);

    if (!hasSessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-dolynation-pathname", pathname);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
