import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import type { ReactNode } from "react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

import { AuthProvider, useAuth } from "@/context/auth-context";
import {
  ApiClientError,
  type AuthUser,
  authService,
  ErrorCode,
  settingsService,
  subscriptionsService,
  type SubscriptionTier,
  type TargetLanguageCode,
  usersService,
} from "@/lib";

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 1,
    email: "student@example.com",
    fullName: "Ada Lovelace",
    subscriptionTier: null,
    currentStreak: 0,
    lastStreakDate: null,
    emailVerifiedAt: null,
    locale: "es",
    createdAt: "2026-11-13T00:00:00.000Z",
    ...overrides,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("AuthProvider onboarding & session phase transitions", () => {
  let state: {
    user: AuthUser;
    selectedLanguages: TargetLanguageCode[];
    selectedCategories: string[];
  };

  function bindStatefulMocks(authenticatedOnBoot = false) {
    jest.spyOn(authService, "me").mockImplementation(async () => {
      if (!authenticatedOnBoot && !state.user.emailVerifiedAt) {
        throw new ApiClientError({
          code: ErrorCode.AUTH_UNAUTHORIZED,
          message: "No session",
          status: 401,
        });
      }
      if (!authenticatedOnBoot) {
        throw new ApiClientError({
          code: ErrorCode.AUTH_UNAUTHORIZED,
          message: "No session",
          status: 401,
        });
      }
      return { message: "OK", data: { ...state.user } };
    });

    jest.spyOn(usersService, "getProfile").mockImplementation(async () => ({
      message: "OK",
      data: {
        ...state.user,
        selectedLanguages: [...state.selectedLanguages],
      },
    }));

    jest.spyOn(settingsService, "getLanguages").mockImplementation(async () => {
      const maxLanguages =
        state.user.subscriptionTier === "dolly_pro"
          ? 4
          : state.user.subscriptionTier === "dolly_plus"
            ? 2
            : 1;
      const active =
        state.user.subscriptionTier === "dolly_pro"
          ? (["es", "en", "fr", "it"] as TargetLanguageCode[])
          : state.selectedLanguages.slice(0, maxLanguages);
      return {
        message: "OK",
        data: {
          catalog: [],
          selected: [...state.selectedLanguages],
          active,
          maxLanguages,
          canChangeFree: state.selectedLanguages.length === 0,
          nextFreeChangeAt:
            state.selectedLanguages.length > 0
              ? "2027-11-13T00:00:00.000Z"
              : null,
          lastLanguageChangeAt:
            state.selectedLanguages.length > 0
              ? "2026-11-13T00:00:00.000Z"
              : null,
          languageChangeCredits: 0,
        },
      };
    });

    jest.spyOn(settingsService, "getCategories").mockImplementation(async () => ({
      message: "OK",
      data: { catalog: [], selected: [...state.selectedCategories] },
    }));

    jest
      .spyOn(subscriptionsService, "selectSubscription")
      .mockImplementation(async ({ tier }) => {
        state.user = { ...state.user, subscriptionTier: tier };
        const maxLanguages =
          tier === "dolly_pro" ? 4 : tier === "dolly_plus" ? 2 : 1;
        return {
          message: "Selected",
          data: {
            hasSubscription: true,
            tier,
            plan: {
              id: tier as SubscriptionTier,
              name: tier,
              description: tier,
              maxCategories: tier === "dolly_pro" ? null : 25,
              maxLanguages,
              allowedLanguages: ["es", "en", "fr", "it"],
              dailyReadingsLimit:
                tier === "dolly_pro" ? null : tier === "dolly_plus" ? 20 : 10,
              dailyQuestionsLimit:
                tier === "dolly_pro" ? null : tier === "dolly_plus" ? 80 : 30,
            },
            usage: {
              categoriesCount: state.selectedCategories.length,
              categoriesLimit: tier === "dolly_pro" ? null : 25,
              languagesCount: state.selectedLanguages.length,
              languagesLimit: maxLanguages,
              readingsCreatedToday: 0,
              readingsLimit:
                tier === "dolly_pro" ? null : tier === "dolly_plus" ? 20 : 10,
              readingsRemainingToday:
                tier === "dolly_pro" ? null : tier === "dolly_plus" ? 20 : 10,
              questionsAskedToday: 0,
              questionsLimit:
                tier === "dolly_pro" ? null : tier === "dolly_plus" ? 80 : 30,
              questionsRemainingToday:
                tier === "dolly_pro" ? null : tier === "dolly_plus" ? 80 : 30,
            },
          },
        };
      });

    jest
      .spyOn(settingsService, "updateLanguages")
      .mockImplementation(async ({ languages }) => {
        state.selectedLanguages = [...languages];
        return {
          message: "OK",
          data: {
            catalog: [],
            selected: [...languages],
            active: [...languages],
            maxLanguages: 2,
            canChangeFree: false,
            nextFreeChangeAt: "2027-11-13T00:00:00.000Z",
            lastLanguageChangeAt: "2026-11-13T00:00:00.000Z",
            languageChangeCredits: 0,
          },
        };
      });

    jest
      .spyOn(settingsService, "updateCategories")
      .mockImplementation(async ({ categories }) => {
        state.selectedCategories = [...categories];
        return {
          message: "OK",
          data: { catalog: [], selected: [...categories] },
        };
      });
  }

  beforeEach(() => {
    window.localStorage.clear();
    document.cookie = "doly_session=; Path=/; Max-Age=0";
    state = {
      user: makeUser(),
      selectedLanguages: [],
      selectedCategories: [],
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("progresses cleanly through unverified_email -> plan_required -> ready, blocking generation until languages & 3 categories exist", async () => {
    bindStatefulMocks(false);

    jest.spyOn(authService, "register").mockResolvedValue({
      message: "Registered",
      data: {
        user: makeUser({ emailVerifiedAt: null, subscriptionTier: null }),
        emailVerificationRequired: true,
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.accessPhase).toBe("unauthenticated");

    await act(async () => {
      await result.current.register({
        email: "student@example.com",
        password: "Password123!",
        fullName: "Ada Lovelace",
      });
    });

    expect(result.current.accessPhase).toBe("unverified_email");
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.pendingVerificationEmail).toBe("student@example.com");

    jest.spyOn(authService, "verifyEmail").mockImplementation(async () => {
      state.user = makeUser({
        emailVerifiedAt: "2026-11-13T01:00:00.000Z",
        subscriptionTier: null,
      });
      return {
        message: "Verified",
        data: {
          emailVerified: true,
          user: { ...state.user },
          authenticated: true,
        },
      };
    });

    await act(async () => {
      await result.current.verifyEmailWithToken("valid-email-token");
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.accessPhase).toBe("plan_required");

    await act(async () => {
      await result.current.selectPlan("dolly_plus");
    });

    expect(result.current.accessPhase).toBe("ready");
    expect(result.current.onboarding.hasSelectedPlan).toBe(true);
    expect(result.current.onboarding.hasConfiguredLanguages).toBe(false);
    expect(result.current.onboarding.canGenerateReadings).toBe(false);

    await act(async () => {
      await result.current.savePreferences({
        languages: ["en"],
        categories: ["technology", "history", "education"],
      });
    });

    expect(result.current.onboarding.hasConfiguredLanguages).toBe(true);
    expect(result.current.onboarding.hasConfiguredCategories).toBe(true);
    expect(result.current.onboarding.canGenerateReadings).toBe(true);

    jest.spyOn(authService, "logoutAll").mockResolvedValue({
      message: "OK",
      data: null,
    });
    await act(async () => {
      await result.current.logoutAll();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.accessPhase).toBe("unauthenticated");
  });

  it("blocks reading generation on downgrade from dolly_pro with 0 saved languages to dolly", async () => {
    document.cookie = "doly_session=1; Path=/";
    state = {
      user: makeUser({
        emailVerifiedAt: "2026-11-13T00:00:00.000Z",
        subscriptionTier: "dolly_pro",
      }),
      selectedLanguages: [],
      selectedCategories: ["technology", "history", "education"],
    };
    bindStatefulMocks(true);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.onboarding.hasConfiguredLanguages).toBe(true);
    expect(result.current.onboarding.canGenerateReadings).toBe(true);

    await act(async () => {
      await result.current.selectPlan("dolly");
    });

    expect(result.current.onboarding.hasConfiguredLanguages).toBe(false);
    expect(result.current.onboarding.canGenerateReadings).toBe(false);
  });
});
