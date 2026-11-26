/**
 * @jest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockLogout = jest.fn(async () => undefined);
const mockSelectPlan = jest.fn(async () => undefined);
const mockSubmitAccessRequest = jest.fn(async () => undefined);
const mockCancelAccessRequest = jest.fn(async () => undefined);
const mockReloadAccountState = jest.fn(async () => undefined);

let mockAccessPhase: "plan_required" | "ready" | "unauthenticated" =
  "plan_required";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  usePathname: () => "/select-plan",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/context", () => ({
  useAuth: () => ({
    isLoading: false,
    accessPhase: mockAccessPhase,
    isAuthenticated: mockAccessPhase !== "unauthenticated",
    onboarding: {
      emailVerified: true,
      hasSelectedPlan: false,
      subscriptionPlan: null,
      selectedLanguages: [],
      selectedCategories: [],
      hasConfiguredLanguages: false,
      hasConfiguredCategories: false,
      canGenerateReadings: false,
      isOnboardingComplete: false,
    },
    user: {
      id: 12,
      email: "oauth.student@example.com",
      fullName: "OAuth Student",
      subscriptionTier: null,
      emailVerifiedAt: "2026-11-24T00:00:00.000Z",
      locale: "es",
      role: "student",
      currentStreak: 0,
      lastStreakDate: null,
      createdAt: "2026-11-24T00:00:00.000Z",
    },
    accessRequests: null,
    accessRequestsEnabled: false,
    selectPlan: mockSelectPlan,
    submitAccessRequest: mockSubmitAccessRequest,
    cancelAccessRequest: mockCancelAccessRequest,
    reloadAccountState: mockReloadAccountState,
    logout: mockLogout,
  }),
}));

jest.mock("@/components/security", () => ({
  TurnstileField: () => <div data-testid="turnstile-field" />,
  useTurnstile: () => ({
    execute: jest.fn(async () => null),
    reset: jest.fn(),
    containerRef: { current: null },
  }),
}));

jest.mock("@/components/billing", () => ({
  StripeCheckoutModal: () => null,
}));

jest.mock("@/lib/hooks/use-billing-config", () => ({
  useBillingConfig: () => ({
    config: {
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
    isStripeActive: false,
    isLoading: false,
    ensureConfig: jest.fn(async () => ({
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
    })),
  }),
}));

jest.mock("@/lib/hooks/use-subscription-plans", () => ({
  useSubscriptionPlans: () => ({
    plans: [
      {
        id: "dolly",
        name: "Dolly",
        description: "Plan inicial enfocado en un idioma",
        maxCategories: 10,
        maxLanguages: 1,
        allowedLanguages: ["es", "en", "fr", "it"],
        dailyReadingsLimit: 10,
        dailyQuestionsLimit: 30,
      },
      {
        id: "dolly_plus",
        name: "Dolly Plus",
        description: "Plan para 2 idiomas",
        maxCategories: 25,
        maxLanguages: 2,
        allowedLanguages: ["es", "en", "fr", "it"],
        dailyReadingsLimit: 20,
        dailyQuestionsLimit: 80,
      },
      {
        id: "dolly_pro",
        name: "Dolly Pro",
        description: "Todos los idiomas",
        maxCategories: null,
        maxLanguages: 4,
        allowedLanguages: ["es", "en", "fr", "it"],
        dailyReadingsLimit: null,
        dailyQuestionsLimit: null,
      },
    ],
    isLoading: false,
    error: null,
    reload: jest.fn(async () => undefined),
  }),
}));

import { SelectPlanView } from "@/app/select-plan/_components/select-plan-view";
import {
  OAUTH_BACK_GUARD_STORAGE_KEY,
  OAUTH_HISTORY_STATE_KEY,
} from "@/app/select-plan/_hooks/use-oauth-back-guard";
import { LocaleProvider } from "@/i18n";
import { subscriptionsService } from "@/lib";

describe("SelectPlanView", () => {
  beforeEach(() => {
    mockAccessPhase = "plan_required";
    mockReplace.mockClear();
    mockPush.mockClear();
    mockLogout.mockClear();
    window.sessionStorage.clear();
    window.history.replaceState(null, "", "/select-plan");
    jest.spyOn(subscriptionsService, "getPlans").mockResolvedValue({
      message: "OK",
      data: [],
      error: null,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    window.sessionStorage.clear();
    window.history.replaceState(null, "", "/select-plan");
  });

  it("renders visible 'Cambiar de cuenta' action that clears guard, logs out, and replaces route with /login", async () => {
    window.sessionStorage.setItem(OAUTH_BACK_GUARD_STORAGE_KEY, "microsoft");

    render(
      <LocaleProvider initialLocale="es">
        <SelectPlanView />
      </LocaleProvider>,
    );

    const switchButton = screen.getByRole("button", {
      name: "Cambiar de cuenta",
    });
    expect(switchButton).toBeInTheDocument();

    fireEvent.click(switchButton);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
    expect(window.sessionStorage.getItem(OAUTH_BACK_GUARD_STORAGE_KEY)).toBeNull();
  });

  it("shows localized warning alert when user navigates back after arriving via Microsoft OAuth", () => {
    window.history.replaceState(null, "", "/select-plan?oauth=microsoft");

    render(
      <LocaleProvider initialLocale="es">
        <SelectPlanView />
      </LocaleProvider>,
    );

    expect(window.location.search).toBe("");
    expect(screen.queryByText("Sesión iniciada")).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(
        new PopStateEvent("popstate", {
          state: { [OAUTH_HISTORY_STATE_KEY]: "sentinel" },
        }),
      );
    });

    expect(screen.getByText("Sesión iniciada")).toBeInTheDocument();
    expect(
      screen.getByText(/utiliza el botón «Cambiar de cuenta»/i),
    ).toBeInTheDocument();
  });
});
