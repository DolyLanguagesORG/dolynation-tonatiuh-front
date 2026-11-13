"use client";

import { OnboardingGateBanner } from "@/app/_components/onboarding-gate-banner";
import { QuickGenerateCard } from "@/app/_components/quick-generate-card";
import { RecentReadingsSection } from "@/app/_components/recent-readings-section";
import { StreakSummaryCard } from "@/app/_components/streak-summary-card";
import { useHomeDashboard } from "@/app/_hooks/use-home-dashboard";
import { ActionLink, Alert, Badge, Container, Heading, Icon, Text } from "@/components/ui";

/**
 * Orquestador interactivo de la pantalla principal (`/`).
 */
export function HomeDashboard() {
  const home = useHomeDashboard();
  const { locale, t, isAuthenticated, onboarding, user } = home;

  if (!isAuthenticated) {
    return null;
  }

  if (!onboarding.hasSelectedPlan) {
    return (
      <OnboardingGateBanner t={t} onboarding={onboarding} mode="plan" />
    );
  }

  const canGenerateReadings = onboarding.canGenerateReadings;

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
          <Badge variant="success">
            {locale === "es"
              ? `SESIÓN ACTIVA: ${user?.email}`
              : `ACTIVE SESSION: ${user?.email}`}
          </Badge>
        </div>
      </section>

      {isAuthenticated && !onboarding.canGenerateReadings && (
        <Alert variant="warning" title={t.home.preferencesSetupTitle}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{t.home.preferencesSetupBody}</span>
            <ActionLink
              href="/setup-preferences"
              variant="primary"
              size="sm"
              rightIcon={<Icon name="arrow-right" size="xs" />}
              className="shrink-0 normal-case tracking-normal"
            >
              {t.home.preferencesSetupCta}
            </ActionLink>
          </div>
        </Alert>
      )}

      <StreakSummaryCard
        t={t}
        locale={locale}
        streakDaysCount={home.streakDaysCount}
        weeklyActiveDays={home.weeklyActiveDays}
        historySummary={home.historySummary}
        isAuthenticated={isAuthenticated}
      />

      <QuickGenerateCard
        t={t}
        locale={locale}
        canGenerateReadings={canGenerateReadings}
        subscriptionUsage={home.subscriptionUsage}
      />

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
