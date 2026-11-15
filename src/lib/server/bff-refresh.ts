import "server-only";

import { createHash } from "node:crypto";

import { type SessionTokenPair } from "@/lib/server/auth-cookies";
import { backendInternalUrl } from "@/lib/server/backend-url";

const REFRESH_GRACE_TTL_MS = 15_000;
const MAX_GRACE_CACHE_ENTRIES = 500;

export type BffRefreshResult =
  | {
      ok: true;
      tokens: SessionTokenPair;
      status: number;
      rawBody: string;
      contentType: string;
    }
  | {
      ok: false;
      invalidSession: boolean;
      status: number;
      rawBody: string | null;
      contentType: string | null;
    };

interface CachedRefreshEntry {
  tokens: SessionTokenPair;
  rawBody: string;
  contentType: string;
  expiresAtMs: number;
}

const inFlightRefreshes = new Map<string, Promise<BffRefreshResult>>();
const recentRefreshCache = new Map<string, CachedRefreshEntry>();

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function pruneExpiredCache(nowMs: number): void {
  for (const [key, entry] of recentRefreshCache.entries()) {
    if (entry.expiresAtMs <= nowMs) {
      recentRefreshCache.delete(key);
    }
  }
  while (recentRefreshCache.size > MAX_GRACE_CACHE_ENTRIES) {
    const oldestKey = recentRefreshCache.keys().next().value;
    if (!oldestKey) break;
    recentRefreshCache.delete(oldestKey);
  }
}

/**
 * Extrae `accessToken`, `refreshToken` y `expiresIn` del envelope emitido por
 * `/auth/login`, `/auth/register` o `/auth/refresh`.
 */
export function extractSessionTokensFromEnvelope(
  payload: unknown,
): SessionTokenPair | null {
  if (typeof payload !== "object" || payload === null || !("data" in payload)) {
    return null;
  }

  const data = (payload as { data?: unknown }).data;
  if (typeof data !== "object" || data === null) {
    return null;
  }

  const candidate =
    "tokens" in data &&
    typeof (data as { tokens?: unknown }).tokens === "object" &&
    (data as { tokens?: unknown }).tokens !== null
      ? (data as { tokens: Record<string, unknown> }).tokens
      : (data as Record<string, unknown>);

  const accessToken =
    typeof candidate.accessToken === "string" ? candidate.accessToken : "";
  const refreshToken =
    typeof candidate.refreshToken === "string" ? candidate.refreshToken : "";
  const expiresIn =
    typeof candidate.expiresIn === "number" ? candidate.expiresIn : undefined;

  if (!accessToken || !refreshToken) {
    return null;
  }

  return { accessToken, refreshToken, expiresIn };
}

/**
 * Elimina de la caché de gracia cualquier entrada vinculada al refresh token
 * indicado (por ejemplo, al ejecutar logout o logout-all).
 */
export function invalidateRefreshCache(refreshToken?: string | null): void {
  if (!refreshToken) {
    return;
  }
  const targetHash = hashToken(refreshToken);
  recentRefreshCache.delete(targetHash);
  for (const [key, entry] of recentRefreshCache.entries()) {
    if (hashToken(entry.tokens.refreshToken) === targetHash) {
      recentRefreshCache.delete(key);
    }
  }
}

/**
 * Renueva la sesión llamando a `POST /auth/refresh` en el backend de forma
 * single-flight por hash de `refreshToken`, con ventana corta de gracia para
 * absorber peticiones concurrentes del navegador antes de que aplique `Set-Cookie`.
 */
export async function refreshTokensOnServer(
  refreshToken: string,
): Promise<BffRefreshResult> {
  if (!refreshToken.trim()) {
    return {
      ok: false,
      invalidSession: true,
      status: 401,
      rawBody: null,
      contentType: null,
    };
  }

  const tokenHash = hashToken(refreshToken);
  const now = Date.now();
  pruneExpiredCache(now);

  const cached = recentRefreshCache.get(tokenHash);
  if (cached && cached.expiresAtMs > now) {
    return {
      ok: true,
      tokens: cached.tokens,
      status: 200,
      rawBody: cached.rawBody,
      contentType: cached.contentType,
    };
  }

  const existingInFlight = inFlightRefreshes.get(tokenHash);
  if (existingInFlight) {
    return existingInFlight;
  }

  const promise = (async (): Promise<BffRefreshResult> => {
    try {
      const base = backendInternalUrl.replace(/\/+$/, "");
      const upstream = await fetch(`${base}/auth/refresh`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });

      const contentType =
        upstream.headers.get("content-type") ?? "application/json";
      const rawBody = await upstream.text();

      if (!upstream.ok) {
        return {
          ok: false,
          invalidSession: upstream.status === 401 || upstream.status === 403,
          status: upstream.status,
          rawBody: rawBody || null,
          contentType,
        };
      }

      let parsed: unknown = null;
      try {
        parsed = JSON.parse(rawBody);
      } catch {
        parsed = null;
      }

      const tokens = extractSessionTokensFromEnvelope(parsed);
      if (!tokens) {
        return {
          ok: false,
          invalidSession: false,
          status: 502,
          rawBody: rawBody || null,
          contentType,
        };
      }

      recentRefreshCache.set(tokenHash, {
        tokens,
        rawBody,
        contentType,
        expiresAtMs: Date.now() + REFRESH_GRACE_TTL_MS,
      });

      return {
        ok: true,
        tokens,
        status: upstream.status,
        rawBody,
        contentType,
      };
    } catch {
      return {
        ok: false,
        invalidSession: false,
        status: 503,
        rawBody: null,
        contentType: null,
      };
    }
  })().finally(() => {
    inFlightRefreshes.delete(tokenHash);
  });

  inFlightRefreshes.set(tokenHash, promise);
  return promise;
}
