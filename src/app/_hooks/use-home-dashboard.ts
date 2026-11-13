"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/context";
import { useLocale } from "@/i18n";
import {
  historyService,
  type HistorySummary,
  type ReadingDifficulty,
  type ReadingDto,
  readingsService,
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
  title: string;
  excerpt: string;
  durationLabel: string;
  metaLabel: string;
  detailHref: string;
  feedbackHref: string;
}

const PREVIEW_READINGS_ES: readonly HomeReadingItem[] = [
  {
    id: "preview-cloud-systems",
    numericId: null,
    languageCode: "en",
    languageLabel: "[EN] INGLÉS",
    difficultyLabel: "NIVEL MEDIO",
    difficultyVariant: "secondary",
    timestampLabel: "Hoy, 10:30 AM",
    statusLabel: "COMPLETADA (92/100)",
    isCompleted: true,
    hasScore: true,
    title: "The Architecture of Modern Cloud Systems",
    excerpt:
      '"Distributed infrastructure relies on deterministic latency bounds and asynchronous consensus algorithms to guarantee continuous convergence under network partition..."',
    durationLabel: "5 MIN LECTURA",
    metaLabel: "8 ANOTACIONES GUARDADAS",
    detailHref: "/login",
    feedbackHref: "/login",
  },
  {
    id: "preview-ia-societe",
    numericId: null,
    languageCode: "fr",
    languageLabel: "[FR] FRANCÉS",
    difficultyLabel: "NIVEL ALTO",
    difficultyVariant: "primary",
    timestampLabel: "Ayer, 18:45",
    statusLabel: "COMPLETADA (88/100)",
    isCompleted: true,
    hasScore: true,
    title: "L'intelligence Artificielle et la Société",
    excerpt:
      '"Bien que les mutations technologiques induisent une réorganisation globale du travail, la question fondamentale demeure celle de l\'autonomie critique des institutions..."',
    durationLabel: "7 MIN LECTURA",
    metaLabel: "14 ANOTACIONES GUARDADAS",
    detailHref: "/login",
    feedbackHref: "/login",
  },
];

const PREVIEW_READINGS_EN: readonly HomeReadingItem[] = [
  {
    id: "preview-cloud-systems",
    numericId: null,
    languageCode: "en",
    languageLabel: "[EN] ENGLISH",
    difficultyLabel: "MEDIUM LEVEL",
    difficultyVariant: "secondary",
    timestampLabel: "Today, 10:30 AM",
    statusLabel: "COMPLETED (92/100)",
    isCompleted: true,
    hasScore: true,
    title: "The Architecture of Modern Cloud Systems",
    excerpt:
      '"Distributed infrastructure relies on deterministic latency bounds and asynchronous consensus algorithms to guarantee continuous convergence under network partition..."',
    durationLabel: "5 MIN READ",
    metaLabel: "8 SAVED ANNOTATIONS",
    detailHref: "/login",
    feedbackHref: "/login",
  },
  {
    id: "preview-ia-societe",
    numericId: null,
    languageCode: "fr",
    languageLabel: "[FR] FRENCH",
    difficultyLabel: "HIGH LEVEL",
    difficultyVariant: "primary",
    timestampLabel: "Yesterday, 18:45",
    statusLabel: "COMPLETED (88/100)",
    isCompleted: true,
    hasScore: true,
    title: "L'intelligence Artificielle et la Société",
    excerpt:
      '"Bien que les mutations technologiques induisent une réorganisation globale du travail, la question fondamentale demeure celle de l\'autonomie critique des institutions..."',
    durationLabel: "7 MIN READ",
    metaLabel: "14 SAVED ANNOTATIONS",
    detailHref: "/login",
    feedbackHref: "/login",
  },
];

function formatLanguageTag(code: TargetLanguageCode, locale: "es" | "en"): string {
  const names: Record<TargetLanguageCode, { es: string; en: string }> = {
    en: { es: "INGLÉS", en: "ENGLISH" },
    fr: { es: "FRANCÉS", en: "FRENCH" },
    it: { es: "ITALIANO", en: "ITALIAN" },
    es: { es: "ESPAÑOL", en: "SPANISH" },
  };
  const label = names[code]?.[locale] ?? code.toUpperCase();
  return `[${code.toUpperCase()}] ${label}`;
}

function formatDifficultyTag(
  difficulty: ReadingDifficulty | null,
  locale: "es" | "en",
): { label: string; variant: "primary" | "secondary" } {
  if (difficulty === "hard") {
    return {
      label: locale === "es" ? "NIVEL ALTO" : "HIGH LEVEL",
      variant: "primary",
    };
  }
  if (difficulty === "easy") {
    return {
      label: locale === "es" ? "NIVEL BAJO" : "LOW LEVEL",
      variant: "secondary",
    };
  }
  return {
    label: locale === "es" ? "NIVEL MEDIO" : "MEDIUM LEVEL",
    variant: "secondary",
  };
}

function mapDtoToHomeReading(
  dto: ReadingDto,
  locale: "es" | "en",
): HomeReadingItem {
  const diff = formatDifficultyTag(dto.difficulty, locale);
  const words = dto.wordCount ?? Math.max(120, dto.content.split(/\s+/).length);
  const mins = Math.max(2, Math.round(words / 180));
  const isCompleted = dto.status === "completed";
  const hasScore = typeof dto.score === "number";

  const dateStr = new Date(dto.createdAt).toLocaleDateString(
    locale === "es" ? "es-MX" : "en-US",
    { day: "2-digit", month: "short", year: "numeric" },
  );

  const excerptSource = dto.description?.trim() || dto.content.trim();
  const excerpt =
    excerptSource.length > 190
      ? `"${excerptSource.slice(0, 187).trimEnd()}..."`
      : `"${excerptSource}"`;

  return {
    id: `reading-${dto.id}`,
    numericId: dto.id,
    languageCode: dto.language,
    languageLabel: formatLanguageTag(dto.language, locale),
    difficultyLabel: diff.label,
    difficultyVariant: diff.variant,
    timestampLabel: dateStr,
    statusLabel: hasScore
      ? `${locale === "es" ? "COMPLETADA" : "COMPLETED"} (${dto.score}/100)`
      : isCompleted
        ? locale === "es"
          ? "COMPLETADA"
          : "COMPLETED"
        : locale === "es"
          ? "PENDIENTE DE EVALUACIÓN"
          : "PENDING EVALUATION",
    isCompleted,
    hasScore,
    title: dto.title,
    excerpt,
    durationLabel:
      locale === "es" ? `${mins} MIN LECTURA` : `${mins} MIN READ`,
    metaLabel: `${words} ${locale === "es" ? "PALABRAS" : "WORDS"}`,
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
  const { user, isAuthenticated, onboarding } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [liveReadings, setLiveReadings] = useState<HomeReadingItem[]>([]);
  const [historySummary, setHistorySummary] = useState<HistorySummary | null>(
    null,
  );
  const [weeklyActiveDays, setWeeklyActiveDays] = useState<boolean[]>([
    true,
    true,
    true,
    true,
    true,
    true,
    true,
  ]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const shouldLoadLive = isAuthenticated && onboarding.isOnboardingComplete;
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
      historyService.getSummary(),
      usersService.getStreak({ days: 7 }),
    ])
      .then(([completedRes, pendingRes, summaryRes, streakRes]) => {
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

        if (summaryRes.status === "fulfilled" && summaryRes.value.data) {
          setHistorySummary(summaryRes.value.data);
        }

        if (
          streakRes.status === "fulfilled" &&
          Array.isArray(streakRes.value.data?.days)
        ) {
          const flags = streakRes.value.data.days.slice(-7);
          if (flags.length > 0) {
            const padded = Array.from({ length: 7 }, (_, i) => {
              const offset = 7 - flags.length;
              return i >= offset ? Boolean(flags[i - offset]) : false;
            });
            setWeeklyActiveDays(padded);
          }
        }
      })
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
    "Elena";

  const welcomeHeading =
    locale === "es"
      ? `Bienvenido de vuelta, ${firstNameDisplay}.`
      : `Welcome back, ${firstNameDisplay}.`;

  const streakDaysCount = user?.currentStreak ?? (isAuthenticated ? 0 : 14);

  const searchError =
    searchQuery.trim().length > 40
      ? locale === "es"
        ? "El término de filtrado no debe exceder 40 caracteres."
        : "Filter query must not exceed 40 characters."
      : undefined;

  const sourceReadings = isAuthenticated
    ? liveReadings
    : locale === "es"
      ? PREVIEW_READINGS_ES
      : PREVIEW_READINGS_EN;

  const filteredReadings = sourceReadings.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || searchError) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.languageLabel.toLowerCase().includes(q) ||
      item.difficultyLabel.toLowerCase().includes(q)
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
    historySummary,
    isLoadingData,
    searchQuery,
    setSearchQuery,
    searchError,
    sourceReadings,
    filteredReadings,
  };
}
