import { type NextRequest, NextResponse } from "next/server";

/**
 * Middleware base del frontend DolyNation.
 * Prepara la canalización de cabeceras de seguridad/contexto y deja listo
 * el punto de extensión para protección de rutas en los módulos de sesión (front#3, front#4).
 */
export function middleware(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  response.headers.set("x-dolynation-pathname", request.nextUrl.pathname);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
