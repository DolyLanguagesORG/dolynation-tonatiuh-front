import { type NextRequest } from "next/server";

import {
  ACCESS_COOKIE_NAME,
  appendSessionCookies,
  clearSessionCookies,
  REFRESH_COOKIE_NAME,
} from "@/lib/server/auth-cookies";
import { backendInternalUrl } from "@/lib/server/backend-url";
import {
  extractSessionTokensFromEnvelope,
  invalidateRefreshCache,
  refreshTokensOnServer,
} from "@/lib/server/bff-refresh";

/**
 * Proxy BFF del frontend hacia `dolynation-atl-back`.
 *
 * Garantías de arquitectura y seguridad:
 * - El navegador nunca ve `BACKEND_INTERNAL_URL`: solo llama a `/api/v1/<ruta>`.
 * - Ambos tokens JWT (`doly_access_token` y `doly_refresh_token`) se resguardan
 *   exclusivamente en cookies `HttpOnly` del dominio Next.js, jamás en
 *   `localStorage` ni en memoria JavaScript expuesta del navegador.
 * - Las respuestas de `/auth/login`, `/auth/register` y `/auth/refresh` redactan
 *   los JWT crudos antes de enviarse al cliente.
 * - Si el access token expira en una petición privada, el proxy renueva el par
 *   una sola vez (single-flight + caché de gracia en servidor) usando la cookie
 *   `doly_refresh_token` y reintenta transparentemente antes de responder.
 */

const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "authorization",
  "content-type",
] as const;

const FORWARDED_RESPONSE_HEADERS = [
  "content-type",
  "cache-control",
  "x-app-version",
] as const;

const ALLOWED_METHODS = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
]);

const PUBLIC_NO_BEARER_ROUTES = new Set([
  "auth/login",
  "auth/register",
  "auth/refresh",
  "auth/verify-email",
  "auth/resend-verification",
  "auth/forgot-password",
  "auth/reset-password",
]);

function apiError(
  status: number,
  code: string,
  message: string,
  extraHeaders?: Headers,
): Response {
  const headers = new Headers(extraHeaders);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("x-dolynation-proxy", "nextjs");

  return new Response(
    JSON.stringify({
      message,
      data: null,
      error: { code, message },
    }),
    { status, headers },
  );
}

/**
 * Normaliza los segmentos de la ruta para impedir path traversal (`..`, `.`) y
 * separadores incrustados. Devuelve `null` si la ruta es inválida.
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
 * Construye la URL final en el backend a partir de los segmentos y query params.
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

/**
 * Redacta `accessToken` y `refreshToken` de la respuesta JSON antes de enviarla
 * al navegador cuando el BFF ya fijó las cookies `HttpOnly`.
 */
function sanitizeAuthEnvelopeForBrowser(
  routeKey: string,
  rawJson: string,
): string {
  try {
    const parsed = JSON.parse(rawJson) as {
      message?: unknown;
      data?: Record<string, unknown>;
      error?: unknown;
    };
    if (!parsed || typeof parsed !== "object" || !parsed.data) {
      return rawJson;
    }

    const tokens =
      typeof parsed.data.tokens === "object" && parsed.data.tokens !== null
        ? (parsed.data.tokens as { expiresIn?: unknown })
        : (parsed.data as { expiresIn?: unknown });

    const expiresIn =
      typeof tokens.expiresIn === "number" ? tokens.expiresIn : undefined;

    if (routeKey === "auth/refresh") {
      return JSON.stringify({
        message: parsed.message ?? "Token refreshed",
        data: {
          authenticated: true,
          ...(expiresIn !== undefined ? { expiresIn } : {}),
        },
        error: parsed.error ?? null,
      });
    }

    const emailVerified =
      typeof parsed.data.emailVerified === "boolean"
        ? parsed.data.emailVerified
        : undefined;

    return JSON.stringify({
      message: parsed.message ?? "OK",
      data: {
        user: parsed.data.user ?? null,
        authenticated: true,
        ...(emailVerified !== undefined ? { emailVerified } : {}),
        ...(expiresIn !== undefined ? { expiresIn } : {}),
      },
      error: parsed.error ?? null,
    });
  } catch {
    return rawJson;
  }
}

/**
 * Parsea un posible `{ refreshToken }` en el cuerpo raw sin lanzar excepciones.
 */
function readExplicitRefreshToken(rawText: string): string | null {
  if (!rawText.trim()) {
    return null;
  }
  try {
    const parsed = JSON.parse(rawText) as { refreshToken?: unknown };
    return typeof parsed?.refreshToken === "string" &&
      parsed.refreshToken.trim().length > 0
      ? parsed.refreshToken
      : null;
  } catch {
    return null;
  }
}

function copyUpstreamHeaders(upstream: Response): Headers {
  const headers = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }
  headers.set("x-dolynation-proxy", "nextjs");
  return headers;
}

async function handleRefreshRoute(
  request: NextRequest,
  rawBody: string,
): Promise<Response> {
  const explicitToken = readExplicitRefreshToken(rawBody);
  const cookieToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value ?? "";
  const tokenToUse = explicitToken ?? cookieToken;

  const responseHeaders = new Headers();
  responseHeaders.set("x-dolynation-proxy", "nextjs");

  if (!tokenToUse) {
    clearSessionCookies(responseHeaders);
    return apiError(
      401,
      "AUTH_UNAUTHORIZED",
      "Authentication is required to refresh the session.",
      responseHeaders,
    );
  }

  const refreshResult = await refreshTokensOnServer(tokenToUse);

  if (!refreshResult.ok) {
    if (refreshResult.invalidSession) {
      clearSessionCookies(responseHeaders);
    }

    if (refreshResult.rawBody) {
      responseHeaders.set(
        "content-type",
        refreshResult.contentType ?? "application/json; charset=utf-8",
      );
      return new Response(refreshResult.rawBody, {
        status: refreshResult.status,
        headers: responseHeaders,
      });
    }

    return apiError(
      refreshResult.status,
      refreshResult.invalidSession ? "AUTH_TOKEN_INVALID" : "SERVICE_UNAVAILABLE",
      refreshResult.invalidSession
        ? "Refresh token is invalid or expired."
        : "No se pudo contactar con el servicio de autenticación.",
      responseHeaders,
    );
  }

  appendSessionCookies(responseHeaders, refreshResult.tokens);
  responseHeaders.set("content-type", "application/json; charset=utf-8");

  return new Response(
    sanitizeAuthEnvelopeForBrowser("auth/refresh", refreshResult.rawBody),
    {
      status: 200,
      headers: responseHeaders,
    },
  );
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
      "CONFIG_ERROR",
      "No se pudo construir la URL del backend.",
    );
  }

  const routeKey = segments.join("/");
  const hasBody = method !== "GET" && method !== "HEAD";
  const rawBuffer = hasBody ? await request.arrayBuffer() : null;

  if (routeKey === "auth/refresh" && method === "POST") {
    const rawText = rawBuffer ? new TextDecoder().decode(rawBuffer) : "";
    return handleRefreshRoute(request, rawText);
  }

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }

  const cookieAccessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const cookieRefreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (
    !headers.has("authorization") &&
    cookieAccessToken &&
    !PUBLIC_NO_BEARER_ROUTES.has(routeKey)
  ) {
    headers.set("authorization", `Bearer ${cookieAccessToken}`);
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = request.headers.get("x-real-ip") ?? forwardedFor;
  if (clientIp) {
    headers.set("x-forwarded-for", clientIp);
  }
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));

  let outboundBody: BodyInit | undefined =
    rawBuffer && rawBuffer.byteLength > 0 ? rawBuffer : undefined;

  if (routeKey === "auth/logout" && method === "POST") {
    const rawText = rawBuffer ? new TextDecoder().decode(rawBuffer) : "";
    const explicitRefreshToken = readExplicitRefreshToken(rawText);
    const activeRefreshToken = explicitRefreshToken ?? cookieRefreshToken ?? "";

    if (!activeRefreshToken) {
      const responseHeaders = new Headers();
      responseHeaders.set("content-type", "application/json; charset=utf-8");
      responseHeaders.set("x-dolynation-proxy", "nextjs");
      clearSessionCookies(responseHeaders);
      return new Response(
        JSON.stringify({ message: "Logged out", data: null, error: null }),
        { status: 200, headers: responseHeaders },
      );
    }

    outboundBody = JSON.stringify({ refreshToken: activeRefreshToken });
    headers.set("content-type", "application/json");
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method,
      headers,
      body: outboundBody,
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

  let rotatedTokensHeaders: Headers | null = null;

  // Recuperación automática en servidor ante 401 cuando existe refresh cookie válido
  if (
    upstream.status === 401 &&
    !PUBLIC_NO_BEARER_ROUTES.has(routeKey) &&
    !request.headers.get("authorization") &&
    cookieRefreshToken
  ) {
    const refreshed = await refreshTokensOnServer(cookieRefreshToken);
    if (refreshed.ok) {
      rotatedTokensHeaders = new Headers();
      appendSessionCookies(rotatedTokensHeaders, refreshed.tokens);

      headers.set("authorization", `Bearer ${refreshed.tokens.accessToken}`);
      if (routeKey === "auth/logout" && method === "POST") {
        outboundBody = JSON.stringify({
          refreshToken: refreshed.tokens.refreshToken,
        });
        headers.set("content-type", "application/json");
      }

      try {
        upstream = await fetch(target, {
          method,
          headers,
          body: outboundBody,
          redirect: "manual",
          cache: "no-store",
        });
      } catch {
        return apiError(
          503,
          "SERVICE_UNAVAILABLE",
          "No se pudo contactar con el servicio tras renovar la sesión.",
          rotatedTokensHeaders,
        );
      }
    } else if (refreshed.invalidSession) {
      rotatedTokensHeaders = new Headers();
      clearSessionCookies(rotatedTokensHeaders);
    }
  }

  const responseHeaders = copyUpstreamHeaders(upstream);

  if (rotatedTokensHeaders) {
    for (const setCookie of rotatedTokensHeaders.getSetCookie()) {
      responseHeaders.append("set-cookie", setCookie);
    }
  }

  const isLogoutRoute =
    method === "POST" &&
    (routeKey === "auth/logout" || routeKey === "auth/logout-all");

  if (isLogoutRoute) {
    invalidateRefreshCache(cookieRefreshToken);
    clearSessionCookies(responseHeaders);
  }

  const isAuthTokenIssuedRoute =
    method === "POST" &&
    (routeKey === "auth/login" ||
      routeKey === "auth/register" ||
      routeKey === "auth/verify-email");

  const contentType = upstream.headers.get("content-type") ?? "";
  if (
    isAuthTokenIssuedRoute &&
    upstream.ok &&
    contentType.includes("application/json")
  ) {
    const rawJson = await upstream.text();
    let responseBody = rawJson;

    try {
      const parsed = JSON.parse(rawJson) as unknown;
      const issuedTokens = extractSessionTokensFromEnvelope(parsed);
      if (issuedTokens) {
        appendSessionCookies(responseHeaders, issuedTokens);
        responseBody = sanitizeAuthEnvelopeForBrowser(routeKey, rawJson);
      } else if (routeKey === "auth/register") {
        // Cuando la verificación por correo es obligatoria, el registro no emite tokens:
        // limpiamos cookies previas para que no quede una sesión anterior activa.
        clearSessionCookies(responseHeaders);
      }
    } catch {
      // Si el cuerpo no es JSON válido, se reenvía tal cual sin anexar cookies.
    }

    return new Response(responseBody, {
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
