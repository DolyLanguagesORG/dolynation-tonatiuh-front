"use client";

import {
  ActionLink,
  Badge,
  Card,
  Eyebrow,
  Heading,
  Icon,
  Text,
} from "@/components/ui";
import { type Dictionary, type Locale } from "@/i18n";
import { type SubscriptionUsage } from "@/lib";

export interface QuickGenerateCardProps {
  t: Dictionary;
  locale: Locale;
  canGenerateReadings?: boolean;
  subscriptionUsage?: SubscriptionUsage | null;
}

/**
 * Panel compacto de acceso directo al configurador de generación IA desde `/`.
 */
export function QuickGenerateCard({
  t,
  locale,
  canGenerateReadings = true,
  subscriptionUsage = null,
}: QuickGenerateCardProps) {
  const dailyReadingsRemaining = subscriptionUsage?.readingsRemainingToday;
  const dailyReadingsLimit = subscriptionUsage?.readingsLimit;
  const isDailyLimitReached =
    canGenerateReadings &&
    dailyReadingsLimit !== null &&
    dailyReadingsLimit !== undefined &&
    dailyReadingsRemaining === 0;

  return (
    <Card padding="md" as="section" className="border-default bg-surface">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Icon name="sparkles" size="sm" className="text-heading" />
            <Eyebrow as="span" tone="heading">
              {t.home.generateSectionTitle}
            </Eyebrow>
            <Badge
              variant={
                !canGenerateReadings || isDailyLimitReached
                  ? "warning"
                  : "outline"
              }
            >
              {!canGenerateReadings
                ? t.home.preferencesSetupBadge
                : dailyReadingsLimit != null
                  ? locale === "es"
                    ? `${dailyReadingsRemaining ?? 0}/${dailyReadingsLimit} HOY`
                    : `${dailyReadingsRemaining ?? 0}/${dailyReadingsLimit} LEFT TODAY`
                  : locale === "es"
                    ? "LECTURAS ILIMITADAS"
                    : "UNLIMITED READINGS"}
            </Badge>
          </div>
          <Heading as="h2" variant="subsection">
            {locale === "es"
              ? "Prepara una nueva sesión de lectura adaptada con IA"
              : "Prepare a new AI-tailored reading session"}
          </Heading>
          <Text variant="small" tone="muted">
            {!canGenerateReadings
              ? t.home.preferencesSetupBody
              : isDailyLimitReached
                ? locale === "es"
                  ? "Alcanzaste tu cupo diario de generación en tu plan actual. Revisa tus lecturas pendientes o administra tu plan."
                  : "You reached your daily generation quota on your current plan. Review pending readings or manage your plan."
                : t.home.estimatedTime}
          </Text>
        </div>

        {canGenerateReadings ? (
          <ActionLink
            href={isDailyLimitReached ? "/readings" : "/generate"}
            variant="primary"
            size="md"
            leftIcon={
              <Icon
                name={isDailyLimitReached ? "book-open" : "sparkles"}
                size="sm"
              />
            }
            rightIcon={<Icon name="arrow-right" size="sm" />}
            className="shrink-0 normal-case tracking-normal"
          >
            {isDailyLimitReached
              ? locale === "es"
                ? "Ver lecturas"
                : "View readings"
              : t.home.generateButton}
          </ActionLink>
        ) : (
          <ActionLink
            href="/setup-preferences"
            variant="secondary"
            size="md"
            leftIcon={<Icon name="sliders" size="sm" />}
            rightIcon={<Icon name="arrow-right" size="sm" />}
            className="shrink-0 normal-case tracking-normal"
          >
            {t.home.generationBlockedCta}
          </ActionLink>
        )}
      </div>
    </Card>
  );
}
