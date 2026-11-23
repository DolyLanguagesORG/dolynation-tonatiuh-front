import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

import type {
  OAuthProviderConfig,
  OAuthProvidersResponse,
} from "@/lib/api-contracts";
import { backendInternalUrl } from "@/lib/server/backend-url";

export const OAUTH_TX_COOKIE_NAME = "doly_oauth_tx";
export const OAUTH_TX_MAX_AGE_SECONDS = 600;
export const SUPPORTED_OAUTH_PROVIDERS = new Set<string>([
  "google",
  "microsoft",
]);

export type OAuthUiOrigin = "login" | "register";
export type OAuthUiLocale = "es" | "en" | "fr" | "it";

export interface OAuthTransactionPayload {
  state: string;
  codeVerifier: string;
  redirectUri: string;
  origin: OAuthUiOrigin;
  redirectTarget: string;
  locale: OAuthUiLocale;
}

const VALID_OAUTH_LOCALES = new Set<string>(["es", "en", "fr", "it"]);

export function generateOAuthState(): string {
  return randomBytes(32).toString("base64url");
}

export function generatePkcePair(): {
  codeVerifier: string;
  codeChallenge: string;
} {
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return { codeVerifier, codeChallenge };
}

export function safeEqualState(a: string, b: string): boolean {
  if (!a || !b) {
    return false;
  }
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export function sanitizeOAuthOrigin(
  raw: string | null | undefined,
): OAuthUiOrigin {
  return raw === "register" ? "register" : "login";
}

export function sanitizeOAuthRedirect(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") {
    return "/";
  }
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/";
  }
  try {
    const parsed = new URL(trimmed, "http://localhost");
    if (parsed.origin !== "http://localhost") {
      return "/";
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}

export function sanitizeOAuthLocale(
  raw: string | null | undefined,
): OAuthUiLocale {
  if (!raw) {
    return "es";
  }
  const normalized = raw.trim().toLowerCase();
  return VALID_OAUTH_LOCALES.has(normalized)
    ? (normalized as OAuthUiLocale)
    : "es";
}

export function serializeOAuthTransaction(
  payload: OAuthTransactionPayload,
): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function parseOAuthTransaction(
  raw: string | undefined,
): OAuthTransactionPayload | null {
  if (!raw || !raw.trim()) {
    return null;
  }
  try {
    const decoded = Buffer.from(raw.trim(), "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as Partial<OAuthTransactionPayload>;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.state !== "string" ||
      typeof parsed.codeVerifier !== "string" ||
      typeof parsed.redirectUri !== "string" ||
      !parsed.state ||
      !parsed.codeVerifier ||
      !parsed.redirectUri
    ) {
      return null;
    }

    return {
      state: parsed.state,
      codeVerifier: parsed.codeVerifier,
      redirectUri: parsed.redirectUri,
      origin: sanitizeOAuthOrigin(parsed.origin),
      redirectTarget: sanitizeOAuthRedirect(parsed.redirectTarget),
      locale: sanitizeOAuthLocale(parsed.locale),
    };
  } catch {
    return null;
  }
}

function buildTxCookieString(value: string, maxAge: number): string {
  const isProd = process.env.NODE_ENV === "production";
  const parts = [
    `${OAUTH_TX_COOKIE_NAME}=${value}`,
    "Path=/api/auth/oauth",
    "SameSite=Lax",
    "HttpOnly",
    `Max-Age=${maxAge}`,
  ];
  if (isProd) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export function buildOAuthTxCookie(value: string): string {
  return buildTxCookieString(value, OAUTH_TX_MAX_AGE_SECONDS);
}

export function clearOAuthTxCookie(): string {
  return buildTxCookieString("", 0);
}

/**
 * Resuelve el origen público real (esquema + host) evitando que Next.js standalone
 * detrás de Nginx redirija al host interno del contenedor (`0.0.0.0:3000`).
 */
export function resolvePublicOrigin(
  request: NextRequest,
  fallbackRedirectUri?: string,
): string {
  if (fallbackRedirectUri) {
    try {
      const parsed = new URL(fallbackRedirectUri);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return parsed.origin;
      }
    } catch {
      // Continuar con cabeceras reenviadas.
    }
  }

  const rawProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  const rawHost = (
    request.headers.get("x-forwarded-host") ?? request.headers.get("host")
  )
    ?.split(",")[0]
    ?.trim();

  if (
    rawHost &&
    !/[\s/\\]/.test(rawHost) &&
    (rawProto === "http" || rawProto === "https")
  ) {
    return `${rawProto}://${rawHost}`;
  }

  if (rawHost && !/[\s/\\]/.test(rawHost)) {
    const protocol = request.nextUrl.protocol === "https:" ? "https" : "http";
    return `${protocol}://${rawHost}`;
  }

  return request.nextUrl.origin;
}

export async function fetchEnabledOAuthProvider(
  provider: string,
): Promise<OAuthProviderConfig | null> {
  const base = backendInternalUrl.replace(/\/+$/, "");
  try {
    const response = await fetch(`${base}/auth/oauth/providers`, {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      data?: OAuthProvidersResponse;
    };
    const match = payload?.data?.providers?.find(
      (item) => item.provider === provider,
    );
    if (
      !match ||
      !match.enabled ||
      !match.authorizationEndpoint ||
      !match.clientId ||
      !match.redirectUri
    ) {
      return null;
    }
    return match;
  } catch {
    return null;
  }
}
