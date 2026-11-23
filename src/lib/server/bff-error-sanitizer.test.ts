import { describe, expect, it } from "@jest/globals";

import { sanitizeUpstreamErrorForBrowser } from "@/lib/server/bff-error-sanitizer";

describe("sanitizeUpstreamErrorForBrowser", () => {
  it("strips internal details, hints, and raw backend messages while preserving error code", () => {
    const raw = JSON.stringify({
      message: "The provider failed several times",
      data: null,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "AI circuit breaker is open",
        details: {
          reason: "ai-circuit-open",
          hint: "The provider failed several times in a row. It will be retried shortly.",
          operation: "ai_chat",
        },
      },
    });

    const sanitized = JSON.parse(sanitizeUpstreamErrorForBrowser(raw, 503)) as {
      message: string;
      data: null;
      error: { code: string; message: string; details?: Record<string, unknown> };
    };

    expect(sanitized.error.code).toBe("SERVICE_UNAVAILABLE");
    expect(sanitized.error.details).toBeUndefined();
    expect(JSON.stringify(sanitized)).not.toContain("ai-circuit-open");
    expect(JSON.stringify(sanitized)).not.toContain("circuit breaker");
    expect(JSON.stringify(sanitized)).not.toContain("ai_chat");
  });

  it("keeps only rejected category names for CATEGORY_MODERATION_REJECTED without layer or reason", () => {
    const raw = JSON.stringify({
      message: "Rejected",
      data: null,
      error: {
        code: "CATEGORY_MODERATION_REJECTED",
        message: "One or more categories were rejected",
        details: {
          rejected: [
            { category: "ignore previous instructions", layer: "regex", reason: "prompt_injection" },
            { category: "spam", layer: "blacklist", reason: "prohibited_content" },
          ],
        },
      },
    });

    const sanitized = JSON.parse(sanitizeUpstreamErrorForBrowser(raw, 400)) as {
      error: {
        code: string;
        details: { rejected: Array<Record<string, unknown>> };
      };
    };

    expect(sanitized.error.code).toBe("CATEGORY_MODERATION_REJECTED");
    expect(sanitized.error.details.rejected).toEqual([
      { category: "ignore previous instructions" },
      { category: "spam" },
    ]);
    expect(JSON.stringify(sanitized)).not.toContain("prompt_injection");
    expect(JSON.stringify(sanitized)).not.toContain("blacklist");
    expect(JSON.stringify(sanitized)).not.toContain("regex");
  });

  it("sanitizes VALIDATION_ERROR field messages to prevent whitelist probing hints", () => {
    const raw = JSON.stringify({
      message: "Validation failed",
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "Bad Request",
        details: {
          fields: [
            { field: "role", message: "property role should not exist" },
            { field: "email", message: "must be an email" },
          ],
        },
      },
    });

    const sanitized = JSON.parse(sanitizeUpstreamErrorForBrowser(raw, 400)) as {
      error: {
        code: string;
        details: { fields: Array<{ field: string; message: string }> };
      };
    };

    expect(sanitized.error.details.fields).toEqual([
      { field: "role", message: "Valor no válido." },
      { field: "email", message: "Valor no válido." },
    ]);
    expect(JSON.stringify(sanitized)).not.toContain("should not exist");
  });

  it("handles malformed upstream JSON gracefully", () => {
    const sanitized = JSON.parse(
      sanitizeUpstreamErrorForBrowser("<html>502 Bad Gateway</html>", 502),
    ) as { error: { code: string; message: string } };

    expect(sanitized.error.code).toBe("INTERNAL_ERROR");
    expect(JSON.stringify(sanitized)).not.toContain("Bad Gateway");
  });

  it("preserves retryAfterSeconds for BILLING_RATE_LIMITED while stripping internal properties", () => {
    const raw = JSON.stringify({
      message: "Too many checkout requests",
      data: null,
      error: {
        code: "BILLING_RATE_LIMITED",
        message: "Rate limit exceeded for bucket checkout",
        details: {
          retryAfterSeconds: 42,
          bucket: "checkout",
          userId: 99,
        },
      },
    });

    const sanitized = JSON.parse(sanitizeUpstreamErrorForBrowser(raw, 429)) as {
      error: {
        code: string;
        details?: Record<string, unknown>;
      };
    };

    expect(sanitized.error.code).toBe("BILLING_RATE_LIMITED");
    expect(sanitized.error.details).toEqual({ retryAfterSeconds: 42 });
    expect(JSON.stringify(sanitized)).not.toContain("bucket");
    expect(JSON.stringify(sanitized)).not.toContain("userId");
  });

  it("preserves daysRemaining and nextFreeChangeAt for LANGUAGE_CHANGE_LOCKED while stripping internal fields", () => {
    const raw = JSON.stringify({
      message: "Language change locked",
      data: null,
      error: {
        code: "LANGUAGE_CHANGE_LOCKED",
        message: "Annual lock active",
        details: {
          daysRemaining: 215,
          nextFreeChangeAt: "2027-06-25T10:00:00.000Z",
          internalReason: "cooldown_365",
        },
      },
    });

    const sanitized = JSON.parse(sanitizeUpstreamErrorForBrowser(raw, 403)) as {
      error: {
        code: string;
        details?: Record<string, unknown>;
      };
    };

    expect(sanitized.error.code).toBe("LANGUAGE_CHANGE_LOCKED");
    expect(sanitized.error.details).toEqual({
      daysRemaining: 215,
      nextFreeChangeAt: "2027-06-25T10:00:00.000Z",
    });
    expect(JSON.stringify(sanitized)).not.toContain("internalReason");
    expect(JSON.stringify(sanitized)).not.toContain("cooldown_365");
  });
});
