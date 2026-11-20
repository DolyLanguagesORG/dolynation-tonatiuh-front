import { beforeEach, describe, expect, it } from "@jest/globals";

const mockCookieMap: Record<string, string> = {};

jest.mock("server-only", () => ({}));

jest.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = mockCookieMap[name];
      return value ? { name, value } : undefined;
    },
  }),
}));

jest.mock("@/lib/server/server-http-client", () => ({
  serverApiRequest: jest.fn(),
  serverHttpClient: {
    request: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

import { ApiClientError, ErrorCode } from "@/lib/api-errors";
import {
  getServerInitialAuthState,
  serverAccessRequestsService,
  serverAuthService,
  serverSettingsService,
  serverSubscriptionsService,
} from "@/lib/server";

describe("getServerInitialAuthState", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    for (const key of Object.keys(mockCookieMap)) {
      delete mockCookieMap[key];
    }
  });

  it("returns unauthenticated immediately when no session cookies are present", async () => {
    const meSpy = jest.spyOn(serverAuthService, "me");

    const result = await getServerInitialAuthState();

    expect(result.status).toBe("unauthenticated");
    expect(result.user).toBeNull();
    expect(meSpy).not.toHaveBeenCalled();
  });

  it("returns loading when doly_access_token is absent but refresh/session cookie exists", async () => {
    mockCookieMap.doly_session = "1";
    const meSpy = jest.spyOn(serverAuthService, "me");

    const result = await getServerInitialAuthState();

    expect(result.status).toBe("loading");
    expect(result.user).toBeNull();
    expect(meSpy).not.toHaveBeenCalled();
  });

  it("hydrates authenticated student user, subscription, settings, and access requests in parallel", async () => {
    mockCookieMap.doly_access_token = "valid-jwt";
    mockCookieMap.doly_session = "1";

    const studentUser = {
      id: 7,
      email: "student@example.com",
      fullName: "Ada Lovelace",
      role: "student" as const,
      subscriptionTier: "dolly_plus" as const,
      currentStreak: 4,
      lastStreakDate: "2026-11-18",
      emailVerifiedAt: "2026-11-01T00:00:00.000Z",
      locale: "es",
      createdAt: "2026-11-01T00:00:00.000Z",
    };

    jest.spyOn(serverAuthService, "me").mockResolvedValue({
      message: "OK",
      data: studentUser,
    });
    jest
      .spyOn(serverSubscriptionsService, "getCurrentSubscription")
      .mockResolvedValue({
        message: "OK",
        data: {
          hasSubscription: true,
          tier: "dolly_plus",
          plan: null,
          usage: {
            categoriesCount: 3,
            categoriesLimit: 25,
            languagesCount: 1,
            languagesLimit: 2,
            readingsCreatedToday: 0,
            readingsLimit: 20,
            readingsRemainingToday: 20,
            questionsAskedToday: 0,
            questionsLimit: 80,
            questionsRemainingToday: 80,
          },
        },
      });
    jest.spyOn(serverSettingsService, "getLanguages").mockResolvedValue({
      message: "OK",
      data: {
        catalog: [],
        selected: ["en"],
        active: ["en"],
        maxLanguages: 2,
        canChangeFree: false,
        nextFreeChangeAt: null,
        lastLanguageChangeAt: null,
        languageChangeCredits: 0,
      },
    });
    jest.spyOn(serverSettingsService, "getCategories").mockResolvedValue({
      message: "OK",
      data: {
        catalog: [],
        selected: ["science", "history", "technology"],
      },
    });
    jest
      .spyOn(serverAccessRequestsService, "getMyRequests")
      .mockResolvedValue({
        message: "OK",
        data: {
          enabled: false,
          requests: [],
          pendingSubscriptionRequest: null,
          pendingLanguageUnlockRequest: null,
        },
      });

    const result = await getServerInitialAuthState();

    expect(result.status).toBe("authenticated");
    expect(result.subscriptionRequired).toBe(false);
    expect(result.user).toEqual(studentUser);
    expect(result.subscription?.tier).toBe("dolly_plus");
    expect(result.languagesSettings?.selected).toEqual(["en"]);
    expect(result.categoriesSettings?.selected).toEqual([
      "science",
      "history",
      "technology",
    ]);
  });

  it("falls back to loading when access token fails with 401 and refresh cookie exists", async () => {
    mockCookieMap.doly_access_token = "expired-jwt";
    mockCookieMap.doly_refresh_token = "refresh-jwt";

    jest.spyOn(serverAuthService, "me").mockRejectedValue(
      new ApiClientError({
        code: ErrorCode.AUTH_UNAUTHORIZED,
        message: "Expired",
        status: 401,
      }),
    );

    const result = await getServerInitialAuthState();

    expect(result.status).toBe("loading");
    expect(result.user).toBeNull();
  });
});
