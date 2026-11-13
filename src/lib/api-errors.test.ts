import { describe, expect, it } from "@jest/globals";

import {
  ApiClientError,
  ErrorCode,
  resolveErrorMessage,
} from "@/lib/api-errors";

const BACKEND_FLOW_ERROR_CODES = [
  ErrorCode.SUBSCRIPTION_REQUIRED,
  ErrorCode.READING_PENDING_LIMIT_REACHED,
  ErrorCode.READING_DAILY_LIMIT_REACHED,
  ErrorCode.SUBSCRIPTION_LANGUAGE_LIMIT_EXCEEDED,
  ErrorCode.SUBSCRIPTION_LANGUAGE_NOT_ALLOWED,
  ErrorCode.LANGUAGE_NOT_SELECTED,
  ErrorCode.LANGUAGE_CHANGE_LOCKED,
  ErrorCode.CATEGORY_MODERATION_REJECTED,
  ErrorCode.CATEGORY_DAILY_LIMIT_REACHED,
  ErrorCode.EXPLANATION_DAILY_LIMIT_REACHED,
  ErrorCode.AUTH_EMAIL_NOT_VERIFIED,
  ErrorCode.AUTH_EMAIL_TOKEN_INVALID,
  ErrorCode.AUTH_TOKEN_INVALID,
] as const;

describe("api-errors catalog", () => {
  it("resolves bilingual localized user messages for all backend QA error codes", () => {
    for (const code of BACKEND_FLOW_ERROR_CODES) {
      const esMsg = resolveErrorMessage(code, "es");
      const enMsg = resolveErrorMessage(code, "en");

      expect(esMsg.trim().length).toBeGreaterThan(10);
      expect(enMsg.trim().length).toBeGreaterThan(10);
      expect(esMsg).not.toBe(enMsg);
    }
  });

  it("constructs ApiClientError preserving code, HTTP status, and details", () => {
    const err = new ApiClientError({
      code: ErrorCode.READING_PENDING_LIMIT_REACHED,
      message: "Maximum 3 pending readings",
      status: 400,
      details: { pendingCount: 3, maxPending: 3 },
    });

    expect(err.code).toBe(ErrorCode.READING_PENDING_LIMIT_REACHED);
    expect(err.status).toBe(400);
    expect(err.details).toEqual({ pendingCount: 3, maxPending: 3 });
    expect(err.getUserMessage("es")).toBe(
      resolveErrorMessage(ErrorCode.READING_PENDING_LIMIT_REACHED, "es"),
    );
    expect(err.getUserMessage("en")).toBe(
      resolveErrorMessage(ErrorCode.READING_PENDING_LIMIT_REACHED, "en"),
    );
  });
});
