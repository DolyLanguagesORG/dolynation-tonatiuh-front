import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { ApiClientError, ErrorCode } from "@/lib/api-errors";
import {
  appendQueryParams,
  executeEnvelopeFetch,
  isJsonEnvelope,
  resolveFallbackErrorCode,
} from "@/lib/http-core";

function createJsonResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = { "content-type": "application/json" },
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: async () => body,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
  } as unknown as Response;
}

describe("http-core", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("appendQueryParams omits empty, null, and undefined query values", () => {
    expect(
      appendQueryParams("/readings", {
        savedOnly: true,
        language: "fr",
        search: "",
        readingId: undefined,
        difficulty: null,
      }),
    ).toBe("/readings?savedOnly=true&language=fr");
    expect(appendQueryParams("/readings?page=1", { limit: 20 })).toBe(
      "/readings?page=1&limit=20",
    );
  });

  it("identifies canonical backend envelopes and maps fallback HTTP codes", () => {
    expect(isJsonEnvelope({ message: "OK", data: null, error: null })).toBe(
      true,
    );
    expect(isJsonEnvelope(null)).toBe(false);
    expect(resolveFallbackErrorCode(401)).toBe(ErrorCode.AUTH_UNAUTHORIZED);
    expect(resolveFallbackErrorCode(403)).toBe(ErrorCode.RESOURCE_FORBIDDEN);
    expect(resolveFallbackErrorCode(404)).toBe(ErrorCode.RESOURCE_NOT_FOUND);
    expect(resolveFallbackErrorCode(429)).toBe(
      ErrorCode.READING_DAILY_LIMIT_REACHED,
    );
    expect(resolveFallbackErrorCode(503)).toBe(ErrorCode.INTERNAL_ERROR);
  });

  it("throws ApiClientError with exact backend error code and details", async () => {
    global.fetch = jest.fn(async () =>
      createJsonResponse(403, {
        message: "Forbidden",
        data: null,
        error: {
          code: ErrorCode.LANGUAGE_CHANGE_LOCKED,
          message: "Annual lock active",
          details: { languageChangeCredits: 0 },
        },
      }),
    ) as unknown as typeof fetch;

    await expect(
      executeEnvelopeFetch("/api/v1/settings/languages", { method: "PUT" }),
    ).rejects.toMatchObject({
      name: "ApiClientError",
      code: ErrorCode.LANGUAGE_CHANGE_LOCKED,
      status: 403,
      details: { languageChangeCredits: 0 },
    });
  });

  it("retries once on 401 when hooks.onUnauthorized recovers the session", async () => {
    const fetchMock = jest
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse(401, {
          message: "Unauthorized",
          data: null,
          error: { code: ErrorCode.AUTH_TOKEN_EXPIRED, message: "Expired" },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse(200, {
          message: "OK",
          data: { ok: true },
          error: null,
        }),
      );
    global.fetch = fetchMock;

    const onUnauthorized = jest.fn(async () => true);
    const result = await executeEnvelopeFetch<{ ok: boolean }>(
      "/api/v1/auth/me",
      { method: "GET" },
      { onUnauthorized },
    );

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.data).toEqual({ ok: true });
  });

  it("surfaces network failures as ApiClientError with NETWORK_ERROR", async () => {
    global.fetch = jest.fn(async () => {
      throw new Error("socket hang up");
    }) as unknown as typeof fetch;

    let caught: unknown;
    try {
      await executeEnvelopeFetch("/api/v1/readings", { method: "GET" });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ApiClientError);
    expect((caught as ApiClientError).code).toBe(ErrorCode.NETWORK_ERROR);
  });
});
