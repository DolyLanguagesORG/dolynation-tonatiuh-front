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
  ErrorCode.AUTH_PASSWORD_LOGIN_NOT_ALLOWED,
  ErrorCode.AUTH_TOKEN_INVALID,
  ErrorCode.ACCESS_REQUEST_REQUIRED,
  ErrorCode.ACCESS_REQUESTS_DISABLED,
  ErrorCode.ACCESS_REQUEST_ALREADY_PENDING,
  ErrorCode.ACCESS_REQUEST_ALREADY_REVIEWED,
  ErrorCode.AI_RATE_LIMITED,
  ErrorCode.AUTH_OAUTH_NOT_CONFIGURED,
  ErrorCode.AUTH_OAUTH_UNSUPPORTED_PROVIDER,
  ErrorCode.AUTH_OAUTH_INVALID_CODE,
  ErrorCode.AUTH_OAUTH_EMAIL_UNVERIFIED,
  ErrorCode.AUTH_OAUTH_ACCOUNT_LINK_REQUIRED,
  ErrorCode.AUTH_OAUTH_ADMIN_FORBIDDEN,
  ErrorCode.AUTH_OAUTH_PROVIDER_ERROR,
  ErrorCode.AUTH_OAUTH_STATE_INVALID,
  ErrorCode.AUTH_OAUTH_CANCELLED,
  ErrorCode.CAPTCHA_REQUIRED,
  ErrorCode.CAPTCHA_VERIFICATION_FAILED,
  ErrorCode.CAPTCHA_PROVIDER_UNAVAILABLE,
  ErrorCode.RATE_LIMIT_EXCEEDED,
  ErrorCode.BILLING_PAYMENT_REQUIRED,
  ErrorCode.BILLING_CHECKOUT_INVALID,
  ErrorCode.BILLING_WEBHOOK_SIGNATURE_INVALID,
  ErrorCode.BILLING_SUBSCRIPTION_CONFLICT,
  ErrorCode.BILLING_PROVIDER_ERROR,
  ErrorCode.BILLING_NOT_CONFIGURED,
  ErrorCode.BILLING_RATE_LIMITED,
  ErrorCode.FRIENDSHIP_SELF_ACTION_NOT_ALLOWED,
  ErrorCode.FRIENDSHIP_ALREADY_EXISTS,
  ErrorCode.FRIENDSHIP_REQUEST_ALREADY_PENDING,
  ErrorCode.FRIENDSHIP_REQUEST_NOT_PENDING,
  ErrorCode.FRIENDSHIP_NOT_FOUND,
  ErrorCode.FRIENDSHIP_USER_BLOCKED,
  ErrorCode.FRIENDSHIP_INVITE_LINK_INVALID,
  ErrorCode.FRIENDSHIP_LIMIT_REACHED,
  ErrorCode.FRIEND_STREAK_ALREADY_EXISTS,
  ErrorCode.FRIEND_STREAK_INVALID_STATE,
  ErrorCode.FRIEND_STREAK_CATEGORIES_INVALID,
  ErrorCode.FRIEND_STREAK_LANGUAGE_INCOMPATIBLE,
] as const;

describe("api-errors catalog", () => {
  it("resolves localized user messages in es, en, fr, and it for all backend QA error codes", () => {
    for (const code of BACKEND_FLOW_ERROR_CODES) {
      const esMsg = resolveErrorMessage(code, "es");
      const enMsg = resolveErrorMessage(code, "en");
      const frMsg = resolveErrorMessage(code, "fr");
      const itMsg = resolveErrorMessage(code, "it");

      expect(esMsg.trim().length).toBeGreaterThan(10);
      expect(enMsg.trim().length).toBeGreaterThan(10);
      expect(frMsg.trim().length).toBeGreaterThan(10);
      expect(itMsg.trim().length).toBeGreaterThan(10);
      expect(esMsg).not.toBe(enMsg);
      expect(frMsg).not.toBe(enMsg);
      expect(itMsg).not.toBe(esMsg);
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

  it("includes rejected category names in getUserMessage for CATEGORY_MODERATION_REJECTED", () => {
    const err = new ApiClientError({
      code: ErrorCode.CATEGORY_MODERATION_REJECTED,
      message: "Rejected by moderation",
      status: 400,
      details: {
        rejected: [
          { category: "spam", layer: "blacklist", reason: "unsafe" },
          { category: "SPAM", layer: "blacklist", reason: "duplicate case" },
          { category: "gore", layer: "ai_moderation", reason: "unsafe_content" },
        ],
      },
    });

    expect(err.getRejectedCategories()).toHaveLength(2);
    expect(err.getUserMessage("es")).toContain('"spam", "gore"');
    expect(err.getUserMessage("en")).toContain('"spam", "gore"');
  });

  it("marks BILLING_RATE_LIMITED as rate limited", () => {
    const err = new ApiClientError({
      code: ErrorCode.BILLING_RATE_LIMITED,
      status: 429,
      details: { retryAfterSeconds: 30 },
    });

    expect(err.isRateLimited).toBe(true);
    expect(err.details?.retryAfterSeconds).toBe(30);
  });

  it("avoids internal infrastructure jargon across all localized error messages", () => {
    const locales = ["es", "en", "fr", "it"] as const;
    for (const locale of locales) {
      for (const code of Object.values(ErrorCode)) {
        const msg = resolveErrorMessage(code, locale);
        expect(msg.toLowerCase()).not.toContain("proxy");
        expect(msg.toLowerCase()).not.toContain("backend");
        expect(msg.toLowerCase()).not.toContain("token");
        expect(msg).not.toContain(code);
      }
    }
  });
});
