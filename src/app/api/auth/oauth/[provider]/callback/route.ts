import { type NextRequest } from "next/server";

import {
  ACCESS_COOKIE_NAME,
  appendSessionCookies,
  REFRESH_COOKIE_NAME,
} from "@/lib/server/auth-cookies";
import { backendInternalUrl } from "@/lib/server/backend-url";
import { extractSessionTokensFromEnvelope } from "@/lib/server/bff-refresh";
import {
  buildPostOAuthDestinationUrl,
  clearOAuthTxCookie,
  OAUTH_TX_COOKIE_NAME,
  parseOAuthTransaction,
  resolvePublicOrigin,
  safeEqualState,
  SUPPORTED_OAUTH_PROVIDERS,
} from "@/lib/server/oauth-bff";

export const dynamic = "force-dynamic";

function redirectWithClearedTx(url: URL, extraHeaders?: Headers): Response {
  const headers = new Headers(extraHeaders);
  headers.set("location", url.toString());
  headers.set("cache-control", "no-store");
  headers.append("set-cookie", clearOAuthTxCookie());

  return new Response(null, {
    status: 302,
    headers,
  });
}

function redirectToError(
  publicOrigin: string,
  originPage: "login" | "register",
  errorCode: string,
): Response {
  const target = new URL(`/${originPage}`, publicOrigin);
  target.searchParams.set("oauthError", errorCode);
  return redirectWithClearedTx(target);
}

/**
 * Procesa el callback OAuth del proveedor externo, intercambia el código con el backend
 * usando PKCE y establece las cookies `HttpOnly` de sesión antes de redirigir al usuario.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
): Promise<Response> {
  const { provider: rawProvider } = await context.params;
  const provider = rawProvider.trim().toLowerCase();

  const tx = parseOAuthTransaction(
    request.cookies.get(OAUTH_TX_COOKIE_NAME)?.value,
  );
  const publicOrigin = resolvePublicOrigin(request, tx?.redirectUri);
  const originPage = tx?.origin ?? "login";

  if (!SUPPORTED_OAUTH_PROVIDERS.has(provider)) {
    return redirectToError(
      publicOrigin,
      originPage,
      "AUTH_OAUTH_UNSUPPORTED_PROVIDER",
    );
  }

  const search = request.nextUrl.searchParams;
  const providerError = search.get("error");
  if (providerError) {
    const mappedCode =
      providerError === "access_denied"
        ? "AUTH_OAUTH_CANCELLED"
        : "AUTH_OAUTH_PROVIDER_ERROR";
    return redirectToError(publicOrigin, originPage, mappedCode);
  }

  const code = search.get("code")?.trim() ?? "";
  const state = search.get("state")?.trim() ?? "";

  if (!tx) {
    const hasActiveSessionCookies =
      Boolean(request.cookies.get(ACCESS_COOKIE_NAME)?.value) ||
      Boolean(request.cookies.get(REFRESH_COOKIE_NAME)?.value);
    if (hasActiveSessionCookies) {
      return new Response(null, {
        status: 302,
        headers: {
          location: new URL("/", publicOrigin).toString(),
          "cache-control": "no-store",
        },
      });
    }
    return redirectToError(publicOrigin, originPage, "AUTH_OAUTH_STATE_INVALID");
  }

  if (!code || !state || !safeEqualState(state, tx.state)) {
    return redirectToError(publicOrigin, originPage, "AUTH_OAUTH_STATE_INVALID");
  }

  const base = backendInternalUrl.replace(/\/+$/, "");
  const headersToBackend = new Headers({
    "content-type": "application/json",
    accept: "application/json",
  });
  const clientIp =
    request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for");
  if (clientIp) {
    headersToBackend.set("x-forwarded-for", clientIp);
  }
  const userAgent = request.headers.get("user-agent");
  if (userAgent) {
    headersToBackend.set("user-agent", userAgent);
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      `${base}/auth/oauth/${encodeURIComponent(provider)}/exchange`,
      {
        method: "POST",
        headers: headersToBackend,
        body: JSON.stringify({
          code,
          codeVerifier: tx.codeVerifier,
          redirectUri: tx.redirectUri,
          locale: tx.locale,
        }),
        cache: "no-store",
      },
    );
  } catch {
    return redirectToError(
      publicOrigin,
      originPage,
      "AUTH_OAUTH_PROVIDER_ERROR",
    );
  }

  let parsed: unknown = null;
  try {
    parsed = await upstream.json();
  } catch {
    parsed = null;
  }

  if (!upstream.ok) {
    const upstreamCode =
      typeof parsed === "object" &&
      parsed !== null &&
      "error" in parsed &&
      typeof (parsed as { error?: { code?: unknown } }).error?.code === "string"
        ? ((parsed as { error: { code: string } }).error.code ||
          "AUTH_OAUTH_PROVIDER_ERROR")
        : "AUTH_OAUTH_PROVIDER_ERROR";

    return redirectToError(publicOrigin, originPage, upstreamCode);
  }

  const tokens = extractSessionTokensFromEnvelope(parsed);
  if (!tokens) {
    return redirectToError(
      publicOrigin,
      originPage,
      "AUTH_OAUTH_PROVIDER_ERROR",
    );
  }

  const user =
    typeof parsed === "object" &&
    parsed !== null &&
    "data" in parsed &&
    typeof (parsed as { data?: { user?: unknown } }).data?.user === "object" &&
    (parsed as { data?: { user?: unknown } }).data?.user !== null
      ? ((
          parsed as {
            data: { user: { subscriptionTier?: string | null } };
          }
        ).data.user)
      : null;

  const destinationUrl = buildPostOAuthDestinationUrl({
    publicOrigin,
    provider,
    hasSubscriptionTier: Boolean(user?.subscriptionTier),
    redirectTarget: tx.redirectTarget,
  });

  const responseHeaders = new Headers();
  appendSessionCookies(responseHeaders, tokens);

  return redirectWithClearedTx(destinationUrl, responseHeaders);
}
