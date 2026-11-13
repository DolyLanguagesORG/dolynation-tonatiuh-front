"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/context";
import { useLocale } from "@/i18n";
import {
  ApiClientError,
  type CategoriesSettings,
  DEFAULT_CATEGORIES,
  DEFAULT_LANGUAGES,
  historyService,
  type HistorySummary,
  type LanguagesSettings,
  settingsService,
  type TargetLanguageCode,
  type UserProfile,
  usersService,
} from "@/lib";

const FALLBACK_28_DAYS: readonly boolean[] = Array.from(
  { length: 28 },
  (_, index) => index % 6 !== 2,
);

/**
 * Hook de datos y mutaciones para la vista de Perfil y Progreso (`/profile`).
 */
export function useProfileData() {
  const { locale, t } = useLocale();
  const { user, isAuthenticated, refreshSession } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [historySummary, setHistorySummary] = useState<HistorySummary | null>(
    null,
  );
  const [streakDays, setStreakDays] = useState<readonly boolean[]>(
    FALLBACK_28_DAYS,
  );
  const [languagesSettings, setLanguagesSettings] =
    useState<LanguagesSettings | null>(null);
  const [categoriesSettings, setCategoriesSettings] =
    useState<CategoriesSettings | null>(null);

  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  const fetchKey = isAuthenticated ? `${user?.id ?? "me"}-${locale}` : null;
  const isLoading = Boolean(fetchKey && loadedKey !== fetchKey);

  useEffect(() => {
    if (!fetchKey) return;

    let cancelled = false;

    Promise.allSettled([
      usersService.getProfile(),
      usersService.getStreak({ days: 28 }),
      historyService.getSummary(),
      settingsService.getLanguages(),
      settingsService.getCategories(),
    ])
      .then(([profileRes, streakRes, historyRes, langsRes, catsRes]) => {
        if (cancelled) return;

        if (profileRes.status === "fulfilled" && profileRes.value.data) {
          setProfile(profileRes.value.data);
        }
        if (
          streakRes.status === "fulfilled" &&
          Array.isArray(streakRes.value.data?.days)
        ) {
          const raw = streakRes.value.data.days;
          if (raw.length > 0) {
            const normalized = Array.from({ length: 28 }, (_, idx) => {
              const offset = Math.max(0, 28 - raw.length);
              return idx >= offset ? Boolean(raw[idx - offset]) : false;
            });
            setStreakDays(normalized);
          }
        }
        if (historyRes.status === "fulfilled" && historyRes.value.data) {
          setHistorySummary(historyRes.value.data);
        }
        if (langsRes.status === "fulfilled" && langsRes.value.data) {
          setLanguagesSettings(langsRes.value.data);
        }
        if (catsRes.status === "fulfilled" && catsRes.value.data) {
          setCategoriesSettings(catsRes.value.data);
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
  }, [fetchKey]);

  const handleUpdateFullName = async (nextName: string): Promise<boolean> => {
    const clean = nextName.trim();
    if (!clean) return false;

    setIsSavingProfile(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      const updated = await usersService.updateProfile({ fullName: clean });
      setProfile(updated.data);
      await refreshSession();
      setNotice(t.profile.savedProfileNotice);
      return true;
    } catch (err) {
      setErrorMessage(
        err instanceof ApiClientError
          ? err.getUserMessage(locale)
          : locale === "es"
            ? "No fue posible actualizar el perfil."
            : "Could not update profile.",
      );
      return false;
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleToggleCategory = async (categoryId: string): Promise<void> => {
    if (isSavingPreferences) return;

    const currentSelected = categoriesSettings?.selected ?? [];
    const exists = currentSelected.includes(categoryId);
    const nextCategories = exists
      ? currentSelected.filter((id) => id !== categoryId)
      : [...currentSelected, categoryId];

    setIsSavingPreferences(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      const res = await settingsService.updateCategories({
        categories: nextCategories,
      });
      setCategoriesSettings(res.data);
      setNotice(t.profile.savedPreferencesNotice);
    } catch (err) {
      setErrorMessage(
        err instanceof ApiClientError
          ? err.getUserMessage(locale)
          : locale === "es"
            ? "No fue posible actualizar tus categorías."
            : "Could not update favorite categories.",
      );
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handlePromoteLanguage = async (
    code: TargetLanguageCode,
  ): Promise<void> => {
    if (isSavingPreferences) return;
    const current =
      languagesSettings?.selected && languagesSettings.selected.length > 0
        ? languagesSettings.selected
        : profile?.selectedLanguages ?? [];
    if (!current.includes(code) || current[0] === code) {
      return;
    }

    const reordered: TargetLanguageCode[] = [
      code,
      ...current.filter((item) => item !== code),
    ];

    setIsSavingPreferences(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      const res = await settingsService.reorderLanguages({
        languages: reordered,
      });
      setLanguagesSettings(res.data);
      setNotice(t.profile.savedPreferencesNotice);
    } catch (err) {
      setErrorMessage(
        err instanceof ApiClientError
          ? err.getUserMessage(locale)
          : locale === "es"
            ? "No fue posible reordenar los idiomas."
            : "Could not reorder languages.",
      );
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const resolvedUser = profile ?? user;
  const resolvedCategories =
    categoriesSettings?.catalog && categoriesSettings.catalog.length > 0
      ? categoriesSettings.catalog
      : DEFAULT_CATEGORIES.map((c) => ({
          id: c.id,
          name: locale === "es" ? c.nameEs ?? c.name : c.nameEn ?? c.name,
        }));
  const selectedCategoryIds = categoriesSettings?.selected ?? [];

  const activeLanguageCodes: TargetLanguageCode[] =
    languagesSettings?.active && languagesSettings.active.length > 0
      ? languagesSettings.active
      : languagesSettings?.selected && languagesSettings.selected.length > 0
        ? languagesSettings.selected
        : profile?.selectedLanguages ?? ["en"];

  const activeLanguageItems = activeLanguageCodes.map((code, index) => {
    const meta = DEFAULT_LANGUAGES.find((item) => item.id === code);
    return {
      code,
      name: meta ? (locale === "es" ? meta.nameEs : meta.nameEn) : code.toUpperCase(),
      isPrimary: index === 0,
    };
  });

  return {
    locale,
    t,
    resolvedUser,
    historySummary,
    streakDays,
    resolvedCategories,
    selectedCategoryIds,
    activeLanguageItems,
    isLoading,
    isSavingProfile,
    isSavingPreferences,
    notice,
    setNotice,
    errorMessage,
    setErrorMessage,
    handleUpdateFullName,
    handleToggleCategory,
    handlePromoteLanguage,
  };
}
