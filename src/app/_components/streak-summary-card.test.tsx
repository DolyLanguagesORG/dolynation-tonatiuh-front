import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import type { ReactNode } from "react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...rest
  }: {
    children: ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock("@/context", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      email: "sebastianrdzc04@gmail.com",
      fullName: "sebastian rodriguez",
      subscriptionTier: "dolly_pro",
      currentStreak: 1,
      lastStreakDate: null,
      emailVerifiedAt: "2026-11-10T00:00:00.000Z",
      locale: "en",
      createdAt: "2026-11-10T00:00:00.000Z",
    },
    isAuthenticated: true,
    isLoading: false,
    accessPhase: "ready",
    onboarding: {
      hasSelectedPlan: true,
      canGenerateReadings: true,
      hasConfiguredLanguages: true,
      hasConfiguredCategories: true,
      emailVerified: true,
      subscriptionPlan: "dolly_pro",
      selectedLanguages: ["en"],
      selectedCategories: ["art", "history", "design"],
      isOnboardingComplete: true,
    },
    reloadAccountState: async () => {},
    refreshPreferences: async () => {},
    selectPlan: jest.fn(),
    selectLanguages: jest.fn(),
    logoutAll: async () => {},
  }),
}));

import { HomeDashboard } from "@/app/_components/home-dashboard";
import { StreakSummaryCard } from "@/app/_components/streak-summary-card";
import { dictionaries, LocaleProvider } from "@/i18n";
import { readingsService, subscriptionsService, usersService } from "@/lib";

describe("HomeDashboard & StreakSummaryCard minimalist layout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(usersService, "getProfile").mockResolvedValue({
      message: "OK",
      data: {
        id: 1,
        email: "sebastianrdzc04@gmail.com",
        fullName: "sebastian rodriguez",
        subscriptionTier: "dolly_pro",
        currentStreak: 1,
        lastStreakDate: null,
        emailVerifiedAt: "2026-11-10T00:00:00.000Z",
        locale: "en",
        createdAt: "2026-11-10T00:00:00.000Z",
        selectedLanguages: ["en"],
      },
    });
    jest.spyOn(usersService, "getStreak").mockResolvedValue({
      message: "OK",
      data: {
        count: 1,
        days: [],
      },
    });
    jest.spyOn(readingsService, "listPending").mockResolvedValue({
      message: "OK",
      data: [],
    });
    jest.spyOn(readingsService, "listCompleted").mockResolvedValue({
      message: "OK",
      data: [],
    });
    jest.spyOn(subscriptionsService, "getCurrentSubscription").mockResolvedValue({
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
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("omits the active session badge and streak footer metrics row while keeping core streak details", async () => {
    const { container } = render(
      <LocaleProvider initialLocale="en">
        <HomeDashboard />
      </LocaleProvider>,
    );

    expect(await screen.findByText("Welcome back, sebastian.")).toBeTruthy();
    await waitFor(() => {
      expect(usersService.getStreak).toHaveBeenCalled();
    });

    expect(screen.getByText("CONSISTENCY STREAK")).toBeTruthy();
    expect(screen.getByText("WEEKLY LOG (LAST 7 DAYS)")).toBeTruthy();

    expect(
      screen.queryByText(/ACTIVE SESSION|SESIÓN ACTIVA|sebastianrdzc04@gmail\.com/i),
    ).toBeNull();
    expect(
      screen.queryByText(/AVERAGE ACCURACY|PRECISIÓN PROMEDIO|LOOKED-UP TERMS|TÉRMINOS CONSULTADOS/i),
    ).toBeNull();
    expect(container.querySelector("svg path[d^='M2 16L18']")).toBeNull();

    const { container: cardContainer } = render(
      <StreakSummaryCard
        t={dictionaries.es}
        locale="es"
        streakDaysCount={3}
        weeklyActiveDays={[true, true, true, false, false, false, false]}
        isAuthenticated
      />,
    );

    expect(
      screen.queryByText(/PRECISIÓN PROMEDIO|TÉRMINOS CONSULTADOS/i),
    ).toBeNull();
    expect(cardContainer.querySelector("svg path[d^='M2 16L18']")).toBeNull();
  });
});
