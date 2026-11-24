"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/context";
import {
  formatMessage,
  getReadingFlowDictionary,
  type Locale,
  resolveReadingLanguage,
  useLocale,
} from "@/i18n";
import {
  formatReadingLanguageBadge,
  friendsService,
  type FriendStreakDto,
  getDateLocale,
  getDifficultyMeta,
  type ReadingDifficulty,
  type ReadingDto,
  type ReadingOriginType,
  readingsService,
  subscriptionsService,
  type SubscriptionUsage,
  type TargetLanguageCode,
  usersService,
} from "@/lib";

export interface HomeReadingItem {
  id: string;
  numericId: number | null;
  languageCode: TargetLanguageCode;
  languageLabel: string;
  difficultyLabel: string;
  difficultyVariant: "primary" | "secondary";
  timestampLabel: string;
  statusLabel: string;
  isCompleted: boolean;
  hasScore: boolean;
  originType?: ReadingOriginType;
  title: string;
  excerpt: string;
  durationLabel: string;
  metaLabel: string;
  searchKeywords: string;
  detailHref: string;
  feedbackHref: string;
}

/**
 * Transforma un `ReadingDto` en una tarjeta de resumen reciente inmersa en el propio
 * idioma de la lectura mientras conserva palabras clave bilingües para el buscador local.
 */
export function mapDtoToHomeReading(
  dto: ReadingDto,
  fallbackLocale: Locale = "es",
): HomeReadingItem {
  const cardLanguage = resolveReadingLanguage(dto.language, fallbackLocale);
  const cardDict = getReadingFlowDictionary(cardLanguage);
  const difficultyKey: ReadingDifficulty = dto.difficulty ?? "medium";
  const difficultyVariant: "primary" | "secondary" =
    difficultyKey === "hard" ? "primary" : "secondary";
  const words = dto.wordCount ?? Math.max(120, dto.content.split(/\s+/).length);
  const mins = Math.max(2, Math.round(words / 180));
  const isCompleted = dto.status === "completed";
  const hasScore = typeof dto.score === "number";

  const dateStr = new Date(dto.createdAt).toLocaleDateString(
    getDateLocale(cardLanguage),
    { day: "2-digit", month: "short", year: "numeric" },
  );

  const excerptSource = dto.description?.trim() || dto.content.trim();
  const excerpt =
    excerptSource.length > 190
      ? `"${excerptSource.slice(0, 187).trimEnd()}..."`
      : `"${excerptSource}"`;

  const languageLabel = formatReadingLanguageBadge(cardLanguage, cardLanguage);
  const difficultyLabel = getDifficultyMeta(
    difficultyKey,
    cardLanguage,
  ).label;
  const localeLanguageLabel = formatReadingLanguageBadge(
    cardLanguage,
    fallbackLocale,
  );
  const localeDifficultyMeta = getDifficultyMeta(difficultyKey, fallbackLocale);

  return {
    id: `reading-${dto.id}`,
    numericId: dto.id,
    languageCode: cardLanguage,
    languageLabel,
    difficultyLabel,
    difficultyVariant,
    timestampLabel: dateStr,
    statusLabel: hasScore
      ? `${cardDict.readingCard.statusCompleted} (${dto.score}/100)`
      : isCompleted
        ? cardDict.readingCard.statusCompleted
        : cardDict.readingCard.statusPendingEvaluation,
    isCompleted,
    hasScore,
    ...(dto.originType ? { originType: dto.originType } : {}),
    title: dto.title,
    excerpt,
    durationLabel: `${mins} ${cardDict.readingCard.minReadUnit}`,
    metaLabel: `${words} ${cardDict.readingCard.wordsUnit}`,
    searchKeywords: [
      languageLabel,
      localeLanguageLabel,
      difficultyLabel,
      localeDifficultyMeta.label,
      dto.category ?? "",
    ]
      .join(" ")
      .toLowerCase(),
    detailHref: `/readings/${dto.id}`,
    feedbackHref: hasScore
      ? `/readings/${dto.id}/result`
      : `/readings/${dto.id}/evaluate`,
  };
}

/**
 * Hook de orquestación del panel de inicio (`/`): racha, resumen y lecturas recientes.
 */
export function useHomeDashboard() {
  const { locale, t } = useLocale();
  const { user, accessPhase, isAuthenticated, onboarding } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [liveReadings, setLiveReadings] = useState<HomeReadingItem[]>([]);
  const [streakCount, setStreakCount] = useState<number | null>(null);
  const [subscriptionUsage, setSubscriptionUsage] =
    useState<SubscriptionUsage | null>(null);
  const [weeklyActiveDays, setWeeklyActiveDays] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [friendStreaks, setFriendStreaks] = useState<FriendStreakDto[]>([]);

  const shouldLoadLive = isAuthenticated && accessPhase === "ready";
  const fetchKey = shouldLoadLive ? `${user?.id ?? "me"}-${locale}` : null;
  const isLoadingData = Boolean(fetchKey && loadedKey !== fetchKey);

  useEffect(() => {
    if (!fetchKey) {
      return;
    }

    let cancelled = false;

    Promise.allSettled([
      readingsService.listCompleted(),
      readingsService.listPending(),
      usersService.getStreak({ days: 7 }),
      subscriptionsService.getCurrentSubscription(),
      usersService.getProfile(),
      friendsService.listStreaks(),
    ])
      .then(
        ([
          completedRes,
          pendingRes,
          streakRes,
          subscriptionRes,
          profileRes,
          friendStreaksRes,
        ]) => {
          if (cancelled) return;

          const merged: ReadingDto[] = [];
          if (
            completedRes.status === "fulfilled" &&
            Array.isArray(completedRes.value.data)
          ) {
            merged.push(...completedRes.value.data);
          }
          if (
            pendingRes.status === "fulfilled" &&
            Array.isArray(pendingRes.value.data)
          ) {
            merged.push(...pendingRes.value.data);
          }

          merged.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );

          setLiveReadings(
            merged.slice(0, 6).map((dto) => mapDtoToHomeReading(dto, locale)),
          );

          if (
            profileRes.status === "fulfilled" &&
            profileRes.value.data &&
            typeof profileRes.value.data.currentStreak === "number"
          ) {
            setStreakCount(profileRes.value.data.currentStreak);
          }

          if (streakRes.status === "fulfilled" && streakRes.value.data) {
            if (Array.isArray(streakRes.value.data.days)) {
              const flags = streakRes.value.data.days.slice(-7);
              if (flags.length > 0) {
                const padded = Array.from({ length: 7 }, (_, i) => {
                  const offset = 7 - flags.length;
                  return i >= offset ? Boolean(flags[i - offset]) : false;
                });
                setWeeklyActiveDays(padded);
              }
            }
          }

          if (
            subscriptionRes.status === "fulfilled" &&
            subscriptionRes.value.data
          ) {
            setSubscriptionUsage(subscriptionRes.value.data.usage);
          }

          if (
            friendStreaksRes.status === "fulfilled" &&
            Array.isArray(friendStreaksRes.value.data)
          ) {
            setFriendStreaks(friendStreaksRes.value.data);
          } else {
            setFriendStreaks([]);
          }
        },
      )
      .finally(() => {
        if (!cancelled) {
          setLoadedKey(fetchKey);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetchKey, locale]);

  const firstNameDisplay =
    user?.fullName?.trim().split(/\s+/)[0] ||
    user?.email?.split("@")[0] ||
    "";

  const welcomeHeading = firstNameDisplay
    ? formatMessage(t.home.welcomeWithName, { name: firstNameDisplay })
    : t.home.welcomeHeading;

  const streakDaysCount = streakCount ?? user?.currentStreak ?? 0;

  const searchError =
    searchQuery.trim().length > 40 ? t.home.searchMaxLengthError : undefined;

  const sourceReadings = liveReadings;

  const filteredReadings = sourceReadings.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || searchError) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.languageLabel.toLowerCase().includes(q) ||
      item.difficultyLabel.toLowerCase().includes(q) ||
      item.searchKeywords.includes(q)
    );
  });

  const pendingFriendStreaks = friendStreaks.filter((item) => {
    const todayReadingId =
      item.todayReadingId ?? item.today?.myReadingId ?? null;
    return (
      item.status === "active" &&
      !item.myCompletedToday &&
      todayReadingId !== null
    );
  });

  return {
    locale,
    t,
    user,
    isAuthenticated,
    onboarding,
    welcomeHeading,
    streakDaysCount,
    weeklyActiveDays,
    subscriptionUsage,
    pendingFriendStreaks,
    isLoadingData,
    searchQuery,
    setSearchQuery,
    searchError,
    sourceReadings,
    filteredReadings,
  };
}
