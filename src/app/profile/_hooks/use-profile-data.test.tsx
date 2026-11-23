import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "@jest/globals";
import type { ReactNode } from "react";

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
const mockToastWarning = jest.fn();
const mockToastInfo = jest.fn();
const mockReloadAccountState = jest.fn(async () => {});

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

jest.mock("@/context", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      email: "student@example.com",
      fullName: "Ada Lovelace",
      subscriptionTier: "dolly_plus",
      currentStreak: 0,
      lastStreakDate: null,
      emailVerifiedAt: "2026-11-10T00:00:00.000Z",
      locale: "es",
      createdAt: "2026-11-10T00:00:00.000Z",
    },
    isAuthenticated: true,
    reloadAccountState: mockReloadAccountState,
    refreshPreferences: async () => {},
    selectPlan: jest.fn(),
    selectLanguages: jest.fn(),
    logoutAll: async () => {},
  }),
}));

jest.mock("@/context/toast-context", () => ({
  useToast: () => ({
    toasts: [],
    showToast: jest.fn(),
    success: mockToastSuccess,
    error: mockToastError,
    warning: mockToastWarning,
    info: mockToastInfo,
    dismiss: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    clear: jest.fn(),
  }),
}));

jest.mock("@/lib/hooks/use-subscription-plans", () => ({
  useSubscriptionPlans: () => ({ plans: [], isLoading: false, error: null }),
}));

import { useProfileData } from "@/app/profile/_hooks/use-profile-data";
import { LocaleProvider } from "@/i18n";
import {
  ApiClientError,
  billingService,
  ErrorCode,
  historyService,
  settingsService,
  subscriptionsService,
  usersService,
} from "@/lib";
import { resetBillingConfigCacheForTests } from "@/lib/hooks/use-billing-config";

function Wrapper({ children }: { children: ReactNode }) {
  return <LocaleProvider initialLocale="es">{children}</LocaleProvider>;
}

describe("useProfileData toast notifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetBillingConfigCacheForTests();
    jest.spyOn(billingService, "getConfig").mockResolvedValue({
      message: "OK",
      data: {
        provider: "manual",
        publishableKey: null,
        currency: "mxn",
        uiMode: "custom",
        plans: [],
        languageUnlock: {
          checkoutRequired: false,
          amountCents: null,
          currency: "mxn",
        },
      },
    });
    jest.spyOn(usersService, "getProfile").mockResolvedValue({
      message: "OK",
      data: {
        id: 1,
        email: "student@example.com",
        fullName: "Ada Lovelace",
        subscriptionTier: "dolly_plus",
        currentStreak: 0,
        lastStreakDate: null,
        emailVerifiedAt: "2026-11-10T00:00:00.000Z",
        locale: "es",
        createdAt: "2026-11-10T00:00:00.000Z",
        selectedLanguages: ["en"],
      },
    });
    jest.spyOn(usersService, "getStreak").mockResolvedValue({
      message: "OK",
      data: {
        days: [],
        count: 0,
      },
    });
    jest.spyOn(historyService, "getSummary").mockResolvedValue({
      message: "OK",
      data: {
        readings: {
          total: 0,
          pending: 0,
          completed: 0,
          passed: 0,
          averageScore: null,
        },
        recentScores: [],
        wordsLookedUp: 0,
      },
    });
    jest.spyOn(settingsService, "getLanguages").mockResolvedValue({
      message: "OK",
      data: {
        catalog: [],
        selected: ["en"],
        active: ["en"],
        maxLanguages: 2,
        canChangeFree: true,
        nextFreeChangeAt: null,
        lastLanguageChangeAt: null,
        languageChangeCredits: 0,
      },
    });
    jest.spyOn(settingsService, "getCategories").mockResolvedValue({
      message: "OK",
      data: {
        catalog: [],
        selected: ["technology", "history", "science"],
      },
    });
    jest.spyOn(subscriptionsService, "getCurrentSubscription").mockResolvedValue({
      message: "OK",
      data: {
        hasSubscription: true,
        tier: "dolly_plus",
        plan: null,
        usage: {
          categoriesCount: 3,
          categoriesLimit: 15,
          languagesCount: 1,
          languagesLimit: 2,
          readingsCreatedToday: 0,
          readingsLimit: 10,
          readingsRemainingToday: 10,
          questionsAskedToday: 0,
          questionsLimit: 10,
          questionsRemainingToday: 10,
        },
      },
    });
  });

  it("emits detailed error toast when custom category is rejected by moderation", async () => {
    jest.spyOn(settingsService, "updateCategories").mockRejectedValueOnce(
      new ApiClientError({
        code: ErrorCode.CATEGORY_MODERATION_REJECTED,
        message: "Moderation rejected",
        status: 400,
        details: {
          rejected: [{ category: "bad-topic", layer: "blacklist", reason: "unsafe" }],
        },
      }),
    );

    const { result } = renderHook(() => useProfileData(), { wrapper: Wrapper });

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      const ok = await result.current.handleAddCustomCategory("bad-topic");
      expect(ok).toBe(false);
    });

    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining('"bad-topic"'),
      expect.objectContaining({ title: "Error al guardar" }),
    );
  });

  it("emits success toast when custom category is saved", async () => {
    jest.spyOn(settingsService, "updateCategories").mockResolvedValueOnce({
      message: "OK",
      data: {
        catalog: [],
        selected: ["technology", "history", "science", "Astronomy"],
      },
    });

    const { result } = renderHook(() => useProfileData(), { wrapper: Wrapper });

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      const ok = await result.current.handleAddCustomCategory("Astronomy");
      expect(ok).toBe(true);
    });

    expect(mockToastSuccess).toHaveBeenCalledTimes(1);
  });

  it("blocks deleting one of the last 3 active categories and deletes deselected ones via API", async () => {
    jest.spyOn(settingsService, "getCategories").mockResolvedValueOnce({
      message: "OK",
      data: {
        catalog: [
          { id: "technology", name: "technology" },
          { id: "history", name: "history" },
          { id: "science", name: "science" },
          { id: "Astronomy", name: "Astronomy" },
        ],
        selected: ["technology", "history", "science"],
      },
    });
    const deleteSpy = jest
      .spyOn(settingsService, "deleteCategory")
      .mockResolvedValueOnce({
        message: "Removed",
        data: {
          catalog: [
            { id: "technology", name: "technology" },
            { id: "history", name: "history" },
            { id: "science", name: "science" },
          ],
          selected: ["technology", "history", "science"],
        },
      });

    const { result } = renderHook(() => useProfileData(), { wrapper: Wrapper });

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      const blocked = await result.current.handleDeleteCategory("technology");
      expect(blocked).toBe(false);
    });
    expect(deleteSpy).not.toHaveBeenCalled();
    expect(mockToastWarning).toHaveBeenCalledTimes(1);

    await act(async () => {
      const removed = await result.current.handleDeleteCategory("Astronomy");
      expect(removed).toBe(true);
    });
    expect(deleteSpy).toHaveBeenCalledWith("Astronomy");
    expect(mockToastSuccess).toHaveBeenCalledTimes(1);
    expect(result.current.resolvedCategories.map((c) => c.id)).toEqual([
      "technology",
      "history",
      "science",
    ]);
  });

  it("refreshes subscription, languages, and account state on handleRefreshAccessRequests", async () => {
    const { result } = renderHook(() => useProfileData(), { wrapper: Wrapper });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.currentSubscription?.tier).toBe("dolly_plus");

    jest
      .spyOn(subscriptionsService, "getCurrentSubscription")
      .mockResolvedValueOnce({
        message: "OK",
        data: {
          hasSubscription: true,
          tier: "dolly_pro",
          plan: null,
          usage: {
            categoriesCount: 3,
            categoriesLimit: null,
            languagesCount: 4,
            languagesLimit: 4,
            readingsCreatedToday: 0,
            readingsLimit: null,
            readingsRemainingToday: null,
            questionsAskedToday: 0,
            questionsLimit: null,
            questionsRemainingToday: null,
          },
        },
      });

    await act(async () => {
      await result.current.handleRefreshAccessRequests();
    });

    expect(mockReloadAccountState).toHaveBeenCalledTimes(1);
    expect(result.current.currentSubscription?.tier).toBe("dolly_pro");
  });

  it("creates Stripe language-unlock checkout session when provider is stripe", async () => {
    resetBillingConfigCacheForTests();
    jest.spyOn(billingService, "getConfig").mockResolvedValue({
      message: "OK",
      data: {
        provider: "stripe",
        publishableKey: "pk_test_123",
        currency: "mxn",
        uiMode: "custom",
        plans: [],
        languageUnlock: {
          checkoutRequired: true,
          amountCents: 4900,
          currency: "mxn",
        },
      },
    });
    jest.spyOn(billingService, "getStatus").mockResolvedValue({
      message: "OK",
      data: {
        provider: "stripe",
        tier: "dolly_plus",
        subscription: null,
        recentPayments: [],
      },
    });
    jest.spyOn(billingService, "listInvoices").mockResolvedValue({
      message: "OK",
      data: [],
    });
    const createUnlockSpy = jest
      .spyOn(billingService, "createLanguageUnlockCheckout")
      .mockResolvedValueOnce({
        message: "OK",
        data: {
          sessionId: "cs_test_unlock_1",
          clientSecret: "cs_test_secret_1",
          url: null,
          publishableKey: "pk_test_123",
          uiMode: "custom",
          tier: null,
        },
      });

    const { result } = renderHook(() => useProfileData(), { wrapper: Wrapper });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.isStripeActive).toBe(true);
    expect(result.current.languageUnlockPriceLabel).toBe("$49.00 MXN");

    await act(async () => {
      const ok = await result.current.handleUnlockLanguageChange();
      expect(ok).toBe(true);
    });

    expect(createUnlockSpy).toHaveBeenCalledTimes(1);
    expect(result.current.checkoutKind).toBe("language_unlock");
    expect(result.current.checkoutSession?.sessionId).toBe("cs_test_unlock_1");
  });
});
