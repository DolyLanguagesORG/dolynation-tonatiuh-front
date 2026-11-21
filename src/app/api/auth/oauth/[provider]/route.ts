import { type NextRequest } from "next/server";

import {
  buildOAuthTxCookie,
  fetchEnabledOAuthProvider,
  generateOAuthState,
  generatePkcePair,
  resolvePublicOrigin,
  sanitizeOAuthLocale,
  sanitizeOAuthOrigin,
  sanitizeOAuthRedirect,
  serializeOAuthTransaction,
  SUPPORTED_OAUTH_PROVIDERS,
} from "@/lib/server/oauth-bff";

export const dynamic = "force-dynamic";

function redirectToAuthError(
  publicOrigin: string,
  originPage: "login" | "register",
  errorCode: string,
): Response {
  const target = new URL(`/${originPage}`, publicOrigin);
  target.searchParams.set("oauthError", errorCode);

  return new Response(null, {
    status: 302,
    headers: {
      location: target.toString(),
      "cache-control": "no-store",
    },
  });
}

/**
 * Inicia el flujo OAuth 2.0 + PKCE desde el servidor Next.js BFF.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
): Promise<Response> {
  const { provider: rawProvider } = await context.params;
  const provider = rawProvider.trim().toLowerCase();

  const search = request.nextUrl.searchParams;
  const uiOrigin = sanitizeOAuthOrigin(search.get("origin"));
  const redirectTarget = sanitizeOAuthRedirect(search.get("redirect"));
  const locale = sanitizeOAuthLocale(search.get("locale"));
  const publicOrigin = resolvePublicOrigin(request);

  if (!SUPPORTED_OAUTH_PROVIDERS.has(provider)) {
    return redirectToAuthError(
      publicOrigin,
      uiOrigin,
      "AUTH_OAUTH_UNSUPPORTED_PROVIDER",
    );
  }

  const config = await fetchEnabledOAuthProvider(provider);
  if (
    !config?.enabled ||
    !config.authorizationEndpoint ||
    !config.clientId ||
    !config.redirectUri
  ) {
    return redirectToAuthError(
      publicOrigin,
      uiOrigin,
      "AUTH_OAUTH_NOT_CONFIGURED",
    );
  }

  const state = generateOAuthState();
  const { codeVerifier, codeChallenge } = generatePkcePair();

  const txValue = serializeOAuthTransaction({
    state,
    codeVerifier,
    redirectUri: config.redirectUri,
    origin: uiOrigin,
    redirectTarget,
    locale,
  });

  const authorizeUrl = new URL(config.authorizationEndpoint);
  authorizeUrl.searchParams.set("client_id", config.clientId);
  authorizeUrl.searchParams.set("redirect_uri", config.redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set(
    "scope",
    (config.scopes ?? ["openid", "email", "profile"]).join(" "),
  );
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("prompt", "select_account");

  const headers = new Headers();
  headers.set("location", authorizeUrl.toString());
  headers.set("cache-control", "no-store");
  headers.append("set-cookie", buildOAuthTxCookie(txValue));

  return new Response(null, {
    status: 302,
    headers,
  });
}
