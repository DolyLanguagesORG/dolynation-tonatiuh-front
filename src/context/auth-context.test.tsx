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
  accessRequestsService,
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

  it("does not expose authenticated or ready state before subscribed onboarding settings settle on bootstrap", async () => {
    document.cookie = "doly_session=1; Path=/";
    state = {
      user: makeUser({
        emailVerifiedAt: "2026-11-13T00:00:00.000Z",
        subscriptionTier: "dolly_pro",
      }),
      selectedLanguages: ["en"],
      selectedCategories: ["technology", "history", "education"],
    };
    bindStatefulMocks(true);

    let releaseSettings!: () => void;
    const settingsGate = new Promise<void>((resolve) => {
      releaseSettings = resolve;
    });

    const getLanguagesSpy = jest
      .spyOn(settingsService, "getLanguages")
      .mockImplementation(async () => {
        await settingsGate;
        return {
          message: "OK",
          data: {
            catalog: [],
            selected: ["en"],
            active: ["es", "en", "fr", "it"],
            maxLanguages: 4,
            canChangeFree: true,
            nextFreeChangeAt: null,
            lastLanguageChangeAt: null,
            languageChangeCredits: 0,
          },
        };
      });

    jest
      .spyOn(settingsService, "getCategories")
      .mockImplementation(async () => {
        await settingsGate;
        return {
          message: "OK",
          data: {
            catalog: [],
            selected: ["technology", "history", "education"],
          },
        };
      });

    jest
      .spyOn(subscriptionsService, "getCurrentSubscription")
      .mockImplementation(async () => {
        await settingsGate;
        return {
          message: "OK",
          data: {
            hasSubscription: true,
            tier: "dolly_pro",
            plan: null,
            usage: {
              categoriesCount: 3,
              categoriesLimit: null,
              languagesCount: 1,
              languagesLimit: null,
              readingsCreatedToday: 0,
              readingsLimit: null,
              readingsRemainingToday: null,
              questionsAskedToday: 0,
              questionsLimit: null,
              questionsRemainingToday: null,
            },
          },
        };
      });

    const observedStates: Array<{
      isAuthenticated: boolean;
      accessPhase: string;
      hasSelectedPlan: boolean;
      canGenerateReadings: boolean;
    }> = [];

    const { result } = renderHook(
      () => {
        const auth = useAuth();
        observedStates.push({
          isAuthenticated: auth.isAuthenticated,
          accessPhase: auth.accessPhase,
          hasSelectedPlan: auth.onboarding.hasSelectedPlan,
          canGenerateReadings: auth.onboarding.canGenerateReadings,
        });
        return auth;
      },
      { wrapper },
    );

    await waitFor(() => expect(getLanguagesSpy).toHaveBeenCalledTimes(1));
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.accessPhase).toBe("loading");

    await act(async () => {
      releaseSettings();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.accessPhase).toBe("ready");
    expect(result.current.onboarding.hasSelectedPlan).toBe(true);
    expect(result.current.onboarding.canGenerateReadings).toBe(true);
    expect(
      observedStates.some(
        (entry) => entry.isAuthenticated && !entry.hasSelectedPlan,
      ),
    ).toBe(false);
    expect(
      observedStates.some(
        (entry) => entry.isAuthenticated && !entry.canGenerateReadings,
      ),
    ).toBe(false);
  });

  it("isolates admin sessions to admin phase and exposes student waitlist requests", async () => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    document.cookie = "doly_session=1; path=/";

    state.user = makeUser({
      id: 99,
      email: "admin@dolynation.test",
      role: "admin",
      subscriptionTier: null,
      emailVerifiedAt: "2026-11-10T00:00:00.000Z",
    });
    bindStatefulMocks(true);

    const { result, unmount } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.accessPhase).toBe("admin");
    expect(result.current.accessRequests).toBeNull();
    unmount();

    state.user = makeUser({
      id: 12,
      email: "student-waitlist@example.com",
      role: "student",
      subscriptionTier: null,
      emailVerifiedAt: "2026-11-10T00:00:00.000Z",
    });
    bindStatefulMocks(true);
    const getMyRequestsSpy = jest
      .spyOn(accessRequestsService, "getMyRequests")
      .mockResolvedValue({
        message: "OK",
        data: {
          enabled: true,
          requests: [],
          pendingSubscriptionRequest: null,
          pendingLanguageUnlockRequest: null,
        },
      });

    const studentHook = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(studentHook.result.current.isLoading).toBe(false));
    expect(studentHook.result.current.accessPhase).toBe("plan_required");
    expect(studentHook.result.current.accessRequestsEnabled).toBe(true);
    expect(getMyRequestsSpy).toHaveBeenCalled();
  });

  it("hydrates authenticated state synchronously from SSR initialAuth without redundant /auth/me fetch", async () => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    document.cookie = "doly_session=; Path=/; Max-Age=0";

    const meSpy = jest.spyOn(authService, "me");
    const hydratedUser = makeUser({
      id: 42,
      email: "ssr-student@example.com",
      fullName: "SSR Student",
      subscriptionTier: "dolly_plus",
      currentStreak: 5,
      emailVerifiedAt: "2026-11-10T00:00:00.000Z",
    });

    const initialAuth = {
      status: "authenticated" as const,
      user: hydratedUser,
      subscription: {
        hasSubscription: true,
        tier: "dolly_plus" as const,
        plan: {
          id: "dolly_plus" as const,
          name: "Dolly Plus",
          description: "Plus",
          maxCategories: 25,
          maxLanguages: 2,
          allowedLanguages: ["es", "en", "fr", "it"] as TargetLanguageCode[],
          dailyReadingsLimit: 20,
          dailyQuestionsLimit: 80,
        },
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
      languagesSettings: {
        catalog: [],
        selected: ["en"] as TargetLanguageCode[],
        active: ["en"] as TargetLanguageCode[],
        maxLanguages: 2,
        canChangeFree: false,
        nextFreeChangeAt: null,
        lastLanguageChangeAt: null,
        languageChangeCredits: 0,
      },
      categoriesSettings: {
        catalog: [],
        selected: ["science", "history", "technology"],
      },
      accessRequests: null,
      subscriptionRequired: false,
    };

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <AuthProvider initialAuth={initialAuth}>{children}</AuthProvider>
      ),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.accessPhase).toBe("ready");
    expect(result.current.user?.fullName).toBe("SSR Student");
    expect(result.current.user?.currentStreak).toBe(5);
    expect(result.current.onboarding.canGenerateReadings).toBe(true);

    await waitFor(() => {
      expect(meSpy).not.toHaveBeenCalled();
    });
  });

  it("revalidates on mount when SSR initialAuth marks status as loading for refresh", async () => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    document.cookie = "doly_session=; Path=/; Max-Age=0";

    state.user = makeUser({
      id: 77,
      email: "refreshed@example.com",
      subscriptionTier: "dolly",
      currentStreak: 2,
      emailVerifiedAt: "2026-11-10T00:00:00.000Z",
    });
    state.selectedLanguages = ["en"];
    state.selectedCategories = ["science", "history", "technology"];
    bindStatefulMocks(true);

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <AuthProvider
          initialAuth={{
            status: "loading",
            user: null,
            subscription: null,
            languagesSettings: null,
            categoriesSettings: null,
            accessRequests: null,
            subscriptionRequired: false,
          }}
        >
          {children}
        </AuthProvider>
      ),
    });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.accessPhase).toBe("ready");
    expect(result.current.user?.currentStreak).toBe(2);
  });

  it("polls /access-requests/me only while a request is pending and reloads account state upon approval", async () => {
    jest.useFakeTimers();
    try {
      window.sessionStorage.clear();
      window.localStorage.clear();
      document.cookie = "doly_session=1; Path=/";

      state.user = makeUser({
        id: 88,
        email: "waiting@example.com",
        subscriptionTier: "dolly_pro",
        currentStreak: 1,
        emailVerifiedAt: "2026-11-10T00:00:00.000Z",
      });
      state.selectedLanguages = ["en", "es", "fr", "it"];
      state.selectedCategories = ["science", "history", "technology"];
      bindStatefulMocks(true);

      jest
        .spyOn(subscriptionsService, "getCurrentSubscription")
        .mockImplementation(async () => ({
          message: "OK",
          data: {
            hasSubscription: true,
            tier: state.user.subscriptionTier ?? "dolly_pro",
            plan: null,
            usage: {
              categoriesCount: 3,
              categoriesLimit: null,
              languagesCount: 4,
              languagesLimit: state.user.subscriptionTier === "dolly_plus" ? 2 : 4,
              readingsCreatedToday: 0,
              readingsLimit: 20,
              readingsRemainingToday: 20,
              questionsAskedToday: 0,
              questionsLimit: 80,
              questionsRemainingToday: 80,
            },
          },
        }));

      const pendingRequest = {
        id: 501,
        userId: 88,
        requestType: "subscription" as const,
        requestedTier: "dolly_plus" as const,
        currentTier: "dolly_pro" as const,
        userMessage: "porfa",
        status: "pending" as const,
        rejectionReason: null,
        reviewedByUserId: null,
        reviewedAt: null,
        createdAt: "2026-11-19T01:00:00.000Z",
        updatedAt: "2026-11-19T01:00:00.000Z",
      };

      let approved = false;
      const getMyRequestsSpy = jest
        .spyOn(accessRequestsService, "getMyRequests")
        .mockImplementation(async () => {
          if (!approved) {
            return {
              message: "OK",
              data: {
                enabled: true,
                requests: [pendingRequest],
                pendingSubscriptionRequest: pendingRequest,
                pendingLanguageUnlockRequest: null,
              },
            };
          }
          const approvedRequest = {
            ...pendingRequest,
            status: "approved" as const,
            reviewedByUserId: 99,
            reviewedAt: "2026-11-19T01:00:20.000Z",
            updatedAt: "2026-11-19T01:00:20.000Z",
          };
          return {
            message: "OK",
            data: {
              enabled: true,
              requests: [approvedRequest],
              pendingSubscriptionRequest: null,
              pendingLanguageUnlockRequest: null,
            },
          };
        });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.user?.subscriptionTier).toBe("dolly_pro");
      expect(
        result.current.accessRequests?.pendingSubscriptionRequest?.id,
      ).toBe(501);
      expect(getMyRequestsSpy).toHaveBeenCalledTimes(1);

      // First poll tick while still pending
      await act(async () => {
        jest.advanceTimersByTime(15_000);
        await Promise.resolve();
      });
      expect(getMyRequestsSpy).toHaveBeenCalledTimes(2);
      expect(result.current.user?.subscriptionTier).toBe("dolly_pro");

      // Admin approves the plan switch before next poll tick
      approved = true;
      state.user = { ...state.user, subscriptionTier: "dolly_plus" };

      await act(async () => {
        jest.advanceTimersByTime(15_000);
        await Promise.resolve();
      });

      await waitFor(() =>
        expect(result.current.user?.subscriptionTier).toBe("dolly_plus"),
      );
      expect(result.current.subscription?.tier).toBe("dolly_plus");
      expect(
        result.current.accessRequests?.pendingSubscriptionRequest,
      ).toBeNull();

      // Polling stops once no pending request remains
      const callsAfterApproval = getMyRequestsSpy.mock.calls.length;
      await act(async () => {
        jest.advanceTimersByTime(45_000);
        await Promise.resolve();
      });
      expect(getMyRequestsSpy).toHaveBeenCalledTimes(callsAfterApproval);
    } finally {
      jest.useRealTimers();
    }
  });
});
