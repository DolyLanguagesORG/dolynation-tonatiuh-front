"use client";

import { OnboardingGateBanner } from "@/app/_components/onboarding-gate-banner";
import { QuickGenerateCard } from "@/app/_components/quick-generate-card";
import { RecentReadingsSection } from "@/app/_components/recent-readings-section";
import { StreakSummaryCard } from "@/app/_components/streak-summary-card";
import { useHomeDashboard } from "@/app/_hooks/use-home-dashboard";
import { Badge, Container, Heading, Text } from "@/components/ui";

/**
 * Orquestador interactivo de la pantalla principal (`/`).
 */
export function HomeDashboard() {
  const home = useHomeDashboard();
  const { locale, t, isAuthenticated, onboarding, user } = home;

  if (isAuthenticated && !onboarding.hasSelectedPlan) {
    return (
      <OnboardingGateBanner t={t} onboarding={onboarding} mode="plan" />
    );
  }

  if (isAuthenticated && !onboarding.isOnboardingComplete) {
    return (
      <OnboardingGateBanner t={t} onboarding={onboarding} mode="languages" />
    );
  }

  return (
    <Container size="lg" className="flex flex-col gap-8 sm:gap-10">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1.5">
          <Heading as="h1" variant="display" mainHeading>
            {home.welcomeHeading}
          </Heading>
          <Text variant="editorial" tone="muted" className="italic">
            {t.home.welcomeSubtitle}
          </Text>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAuthenticated ? (
            <Badge variant="success">
              {locale === "es"
                ? `SESIÓN ACTIVA: ${user?.email}`
                : `ACTIVE SESSION: ${user?.email}`}
            </Badge>
          ) : (
            <Badge variant="outline">
              {locale === "es"
                ? "MODO VISTA PREVIA (SIN SESIÓN)"
                : "PREVIEW MODE (UNAUTHENTICATED)"}
            </Badge>
          )}
        </div>
      </section>

      <StreakSummaryCard
        t={t}
        locale={locale}
        streakDaysCount={home.streakDaysCount}
        weeklyActiveDays={home.weeklyActiveDays}
        historySummary={home.historySummary}
        isAuthenticated={isAuthenticated}
      />

      <QuickGenerateCard t={t} locale={locale} />

      <RecentReadingsSection
        t={t}
        locale={locale}
        isAuthenticated={isAuthenticated}
        isLoadingData={home.isLoadingData}
        searchQuery={home.searchQuery}
        searchError={home.searchError}
        totalCount={home.sourceReadings.length}
        readings={home.filteredReadings}
        onSearchChange={home.setSearchQuery}
      />
    </Container>
  );
}
