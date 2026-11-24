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
import { type Dictionary, formatMessage } from "@/i18n";
import { type FriendStreakDto } from "@/lib";

export interface FriendStreaksBannerProps {
  t: Dictionary;
  streaks: readonly FriendStreakDto[];
}

/**
 * Bloque rápido en `/` que destaca únicamente las lecturas diarias de racha con amigos
 * pendientes de contestar por el estudiante antes de medianoche.
 */
export function FriendStreaksBanner({ t, streaks }: FriendStreaksBannerProps) {
  if (streaks.length === 0) {
    return null;
  }

  return (
    <Card
      as="section"
      aria-label={t.home.friendStreaks.title}
      padding="md"
      className="flex flex-col gap-4 border-brand/30 bg-neutral-secondary-soft"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Eyebrow tone="muted">{t.home.friendStreaks.eyebrow}</Eyebrow>
        <ActionLink
          href="/friends?tab=streaks"
          variant="ghost"
          size="xs"
          rightIcon={<Icon name="arrow-right" size="xs" />}
          className="-mr-2 text-muted hover:text-heading"
        >
          {t.home.friendStreaks.manageAllLink}
        </ActionLink>
      </div>

      <div className="flex flex-col gap-1">
        <Heading as="h2" variant="subsection">
          {t.home.friendStreaks.title}
        </Heading>
        <Text variant="small" tone="muted">
          {t.home.friendStreaks.subtitle}
        </Text>
      </div>

      <div className="flex flex-col gap-2.5">
        {streaks.map((streak) => {
          const partnerName =
            streak.partnerName?.trim() || t.friends.anonymousName;
          const todayReadingId =
            streak.todayReadingId ?? streak.today?.myReadingId ?? null;
          const todayCategory =
            streak.todayCategory ?? streak.today?.category ?? null;

          if (todayReadingId === null) {
            return null;
          }

          return (
            <div
              key={streak.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-base border border-default bg-surface p-3.5"
            >
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-serif text-base font-bold text-heading">
                    {formatMessage(t.home.friendStreaks.withPartner, {
                      name: partnerName,
                    })}
                  </span>
                  <Badge variant="primary">
                    {formatMessage(t.home.friendStreaks.streakBadge, {
                      count: streak.currentStreak,
                    })}
                  </Badge>
                  {todayCategory && (
                    <Badge variant="outline">{todayCategory}</Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline">
                    {t.home.friendStreaks.myPendingBadge}
                  </Badge>
                  <Badge
                    variant={
                      streak.partnerCompletedToday ? "success" : "outline"
                    }
                  >
                    {streak.partnerCompletedToday
                      ? formatMessage(t.home.friendStreaks.partnerDoneBadge, {
                          name: partnerName,
                        })
                      : formatMessage(
                          t.home.friendStreaks.partnerPendingBadge,
                          { name: partnerName },
                        )}
                  </Badge>
                </div>
              </div>

              <ActionLink
                href={`/readings/${todayReadingId}`}
                variant="primary"
                size="sm"
                leftIcon={<Icon name="book-open" size="xs" />}
              >
                {t.home.friendStreaks.openTodayCta}
              </ActionLink>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
