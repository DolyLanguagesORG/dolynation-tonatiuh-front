/** @jest-environment node */

import { createHash } from "node:crypto";
import { describe, expect, it, jest } from "@jest/globals";
import { NextRequest } from "next/server";

jest.mock("server-only", () => ({}));

import {
  SUPPORTED_OAUTH_PROVIDERS,
  generatePkcePair,
  parseOAuthTransaction,
  resolvePublicOrigin,
  safeEqualState,
  sanitizeOAuthOrigin,
  sanitizeOAuthRedirect,
  serializeOAuthTransaction,
} from "@/lib/server/oauth-bff";

describe("oauth-bff server utilities", () => {
  it("supports both google and microsoft OAuth providers and rejects unknown ones", () => {
    expect(SUPPORTED_OAUTH_PROVIDERS.has("google")).toBe(true);
    expect(SUPPORTED_OAUTH_PROVIDERS.has("microsoft")).toBe(true);
    expect(SUPPORTED_OAUTH_PROVIDERS.has("github")).toBe(false);
  });
  it("generates RFC 7636 S256 PKCE verifier and challenge pair", () => {
    const { codeVerifier, codeChallenge } = generatePkcePair();

    expect(codeVerifier.length).toBeGreaterThanOrEqual(43);
    expect(codeVerifier.length).toBeLessThanOrEqual(128);
    const expected = createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");
    expect(codeChallenge).toBe(expected);
  });

  it("compares OAuth state tokens in constant time", () => {
    expect(safeEqualState("abc123", "abc123")).toBe(true);
    expect(safeEqualState("abc123", "abc124")).toBe(false);
    expect(safeEqualState("abc", "abcd")).toBe(false);
    expect(safeEqualState("", "")).toBe(false);
  });

  it("sanitizes redirect paths to prevent open redirects", () => {
    expect(sanitizeOAuthRedirect("/generate")).toBe("/generate");
    expect(sanitizeOAuthRedirect("/readings/12?tab=summary")).toBe(
      "/readings/12?tab=summary",
    );
    expect(sanitizeOAuthRedirect("//evil.example.com")).toBe("/");
    expect(sanitizeOAuthRedirect("https://evil.example.com/phish")).toBe("/");
    expect(sanitizeOAuthRedirect("javascript:alert(1)")).toBe("/");
    expect(sanitizeOAuthRedirect(null)).toBe("/");
    expect(sanitizeOAuthOrigin("register")).toBe("register");
    expect(sanitizeOAuthOrigin("other")).toBe("login");
  });

  it("serializes and parses OAuth transaction cookie payloads safely", () => {
    const encoded = serializeOAuthTransaction({
      state: "state-1",
      codeVerifier: "v".repeat(43),
      redirectUri: "https://stagingplay.dolynation.app/api/auth/oauth/google/callback",
      origin: "register",
      redirectTarget: "/select-plan",
      locale: "en",
    });

    expect(parseOAuthTransaction(encoded)).toEqual({
      state: "state-1",
      codeVerifier: "v".repeat(43),
      redirectUri: "https://stagingplay.dolynation.app/api/auth/oauth/google/callback",
      origin: "register",
      redirectTarget: "/select-plan",
      locale: "en",
    });

    expect(parseOAuthTransaction(undefined)).toBeNull();
    expect(parseOAuthTransaction("not-valid-base64-json")).toBeNull();
  });

  it("resolves public origin from redirectUri or proxy forwarded headers instead of internal container host", () => {
    const req = new NextRequest("http://0.0.0.0:3000/api/auth/oauth/google", {
      headers: {
        "x-forwarded-proto": "https",
        "x-forwarded-host": "stagingplay.dolynation.app",
      },
    });

    expect(resolvePublicOrigin(req)).toBe("https://stagingplay.dolynation.app");
    expect(
      resolvePublicOrigin(
        req,
        "https://play.dolynation.app/api/auth/oauth/google/callback",
      ),
    ).toBe("https://play.dolynation.app");
  });
});
