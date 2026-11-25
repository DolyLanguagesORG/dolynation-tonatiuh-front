/**
 * @jest-environment node
 */

import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { NextRequest } from "next/server";

jest.mock("server-only", () => ({}));

import { GET } from "@/app/api/auth/oauth/[provider]/callback/route";
import {
  OAUTH_TX_COOKIE_NAME,
  serializeOAuthTransaction,
} from "@/lib/server/oauth-bff";

describe("GET /api/auth/oauth/[provider]/callback", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("redirects planless Microsoft OAuth users to /select-plan?oauth=microsoft while setting session cookies and clearing tx cookie", async () => {
    const state = "oauth-state-token-123";
    const txCookie = serializeOAuthTransaction({
      state,
      codeVerifier: "v".repeat(43),
      redirectUri:
        "https://stagingplay.dolynation.app/api/auth/oauth/microsoft/callback",
      origin: "login",
      redirectTarget: "/generate",
      locale: "es",
    });

    globalThis.fetch = jest.fn(async () => {
      return new Response(
        JSON.stringify({
          data: {
            tokens: {
              accessToken: "test-access-token",
              refreshToken: "test-refresh-token",
              expiresIn: 900,
            },
            user: {
              id: 7,
              email: "ms.student@example.com",
              subscriptionTier: null,
            },
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }) as typeof fetch;

    const req = new NextRequest(
      `https://stagingplay.dolynation.app/api/auth/oauth/microsoft/callback?code=ms-code&state=${state}`,
      {
        headers: {
          cookie: `${OAUTH_TX_COOKIE_NAME}=${txCookie}`,
        },
      },
    );

    const response = await GET(req, {
      params: Promise.resolve({ provider: "microsoft" }),
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://stagingplay.dolynation.app/select-plan?oauth=microsoft",
    );
    expect(response.headers.get("cache-control")).toBe("no-store");

    const setCookies = response.headers.getSetCookie();
    expect(
      setCookies.some((entry) => entry.startsWith("doly_access_token=test-access-token")),
    ).toBe(true);
    expect(
      setCookies.some((entry) => entry.startsWith("doly_refresh_token=test-refresh-token")),
    ).toBe(true);
    expect(
      setCookies.some((entry) => entry.startsWith("doly_session=1")),
    ).toBe(true);
    expect(
      setCookies.some(
        (entry) =>
          entry.startsWith(`${OAUTH_TX_COOKIE_NAME}=;`) &&
          entry.includes("Max-Age=0"),
      ),
    ).toBe(true);
  });

  it("redirects subscribed Microsoft OAuth users to their sanitized target without ?oauth=", async () => {
    const state = "oauth-state-token-456";
    const txCookie = serializeOAuthTransaction({
      state,
      codeVerifier: "w".repeat(43),
      redirectUri:
        "https://stagingplay.dolynation.app/api/auth/oauth/microsoft/callback",
      origin: "login",
      redirectTarget: "/history",
      locale: "es",
    });

    globalThis.fetch = jest.fn(async () => {
      return new Response(
        JSON.stringify({
          data: {
            tokens: {
              accessToken: "test-access-token-2",
              refreshToken: "test-refresh-token-2",
            },
            user: {
              id: 8,
              email: "pro.student@example.com",
              subscriptionTier: "dolly_pro",
            },
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }) as typeof fetch;

    const req = new NextRequest(
      `https://stagingplay.dolynation.app/api/auth/oauth/microsoft/callback?code=ms-code&state=${state}`,
      {
        headers: {
          cookie: `${OAUTH_TX_COOKIE_NAME}=${txCookie}`,
        },
      },
    );

    const response = await GET(req, {
      params: Promise.resolve({ provider: "microsoft" }),
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://stagingplay.dolynation.app/history",
    );
  });
});
