import "server-only";

/**
 * Constantes y utilidades de servidor para cookies de sesión `HttpOnly`.
 *
 * Tanto `doly_access_token` como `doly_refresh_token` viven estrictamente en
 * cookies `HttpOnly` firmadas por el backend y administradas por Next.js:
 * nunca se exponen a JavaScript del navegador ni a `localStorage`.
 */
export const ACCESS_COOKIE_NAME = "doly_access_token";
export const REFRESH_COOKIE_NAME = "doly_refresh_token";
export const SESSION_FLAG_COOKIE_NAME = "doly_session";

/**
 * Duración máxima de cookies de sesión (30 días, alineado con `JWT_REFRESH_TTL`).
 * Mantener el mismo `Max-Age` en `doly_access_token` evita borrados prematuros por
 * desfase horario en el navegador: el backend sigue validando la expiración real
 * del JWT y el proxy BFF rota silenciosamente el par mediante `doly_refresh_token`.
 */
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export interface SessionTokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
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

/**
 * Anexa las cookies de sesión (`doly_access_token`, `doly_refresh_token` y bandera UI)
 * sobre las cabeceras de respuesta del proxy BFF.
 */
export function appendSessionCookies(
  headers: Headers,
  tokens: SessionTokenPair,
): void {
  headers.append(
    "set-cookie",
    buildCookieString({
      name: ACCESS_COOKIE_NAME,
      value: tokens.accessToken,
      httpOnly: true,
      maxAge: SESSION_COOKIE_MAX_AGE,
    }),
  );
  headers.append(
    "set-cookie",
    buildCookieString({
      name: REFRESH_COOKIE_NAME,
      value: tokens.refreshToken,
      httpOnly: true,
      maxAge: SESSION_COOKIE_MAX_AGE,
    }),
  );
  headers.append(
    "set-cookie",
    buildCookieString({
      name: SESSION_FLAG_COOKIE_NAME,
      value: "1",
      httpOnly: false,
      maxAge: SESSION_COOKIE_MAX_AGE,
    }),
  );
}

/**
 * Expira todas las cookies de sesión en el navegador.
 */
export function clearSessionCookies(headers: Headers): void {
  for (const spec of [
    { name: ACCESS_COOKIE_NAME, httpOnly: true },
    { name: REFRESH_COOKIE_NAME, httpOnly: true },
    { name: SESSION_FLAG_COOKIE_NAME, httpOnly: false },
  ]) {
    headers.append(
      "set-cookie",
      buildCookieString({
        name: spec.name,
        value: "",
        httpOnly: spec.httpOnly,
        maxAge: 0,
      }),
    );
  }
}
