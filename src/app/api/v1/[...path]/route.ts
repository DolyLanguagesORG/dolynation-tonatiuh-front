import { type NextRequest } from "next/server";

import { backendInternalUrl } from "@/lib/server/backend-url";

/**
 * Proxy del frontend hacia el backend (patron BFF de Next.js).
 *
 * El navegador nunca ve la direccion del backend: pide `/api/v1/<ruta>` a
 * este mismo origen y es el servidor de Next.js quien reenvia la peticion a
 * `BACKEND_INTERNAL_URL`, que es una variable **de servidor** (no lleva
 * `NEXT_PUBLIC_`, asi que no se compila en el bundle del navegador).
 *
 * Ventajas frente a llamar al backend desde el navegador:
 *
 * - La URL y el puerto del backend no se filtran al cliente.
 * - Gestiona la cookie `HttpOnly` de `refreshToken` en el servidor (front#3)
 *   para restaurar sesiones sin persistir tokens en `localStorage`.
 * - El navegador solo habla con un origen: no hay CORS ni preflight.
 * - `BACKEND_INTERNAL_URL` se lee en tiempo de ejecucion, no se hornea en
 *   el build: staging y produccion pueden apuntar a backends distintos.
 */

const REFRESH_COOKIE_NAME = "doly_refresh_token";
const SESSION_FLAG_COOKIE_NAME = "doly_session";
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 días

/**
 * Cabeceras que se reenvian al backend. Todo lo demas se descarta: las
 * cookies del navegador no deben viajar a la API, y las cabeceras `host` o
 * `connection` harian que el backend creyera estar en otro servidor.
 */
const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "authorization",
  "content-type",
] as const;

/**
 * Methods que el backend expone.
 */
const ALLOWED_METHODS = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
]);

/**
 * Error con la misma forma que el envelope del backend
 * (`{ message, data, error }`), para que el cliente del frontend pueda
 * tratarlo sin cambiar su manejo de errores.
 */
function apiError(
  status: number,
  code: string,
  message: string,
): Response {
  return Response.json(
    {
      message,
      data: null,
      error: { code, message },
    },
    { status },
  );
}

/**
 * Normaliza los segmentos de la ruta para impedir path traversal
 * (`..`, `.`) y separadores incrustados. Devuelve `null` si la ruta es
 * invalida.
 */
function sanitizeSegments(segments: string[]): string[] | null {
  const clean: string[] = [];

  for (const raw of segments) {
    let segment: string;
    try {
      segment = decodeURIComponent(raw);
    } catch {
      return null;
    }

    if (segment === "" || segment === "." || segment === "..") {
      return null;
    }

    if (segment.includes("/") || segment.includes("\\")) {
      return null;
    }

    if (/[\u0000-\u001f\u007f]/.test(segment)) {
      return null;
    }

    clean.push(encodeURIComponent(segment));
  }

  return clean;
}

/**
 * Construye la URL final en el backend a partir de los segmentos de la ruta
 * y los parametros de consulta.
 */
function buildTargetUrl(
  segments: string[],
  searchParams: URLSearchParams,
): URL {
  const base = new URL(backendInternalUrl);
  const basePath = base.pathname.replace(/\/+$/, "");
  const path = segments.length > 0 ? `/${segments.join("/")}` : "";

  const target = new URL(`${basePath}${path}`, base);

  searchParams.forEach((value, key) => {
    target.searchParams.append(key, value);
  });

  return target;
}

function buildCookieString(params: {
  name: string;
  value: string;
  httpOnly: boolean;
  maxAge: number;
}): string {
  const isProd = process.env.NODE_ENV === "production";
  const parts = [
    `${params.name}=${encodeURIComponent(params.value)}`,
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${params.maxAge}`,
  ];
  if (params.httpOnly) {
    parts.push("HttpOnly");
  }
  if (isProd) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

function appendAuthCookies(headers: Headers, refreshToken: string): void {
  headers.append(
    "set-cookie",
    buildCookieString({
      name: REFRESH_COOKIE_NAME,
      value: refreshToken,
      httpOnly: true,
      maxAge: REFRESH_COOKIE_MAX_AGE,
    }),
  );
  headers.append(
    "set-cookie",
    buildCookieString({
      name: SESSION_FLAG_COOKIE_NAME,
      value: "1",
      httpOnly: false,
      maxAge: REFRESH_COOKIE_MAX_AGE,
    }),
  );
}

function clearAuthCookies(headers: Headers): void {
  headers.append(
    "set-cookie",
    buildCookieString({
      name: REFRESH_COOKIE_NAME,
      value: "",
      httpOnly: true,
      maxAge: 0,
    }),
  );
  headers.append(
    "set-cookie",
    buildCookieString({
      name: SESSION_FLAG_COOKIE_NAME,
      value: "",
      httpOnly: false,
      maxAge: 0,
    }),
  );
}

function extractRefreshTokenFromEnvelope(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null || !("data" in payload)) {
    return null;
  }
  const data = (payload as { data?: unknown }).data;
  if (typeof data !== "object" || data === null) {
    return null;
  }

  if (
    "refreshToken" in data &&
    typeof (data as { refreshToken?: unknown }).refreshToken === "string"
  ) {
    return (data as { refreshToken: string }).refreshToken;
  }

  if (
    "tokens" in data &&
    typeof (data as { tokens?: unknown }).tokens === "object" &&
    (data as { tokens?: unknown }).tokens !== null
  ) {
    const tokens = (data as { tokens: { refreshToken?: unknown } }).tokens;
    if (typeof tokens.refreshToken === "string") {
      return tokens.refreshToken;
    }
  }

  return null;
}

async function proxy(request: NextRequest, path: string[]): Promise<Response> {
  const method = request.method.toUpperCase();

  if (!ALLOWED_METHODS.has(method)) {
    return apiError(
      405,
      "METHOD_NOT_ALLOWED",
      `El metodo ${method} no esta permitido en el proxy.`,
    );
  }

  const segments = sanitizeSegments(path);
  if (segments === null) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "La ruta solicitada no es valida.",
    );
  }

  let target: URL;
  try {
    target = buildTargetUrl(segments, request.nextUrl.searchParams);
  } catch {
    return apiError(
      500,
      "INTERNAL_ERROR",
      "No se pudo construir la URL del backend.",
    );
  }

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = request.headers.get("x-real-ip") ?? forwardedFor;
  if (clientIp) {
    headers.set("x-forwarded-for", clientIp);
  }
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));

  const routeKey = segments.join("/");
  const hasBody = method !== "GET" && method !== "HEAD";
  let body: BodyInit | undefined;

  if (hasBody) {
    if (routeKey === "auth/refresh" && method === "POST") {
      const rawText = await request.text();
      let hasExplicitRefreshToken = false;

      if (rawText.trim().length > 0) {
        try {
          const parsed = JSON.parse(rawText) as { refreshToken?: unknown };
          hasExplicitRefreshToken =
            typeof parsed?.refreshToken === "string" &&
            parsed.refreshToken.trim().length > 0;
        } catch {
          hasExplicitRefreshToken = false;
        }
      }

      if (hasExplicitRefreshToken) {
        body = rawText;
      } else {
        const cookieRefreshToken =
          request.cookies.get(REFRESH_COOKIE_NAME)?.value ?? "";
        body = JSON.stringify({ refreshToken: cookieRefreshToken });
        headers.set("content-type", "application/json");
      }
    } else {
      body = await request.arrayBuffer();
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method,
      headers,
      body,
      redirect: "manual",
      cache: "no-store",
    });
  } catch {
    return apiError(
      503,
      "SERVICE_UNAVAILABLE",
      "No se pudo contactar con el servicio de lectura. Intenta de nuevo en unos segundos.",
    );
  }

  const responseHeaders = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) {
    responseHeaders.set("content-type", contentType);
  }

  responseHeaders.set("x-dolynation-proxy", "nextjs");

  const isAuthTokenIssuedRoute =
    method === "POST" &&
    (routeKey === "auth/login" ||
      routeKey === "auth/register" ||
      routeKey === "auth/refresh");

  if (routeKey === "auth/logout" && method === "POST") {
    clearAuthCookies(responseHeaders);
  } else if (
    routeKey === "auth/refresh" &&
    method === "POST" &&
    !upstream.ok
  ) {
    clearAuthCookies(responseHeaders);
  }

  if (
    isAuthTokenIssuedRoute &&
    upstream.ok &&
    contentType?.includes("application/json")
  ) {
    const rawJson = await upstream.text();
    try {
      const parsed = JSON.parse(rawJson) as unknown;
      const issuedRefreshToken = extractRefreshTokenFromEnvelope(parsed);
      if (issuedRefreshToken) {
        appendAuthCookies(responseHeaders, issuedRefreshToken);
      }
    } catch {
      // Si el cuerpo no es JSON valido, se reenvia tal cual sin anexar cookies.
    }

    return new Response(rawJson, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  }

  const isNullBodyStatus =
    upstream.status === 204 ||
    upstream.status === 205 ||
    upstream.status === 304;

  return new Response(isNullBodyStatus ? null : upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

/**
 * Next.js App Router: captura cualquier subruta bajo `/api/v1`.
 */
async function handler(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
): Promise<Response> {
  const { path } = await context.params;
  return proxy(request, path ?? []);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const HEAD = handler;
export const OPTIONS = handler;

export const dynamic = "force-dynamic";
