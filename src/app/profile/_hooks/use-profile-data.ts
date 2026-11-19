"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/context";
import { useToast } from "@/context/toast-context";
import { formatMessage, useLocale } from "@/i18n";
import {
  ApiClientError,
  type CategoriesSettings,
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
  const toast = useToast();
  const {
    user,
    isAuthenticated,
    accessRequests,
    accessRequestsEnabled = false,
    reloadAccountState,
    refreshPreferences,
    refreshAccessRequests,
    submitAccessRequest,
    cancelAccessRequest,
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
  const [isCancellingRequest, setIsCancellingRequest] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  const fetchKey = isAuthenticated ? `${user?.id ?? "me"}-${locale}` : null;
  const isLoading = Boolean(fetchKey && loadedKey !== fetchKey);
  const refreshAccessRequestsRef = useRef(refreshAccessRequests);

  useEffect(() => {
    refreshAccessRequestsRef.current = refreshAccessRequests;
  }, [refreshAccessRequests]);

  const reportSuccess = (message: string, title?: string): void => {
    setErrorMessage(null);
    setNotice(message);
    toast.success(message, title ? { title } : undefined);
  };

  const reportError = (err: unknown, fallbackMessage: string): void => {
    const message =
      err instanceof ApiClientError
        ? err.getUserMessage(locale)
        : fallbackMessage;
    setNotice(null);
    setErrorMessage(message);
    toast.error(message, {
      title: t.profile.hooks.saveErrorTitle,
    });
  };

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
      refreshAccessRequestsRef.current
        ? refreshAccessRequestsRef.current()
        : Promise.resolve(),
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
      reportSuccess(
        t.profile.savedProfileNotice,
        t.profile.hooks.changesSavedTitle,
      );
      return true;
    } catch (err) {
      reportError(err, t.profile.hooks.updateProfileError);
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
      reportSuccess(
        t.profile.savedPreferencesNotice,
        t.profile.hooks.prefsSavedTitle,
      );
      return true;
    } catch (err) {
      reportError(err, t.profile.hooks.updateCategoriesError);
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
      toast.warning(t.profile.minCategoriesNotice);
      return;
    }

    // Si aún no alcanza el mínimo de 3 categorías, acumulamos en borrador local
    // hasta llegar a 3 antes de sincronizar con el backend.
    if (nextCategories.length < MIN_USER_CATEGORIES) {
      setErrorMessage(null);
      setDraftCategoryIds(nextCategories);
      toast.info(
        formatMessage(t.profile.hooks.selectMinCategoriesInfo, {
          min: MIN_USER_CATEGORIES,
          count: nextCategories.length,
        }),
      );
      return;
    }

    await commitCategories(nextCategories);
  };

  const handleAddCustomCategory = async (name: string): Promise<boolean> => {
    const clean = name.trim();
    if (clean.length < 2 || clean.length > 50) {
      const msg = t.profile.hooks.categoryLengthError;
      setErrorMessage(msg);
      toast.warning(msg);
      return false;
    }

    const currentSelected = draftCategoryIds ?? categoriesSettings?.selected ?? [];
    const alreadyExists = currentSelected.some(
      (id) => id.toLowerCase() === clean.toLowerCase(),
    );
    if (alreadyExists) {
      toast.info(
        formatMessage(t.profile.hooks.categoryAlreadySelectedInfo, {
          name: clean,
        }),
      );
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
      toast.info(
        formatMessage(t.profile.hooks.categoryAddedDraftInfo, {
          name: clean,
          count: nextCategories.length,
          min: MIN_USER_CATEGORIES,
        }),
      );
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

  const handleDeleteCategory = async (categoryId: string): Promise<boolean> => {
    if (isSavingPreferences) return false;

    const normalizedTarget = categoryId.trim().toLowerCase();
    if (!normalizedTarget) return false;

    const savedCategories = categoriesSettings?.selected ?? [];
    const currentSelected = draftCategoryIds ?? savedCategories;
    const isCurrentlySelected = currentSelected.some(
      (id) => id.toLowerCase() === normalizedTarget,
    );
    const inServerCatalog = (categoriesSettings?.catalog ?? []).some(
      (item) => item.id.toLowerCase() === normalizedTarget,
    );
    const inServerSelected = savedCategories.some(
      (id) => id.toLowerCase() === normalizedTarget,
    );

    if (
      (isCurrentlySelected && currentSelected.length <= MIN_USER_CATEGORIES && inServerSelected) ||
      (inServerSelected && savedCategories.length <= MIN_USER_CATEGORIES)
    ) {
      const msg = t.profile.hooks.deleteMinCategoriesNotice;
      setErrorMessage(msg);
      toast.warning(msg);
      return false;
    }

    if (!inServerCatalog && !inServerSelected) {
      setCustomCategoryItems((prev) =>
        prev.filter((item) => item.id.toLowerCase() !== normalizedTarget),
      );
      if (draftCategoryIds !== null) {
        setDraftCategoryIds((prev) =>
          prev
            ? prev.filter((id) => id.toLowerCase() !== normalizedTarget)
            : null,
        );
      }
      setErrorMessage(null);
      reportSuccess(
        t.profile.hooks.deletedCategoryNotice,
        t.profile.hooks.prefsSavedTitle,
      );
      return true;
    }

    setIsSavingPreferences(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      const res = await settingsService.deleteCategory(categoryId);
      setCategoriesSettings(res.data);
      setCustomCategoryItems((prev) =>
        prev.filter((item) => item.id.toLowerCase() !== normalizedTarget),
      );
      setDraftCategoryIds(null);
      await refreshPreferences();
      reportSuccess(
        t.profile.hooks.deletedCategoryNotice,
        t.profile.hooks.prefsSavedTitle,
      );
      return true;
    } catch (err) {
      reportError(err, t.profile.hooks.deleteCategoryError);
      return false;
    } finally {
      setIsSavingPreferences(false);
    }
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
      reportSuccess(
        t.profile.savedPreferencesNotice,
        t.profile.hooks.prefsSavedTitle,
      );
    } catch (err) {
      reportError(err, t.profile.hooks.reorderLanguagesError);
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
      reportSuccess(
        t.profile.savedPreferencesNotice,
        t.profile.hooks.prefsSavedTitle,
      );
      return true;
    } catch (err) {
      reportError(err, t.profile.hooks.updateLanguagesError);
      return false;
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleUnlockLanguageChange = async (
    message?: string,
  ): Promise<boolean> => {
    if (isUnlockingLanguage) return false;

    setIsUnlockingLanguage(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      if (accessRequestsEnabled) {
        const trimmed = message?.trim();
        await submitAccessRequest({
          type: "language_unlock",
          ...(trimmed ? { message: trimmed } : {}),
        });
        reportSuccess(t.profile.hooks.unlockRequestSuccess);
        return true;
      }

      const res = await settingsService.unlockLanguageChange();
      setLanguagesSettings(res.data);
      await refreshPreferences();
      reportSuccess(t.profile.hooks.unlockSuccess);
      return true;
    } catch (err) {
      reportError(err, t.profile.hooks.unlockError);
      return false;
    } finally {
      setIsUnlockingLanguage(false);
    }
  };

  const handleSelectPlan = async (
    tier: SubscriptionTier,
    message?: string,
  ): Promise<boolean> => {
    if (isSavingPlan) return false;

    setIsSavingPlan(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      if (accessRequestsEnabled) {
        const trimmed = message?.trim();
        await submitAccessRequest({
          type: "subscription",
          tier,
          ...(trimmed ? { message: trimmed } : {}),
        });
        const planDisplayName =
          t.plans.tiers[tier]?.name ??
          plans.find((item) => item.id === tier)?.name ??
          tier;
        reportSuccess(
          formatMessage(t.profile.hooks.planRequestSuccess, {
            name: planDisplayName,
          }),
        );
        return true;
      }

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
      reportSuccess(
        formatMessage(t.profile.hooks.planUpdatedNotice, {
          name: planDisplayName,
        }),
      );
      return true;
    } catch (err) {
      reportError(err, t.profile.hooks.switchPlanError);
      return false;
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleCancelAccessRequest = async (
    requestId: number,
  ): Promise<boolean> => {
    if (isCancellingRequest) return false;
    setIsCancellingRequest(true);
    setErrorMessage(null);
    setNotice(null);
    try {
      await cancelAccessRequest(requestId);
      reportSuccess(t.profile.hooks.cancelRequestSuccess);
      return true;
    } catch (err) {
      reportError(err, t.profile.hooks.cancelRequestError);
      return false;
    } finally {
      setIsCancellingRequest(false);
    }
  };

  const handleRefreshAccessRequests = async (): Promise<void> => {
    await refreshAccessRequests?.();
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
  const baseCatalog = categoriesSettings?.catalog ?? [];

  const selectedCategoryIds = draftCategoryIds ?? (categoriesSettings?.selected ?? []);
  const catalogMap = new Map<string, { id: string; name: string }>();
  for (const item of baseCatalog) {
    catalogMap.set(item.id.toLowerCase(), {
      id: item.id,
      name: item.name,
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

  const activeLanguageItems = activeLanguageCodes.map((code, index) => ({
    code,
    name: t.languages[code] ?? code.toUpperCase(),
    isPrimary: index === 0,
  }));

  const pendingSubscriptionRequest =
    accessRequests?.pendingSubscriptionRequest ?? null;
  const pendingLanguageUnlockRequest =
    accessRequests?.pendingLanguageUnlockRequest ?? null;
  const latestRejectedSubscriptionRequest = !pendingSubscriptionRequest
    ? (accessRequests?.requests.find(
        (item) =>
          item.requestType === "subscription" && item.status === "rejected",
      ) ?? null)
    : null;
  const latestRejectedLanguageUnlockRequest = !pendingLanguageUnlockRequest
    ? (accessRequests?.requests.find(
        (item) =>
          item.requestType === "language_unlock" && item.status === "rejected",
      ) ?? null)
    : null;

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
    accessRequestsEnabled,
    pendingSubscriptionRequest,
    pendingLanguageUnlockRequest,
    latestRejectedSubscriptionRequest,
    latestRejectedLanguageUnlockRequest,
    isLoading,
    isSavingProfile,
    isSavingPreferences,
    isUnlockingLanguage,
    isSavingPlan,
    isCancellingRequest,
    isLoggingOutAll,
    notice,
    setNotice,
    errorMessage,
    setErrorMessage,
    handleUpdateFullName,
    handleToggleCategory,
    handleAddCustomCategory,
    handleDeleteCategory,
    handlePromoteLanguage,
    handleUpdateLanguages,
    handleUnlockLanguageChange,
    handleSelectPlan,
    handleCancelAccessRequest,
    handleRefreshAccessRequests,
    handleLogoutAll,
  };
}
