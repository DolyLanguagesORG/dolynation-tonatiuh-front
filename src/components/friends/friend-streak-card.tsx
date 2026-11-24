"use client";

import {
  ActionLink,
  Alert,
  Badge,
  Button,
  Card,
  Heading,
  Icon,
  Text,
} from "@/components/ui";
import { type Dictionary, formatMessage, type Locale } from "@/i18n";
import { formatReadingLanguageBadge, type FriendStreakDto } from "@/lib";

export interface FriendStreakCardProps {
  t: Dictionary;
  locale: Locale;
  streak: FriendStreakDto;
  onAccept?: (streak: FriendStreakDto) => void;
  onReject?: (streak: FriendStreakDto) => void;
  onEditCategories?: (streak: FriendStreakDto) => void;
  onEnd?: (streak: FriendStreakDto) => void;
  isMutating?: boolean;
}

function resolveStatusMeta(
  status: FriendStreakDto["status"],
  t: Dictionary,
): {
  label: string;
  variant: "primary" | "secondary" | "outline" | "success" | "warning";
} {
  switch (status) {
    case "active":
      return { label: t.friends.streakCard.statusActive, variant: "success" };
    case "pending_partner":
      return { label: t.friends.streakCard.statusPending, variant: "outline" };
    case "paused":
      return { label: t.friends.streakCard.statusPaused, variant: "warning" };
    default:
      return { label: t.friends.streakCard.statusEnded, variant: "secondary" };
  }
}

/**
 * Tarjeta editorial de racha diaria compartida entre dos amigos.
 * Respeta privacidad estricta: solo muestra conteo, pool de 4 categorías, booleano diario y enlace propio.
 */
export function FriendStreakCard({
  t,
  locale,
  streak,
  onAccept,
  onReject,
  onEditCategories,
  onEnd,
  isMutating = false,
}: FriendStreakCardProps) {
  const partnerName =
    streak.partnerName?.trim() || t.friends.anonymousName;
  const statusMeta = resolveStatusMeta(streak.status, t);

  const awaitingMe =
    streak.status === "pending_partner" &&
    (typeof streak.awaitingMyAcceptance === "boolean"
      ? streak.awaitingMyAcceptance
      : typeof streak.isInitiator === "boolean"
        ? !streak.isInitiator
        : streak.initiatedByUserId === streak.partnerUserId);

  const awaitingPartner = streak.status === "pending_partner" && !awaitingMe;

  const difficultyLabel =
    t.study.difficulties[streak.difficulty]?.shortLabel ??
    streak.difficulty.toUpperCase();
  const sizeLabel =
    t.study.sizeOptions[streak.size]?.label ?? streak.size.toUpperCase();

  const poolCategories =
    streak.categoryPool.length > 0
      ? streak.categoryPool
      : Array.from(
          new Set([...streak.myCategories, ...streak.partnerCategories]),
        );

  const todayCategory = streak.todayCategory ?? streak.today?.category ?? null;
  const todayStatus = streak.todayStatus ?? streak.today?.status ?? null;
  const todayReadingId =
    streak.todayReadingId ?? streak.today?.myReadingId ?? null;

  return (
    <Card as="article" padding="md" className="flex flex-col gap-4 border-default">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Heading as="h3" variant="subsection">
              {partnerName}
            </Heading>
            <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">
              {formatReadingLanguageBadge(streak.language, locale)}
            </Badge>
            <Badge variant="outline">{difficultyLabel}</Badge>
            <Badge variant="outline">{sizeLabel}</Badge>
          </div>
        </div>

        <div className="flex items-center gap-4 border border-default bg-neutral-secondary-soft px-3 py-2">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] font-semibold tracking-wider text-muted uppercase">
              {t.friends.streakCard.currentStreakLabel}
            </span>
            <span className="font-serif text-lg font-bold text-heading tabular-nums">
              {formatMessage(t.friends.streakCard.daysValue, {
                count: streak.currentStreak,
              })}
            </span>
          </div>
          <div className="h-7 w-px bg-default" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="font-mono text-[10px] font-semibold tracking-wider text-muted uppercase">
              {t.friends.streakCard.longestStreakLabel}
            </span>
            <span className="font-mono text-sm font-bold text-heading tabular-nums">
              {formatMessage(t.friends.streakCard.daysValue, {
                count: streak.longestStreak,
              })}
            </span>
          </div>
        </div>
      </div>

      {awaitingPartner && (
        <Alert variant="info">
          {formatMessage(t.friends.streakCard.awaitingPartnerNotice, {
            name: partnerName,
          })}
        </Alert>
      )}

      {awaitingMe && (
        <Alert variant="info">
          {formatMessage(t.friends.streakCard.awaitingYouNotice, {
            name: partnerName,
          })}
        </Alert>
      )}

      {todayStatus === "generation_failed" && (
        <Alert variant="warning">
          {t.friends.streakCard.generationFailedNotice}
        </Alert>
      )}

      <div className="flex flex-col gap-2 border-t border-default pt-3">
        <Text
          variant="caption"
          tone="muted"
          className="font-mono font-semibold uppercase"
        >
          {t.friends.streakCard.poolLabel}
        </Text>
        <div className="flex flex-wrap gap-1.5">
          {poolCategories.map((category) => (
            <Badge key={category} variant="outline">
              {category}
            </Badge>
          ))}
        </div>
        <div className="grid gap-1 text-xs text-muted sm:grid-cols-2">
          <span>
            <strong className="text-heading">
              {t.friends.streakCard.myCategoriesLabel}:
            </strong>{" "}
            {streak.myCategories.join(", ") || "—"}
          </span>
          <span>
            <strong className="text-heading">
              {formatMessage(t.friends.streakCard.partnerCategoriesLabel, {
                name: partnerName,
              })}
              :
            </strong>{" "}
            {streak.partnerCategories.join(", ") || "—"}
          </span>
        </div>
      </div>

      {(streak.status === "active" || streak.status === "paused") && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {todayCategory && (
              <Badge variant="primary">
                {formatMessage(t.friends.streakCard.todayCategoryLabel, {
                  category: todayCategory,
                })}
              </Badge>
            )}
            <Badge variant={streak.myCompletedToday ? "success" : "outline"}>
              {streak.myCompletedToday
                ? t.friends.streakCard.myStatusCompleted
                : t.friends.streakCard.myStatusPending}
            </Badge>
            <Badge
              variant={streak.partnerCompletedToday ? "success" : "outline"}
            >
              {streak.partnerCompletedToday
                ? formatMessage(t.friends.streakCard.partnerStatusCompleted, {
                    name: partnerName,
                  })
                : formatMessage(t.friends.streakCard.partnerStatusPending, {
                    name: partnerName,
                  })}
            </Badge>
          </div>

          {streak.status === "active" && todayReadingId !== null && (
            <ActionLink
              href={`/readings/${todayReadingId}`}
              variant="primary"
              size="sm"
              leftIcon={<Icon name="book-open" size="xs" />}
            >
              {t.friends.hub.streaksTab.openTodayButton}
            </ActionLink>
          )}
        </div>
      )}

      {streak.status !== "ended" && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-default pt-3">
          <Text variant="caption" tone="muted">
            {t.friends.streakCard.privacyFootnote}
          </Text>

          <div className="flex flex-wrap items-center gap-2">
            {awaitingMe && onAccept && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isMutating}
                onClick={() => onAccept(streak)}
              >
                {t.friends.hub.streaksTab.acceptProposalButton}
              </Button>
            )}
            {awaitingMe && onReject && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isMutating}
                onClick={() => onReject(streak)}
              >
                {t.friends.hub.streaksTab.rejectProposalButton}
              </Button>
            )}
            {!awaitingMe && onEditCategories && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isMutating}
                onClick={() => onEditCategories(streak)}
              >
                {t.friends.hub.streaksTab.editCategoriesButton}
              </Button>
            )}
            {!awaitingMe && onEnd && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isMutating}
                onClick={() => onEnd(streak)}
              >
                {t.friends.hub.streaksTab.endStreakButton}
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
