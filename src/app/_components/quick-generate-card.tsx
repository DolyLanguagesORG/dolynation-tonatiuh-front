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
import { formatMessage, type Dictionary, type Locale } from "@/i18n";
import { type SubscriptionUsage } from "@/lib";

export interface QuickGenerateCardProps {
  t: Dictionary;
  locale?: Locale;
  canGenerateReadings?: boolean;
  subscriptionUsage?: SubscriptionUsage | null;
}

/**
 * Panel compacto de acceso directo al configurador de generación IA desde `/`.
 */
export function QuickGenerateCard({
  t,
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
                  ? formatMessage(t.home.quickDailyRemainingBadge, {
                      remaining: dailyReadingsRemaining ?? 0,
                      limit: dailyReadingsLimit,
                    })
                  : t.study.unlimitedReadingsBadge}
            </Badge>
          </div>
          <Heading as="h2" variant="subsection">
            {t.home.quickGenerateHeading}
          </Heading>
          <Text variant="small" tone="muted">
            {!canGenerateReadings
              ? t.home.preferencesSetupBody
              : isDailyLimitReached
                ? t.home.dailyQuotaReachedDesc
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
              ? t.home.viewReadingsButton
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
