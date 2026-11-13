"use client";

import { useRouter } from "next/navigation";
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
  MIN_USER_CATEGORIES,
  settingsService,
  subscriptionsService,
  type SubscriptionTier,
  type TargetLanguageCode,
  type UserProfile,
  type UserSubscriptionResponse,
  usersService,
} from "@/lib";
import { useSubscriptionPlans } from "@/lib/hooks/use-subscription-plans";

const EMPTY_28_DAYS: readonly boolean[] = Array.from(
  { length: 28 },
  () => false,
);

/**
 * Hook de datos y mutaciones para la vista de Perfil y Progreso (`/profile`).
 */
export function useProfileData() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const {
    user,
    isAuthenticated,
    reloadAccountState,
    refreshPreferences,
    selectPlan,
    selectLanguages,
    logoutAll,
  } = useAuth();
  const {
    plans,
    isLoading: isLoadingPlans,
    error: plansError,
  } = useSubscriptionPlans(locale);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [historySummary, setHistorySummary] = useState<HistorySummary | null>(
    null,
  );
  const [streakDays, setStreakDays] = useState<readonly boolean[]>(EMPTY_28_DAYS);
  const [streakCount, setStreakCount] = useState<number | null>(null);
  const [currentSubscription, setCurrentSubscription] =
    useState<UserSubscriptionResponse | null>(null);
  const [languagesSettings, setLanguagesSettings] =
    useState<LanguagesSettings | null>(null);
  const [categoriesSettings, setCategoriesSettings] =
    useState<CategoriesSettings | null>(null);
  const [draftCategoryIds, setDraftCategoryIds] = useState<string[] | null>(null);
  const [customCategoryItems, setCustomCategoryItems] = useState<
    { id: string; name: string }[]
  >([]);

  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isUnlockingLanguage, setIsUnlockingLanguage] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

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
      subscriptionsService.getCurrentSubscription(),
    ])
      .then(
        ([
          profileRes,
          streakRes,
          historyRes,
          langsRes,
          catsRes,
          subscriptionRes,
        ]) => {
          if (cancelled) return;

          if (profileRes.status === "fulfilled" && profileRes.value.data) {
            setProfile(profileRes.value.data);
            if (typeof profileRes.value.data.currentStreak === "number") {
              setStreakCount(profileRes.value.data.currentStreak);
            }
          }
          if (streakRes.status === "fulfilled" && streakRes.value.data) {
            if (Array.isArray(streakRes.value.data.days)) {
              const raw = streakRes.value.data.days;
              if (raw.length > 0) {
                const normalized = Array.from({ length: 28 }, (_, idx) => {
                  const offset = Math.max(0, 28 - raw.length);
                  return idx >= offset ? Boolean(raw[idx - offset]) : false;
                });
                setStreakDays(normalized);
              }
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
          if (
            subscriptionRes.status === "fulfilled" &&
            subscriptionRes.value.data
          ) {
            setCurrentSubscription(subscriptionRes.value.data);
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
      await reloadAccountState();
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

  const commitCategories = async (nextCategories: string[]): Promise<boolean> => {
    setIsSavingPreferences(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      const res = await settingsService.updateCategories({
        categories: nextCategories,
      });
      setCategoriesSettings(res.data);
      setDraftCategoryIds(null);
      await refreshPreferences();
      setNotice(t.profile.savedPreferencesNotice);
      return true;
    } catch (err) {
      setErrorMessage(
        err instanceof ApiClientError
          ? err.getUserMessage(locale)
          : locale === "es"
            ? "No fue posible actualizar tus categorías."
            : "Could not update favorite categories.",
      );
      return false;
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleToggleCategory = async (categoryId: string): Promise<void> => {
    if (isSavingPreferences) return;

    const savedCategories = categoriesSettings?.selected ?? [];
    const currentSelected = draftCategoryIds ?? savedCategories;
    const exists = currentSelected.some(
      (id) => id.toLowerCase() === categoryId.toLowerCase(),
    );
    const nextCategories = exists
      ? currentSelected.filter(
          (id) => id.toLowerCase() !== categoryId.toLowerCase(),
        )
      : [...currentSelected, categoryId];

    // Si ya tenía 3+ guardadas, no permitimos bajar de 3.
    if (
      exists &&
      savedCategories.length >= MIN_USER_CATEGORIES &&
      nextCategories.length < MIN_USER_CATEGORIES
    ) {
      setErrorMessage(t.profile.minCategoriesNotice);
      return;
    }

    // Si aún no alcanza el mínimo de 3 categorías, acumulamos en borrador local
    // hasta llegar a 3 antes de sincronizar con el backend.
    if (nextCategories.length < MIN_USER_CATEGORIES) {
      setErrorMessage(null);
      setDraftCategoryIds(nextCategories);
      return;
    }

    await commitCategories(nextCategories);
  };

  const handleAddCustomCategory = async (name: string): Promise<boolean> => {
    const clean = name.trim();
    if (clean.length < 2 || clean.length > 50) {
      setErrorMessage(
        locale === "es"
          ? "La categoría debe tener entre 2 y 50 caracteres."
          : "Category name must be between 2 and 50 characters.",
      );
      return false;
    }

    const currentSelected = draftCategoryIds ?? categoriesSettings?.selected ?? [];
    const alreadyExists = currentSelected.some(
      (id) => id.toLowerCase() === clean.toLowerCase(),
    );
    if (alreadyExists) {
      return true;
    }

    const nextCategories = [...currentSelected, clean];
    if (nextCategories.length < MIN_USER_CATEGORIES) {
      setCustomCategoryItems((prev) =>
        prev.some((item) => item.id.toLowerCase() === clean.toLowerCase())
          ? prev
          : [...prev, { id: clean, name: clean }],
      );
      setErrorMessage(null);
      setDraftCategoryIds(nextCategories);
      return true;
    }

    const ok = await commitCategories(nextCategories);
    if (ok) {
      setCustomCategoryItems((prev) =>
        prev.some((item) => item.id.toLowerCase() === clean.toLowerCase())
          ? prev
          : [...prev, { id: clean, name: clean }],
      );
    }
    return ok;
  };

  const handlePromoteLanguage = async (
    code: TargetLanguageCode,
  ): Promise<void> => {
    if (isSavingPreferences) return;
    const saved =
      languagesSettings?.selected && languagesSettings.selected.length > 0
        ? languagesSettings.selected
        : profile?.selectedLanguages ?? [];
    const active =
      languagesSettings?.active && languagesSettings.active.length > 0
        ? languagesSettings.active
        : saved;

    if (!active.includes(code) || active[0] === code) {
      return;
    }

    setIsSavingPreferences(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      if (saved.includes(code)) {
        const reordered: TargetLanguageCode[] = [
          code,
          ...saved.filter((item) => item !== code),
        ];
        const res = await settingsService.reorderLanguages({
          languages: reordered,
        });
        setLanguagesSettings(res.data);
        await refreshPreferences();
      } else {
        const maxSlots = languagesSettings?.maxLanguages ?? active.length;
        const nextSelection: TargetLanguageCode[] = [
          code,
          ...active.filter((item) => item !== code),
        ].slice(0, maxSlots);
        const updated = await selectLanguages(nextSelection);
        setLanguagesSettings(updated);
      }
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

  const handleUpdateLanguages = async (
    nextLanguages: TargetLanguageCode[],
  ): Promise<boolean> => {
    if (isSavingPreferences || nextLanguages.length === 0) return false;

    setIsSavingPreferences(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      const updated = await selectLanguages(nextLanguages);
      setLanguagesSettings(updated);
      const subRes = await subscriptionsService.getCurrentSubscription();
      setCurrentSubscription(subRes.data);
      setNotice(t.profile.savedPreferencesNotice);
      return true;
    } catch (err) {
      setErrorMessage(
        err instanceof ApiClientError
          ? err.getUserMessage(locale)
          : locale === "es"
            ? "No fue posible actualizar tus idiomas de estudio."
            : "Could not update study languages.",
      );
      return false;
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleUnlockLanguageChange = async (): Promise<boolean> => {
    if (isUnlockingLanguage) return false;

    setIsUnlockingLanguage(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      const res = await settingsService.unlockLanguageChange();
      setLanguagesSettings(res.data);
      await refreshPreferences();
      setNotice(
        locale === "es"
          ? "Cambio de idioma desbloqueado (+1 crédito disponible)."
          : "Language change unlocked (+1 credit available).",
      );
      return true;
    } catch (err) {
      setErrorMessage(
        err instanceof ApiClientError
          ? err.getUserMessage(locale)
          : locale === "es"
            ? "No fue posible desbloquear el cambio de idioma."
            : "Could not unlock language change.",
      );
      return false;
    } finally {
      setIsUnlockingLanguage(false);
    }
  };

  const handleSelectPlan = async (
    tier: SubscriptionTier,
  ): Promise<boolean> => {
    if (isSavingPlan) return false;

    setIsSavingPlan(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      const updatedSub = await selectPlan(tier);
      setCurrentSubscription(updatedSub);

      const [profileRes, langsRes, catsRes, freshSubRes] =
        await Promise.allSettled([
          usersService.getProfile(),
          settingsService.getLanguages(),
          settingsService.getCategories(),
          subscriptionsService.getCurrentSubscription(),
        ]);

      if (profileRes.status === "fulfilled" && profileRes.value.data) {
        setProfile(profileRes.value.data);
      }
      if (langsRes.status === "fulfilled" && langsRes.value.data) {
        setLanguagesSettings(langsRes.value.data);
      }
      if (catsRes.status === "fulfilled" && catsRes.value.data) {
        setCategoriesSettings(catsRes.value.data);
      }
      if (freshSubRes.status === "fulfilled" && freshSubRes.value.data) {
        setCurrentSubscription(freshSubRes.value.data);
      }

      const planDisplayName = updatedSub.plan?.name ?? tier;
      setNotice(
        locale === "es"
          ? `Plan actualizado a ${planDisplayName}.`
          : `Plan switched to ${planDisplayName}.`,
      );
      return true;
    } catch (err) {
      setErrorMessage(
        err instanceof ApiClientError
          ? err.getUserMessage(locale)
          : locale === "es"
            ? "No se pudo cambiar el plan de suscripción."
            : "Could not switch subscription plan.",
      );
      return false;
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleLogoutAll = async (): Promise<void> => {
    if (isLoggingOutAll) return;
    setIsLoggingOutAll(true);
    try {
      await logoutAll();
      router.replace("/login");
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  const resolvedUser = profile ?? user;
  const resolvedStreakCount = streakCount ?? resolvedUser?.currentStreak ?? 0;
  const baseCatalog =
    categoriesSettings?.catalog && categoriesSettings.catalog.length > 0
      ? categoriesSettings.catalog
      : DEFAULT_CATEGORIES.map((c) => ({
          id: c.id,
          name: locale === "es" ? c.nameEs ?? c.name : c.nameEn ?? c.name,
        }));

  const selectedCategoryIds = draftCategoryIds ?? (categoriesSettings?.selected ?? []);
  const catalogMap = new Map<string, { id: string; name: string }>();
  for (const item of baseCatalog) {
    const def = DEFAULT_CATEGORIES.find((d) => d.id === item.id);
    catalogMap.set(item.id.toLowerCase(), {
      id: item.id,
      name: def
        ? locale === "es"
          ? def.nameEs ?? item.name
          : def.nameEn ?? item.name
        : item.name,
    });
  }
  for (const item of [
    ...customCategoryItems,
    ...selectedCategoryIds.map((id) => ({ id, name: id })),
  ]) {
    const key = item.id.toLowerCase();
    if (!catalogMap.has(key)) {
      catalogMap.set(key, item);
    }
  }
  const resolvedCategories = Array.from(catalogMap.values());

  const activeLanguageCodes: TargetLanguageCode[] =
    languagesSettings?.active && languagesSettings.active.length > 0
      ? languagesSettings.active
      : languagesSettings?.selected && languagesSettings.selected.length > 0
        ? languagesSettings.selected
        : profile?.selectedLanguages ?? [];

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
    resolvedStreakCount,
    historySummary,
    streakDays,
    currentSubscription,
    plans,
    isLoadingPlans,
    plansError,
    languagesSettings,
    resolvedCategories,
    selectedCategoryIds,
    activeLanguageItems,
    isLoading,
    isSavingProfile,
    isSavingPreferences,
    isUnlockingLanguage,
    isSavingPlan,
    isLoggingOutAll,
    notice,
    setNotice,
    errorMessage,
    setErrorMessage,
    handleUpdateFullName,
    handleToggleCategory,
    handleAddCustomCategory,
    handlePromoteLanguage,
    handleUpdateLanguages,
    handleUnlockLanguageChange,
    handleSelectPlan,
    handleLogoutAll,
  };
}
