"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/context";
import { useToast } from "@/context/toast-context";
import { formatMessage, useLocale } from "@/i18n";
import {
  ApiClientError,
  type BillingInvoice,
  type BillingPaymentMethodSummary,
  type BillingStatusResponse,
  billingService,
  type CategoriesSettings,
  type CheckoutSessionResponse,
  createBillingIdempotencyKey,
  formatBillingAmount,
  historyService,
  type HistorySummary,
  type LanguagesSettings,
  MIN_USER_CATEGORIES,
  type PaidSubscriptionTier,
  settingsService,
  type SetupIntentResponse,
  subscriptionsService,
  type SubscriptionTier,
  type TargetLanguageCode,
  type UserProfile,
  type UserSubscriptionResponse,
  usersService,
} from "@/lib";
import { useBillingConfig } from "@/lib/hooks/use-billing-config";
import { useSubscriptionPlans } from "@/lib/hooks/use-subscription-plans";

/**
 * Hook de datos y mutaciones para la vista de Perfil y Progreso (`/profile`).
 */
export function useProfileData() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const toast = useToast();
  const {
    user,
    subscription: authSubscription,
    languagesSettings: authLanguagesSettings,
    categoriesSettings: authCategoriesSettings,
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
  const { config: billingConfig, isStripeActive } = useBillingConfig();
  const effectiveAccessRequestsEnabled =
    accessRequestsEnabled && !isStripeActive;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [historySummary, setHistorySummary] = useState<HistorySummary | null>(
    null,
  );
  const [streakDays, setStreakDays] = useState<readonly boolean[]>([]);
  const [streakCount, setStreakCount] = useState<number | null>(null);
  const [currentSubscription, setCurrentSubscription] =
    useState<UserSubscriptionResponse | null>(null);
  const [languagesSettings, setLanguagesSettings] =
    useState<LanguagesSettings | null>(null);
  const [categoriesSettings, setCategoriesSettings] =
    useState<CategoriesSettings | null>(null);
  const [draftCategoryIds, setDraftCategoryIds] = useState<string[] | null>(
    null,
  );
  const [customCategoryItems, setCustomCategoryItems] = useState<
    { id: string; name: string }[]
  >([]);

  const [billingStatus, setBillingStatus] =
    useState<BillingStatusResponse | null>(null);
  const [invoices, setInvoices] = useState<readonly BillingInvoice[]>([]);
  const [checkoutSession, setCheckoutSession] =
    useState<CheckoutSessionResponse | null>(null);
  const [checkoutKind, setCheckoutKind] = useState<
    "subscription" | "language_unlock" | null
  >(null);
  const [setupIntentSession, setSetupIntentSession] =
    useState<SetupIntentResponse | null>(null);

  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isUnlockingLanguage, setIsUnlockingLanguage] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [isManagingBilling, setIsManagingBilling] = useState(false);
  const [isCancellingRequest, setIsCancellingRequest] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  const fetchKey = isAuthenticated ? `${user?.id ?? "me"}-${locale}` : null;
  const isLoading = Boolean(fetchKey && loadedKey !== fetchKey);
  const refreshAccessRequestsRef = useRef(refreshAccessRequests);

  useEffect(() => {
    refreshAccessRequestsRef.current = refreshAccessRequests;
  }, [refreshAccessRequests]);

  const reportSuccess = (message: string, title?: string): void => {
    toast.success(message, title ? { title } : undefined);
  };

  const reportError = (err: unknown, fallbackMessage: string): void => {
    const message =
      err instanceof ApiClientError
        ? err.getUserMessage(locale)
        : fallbackMessage;
    toast.error(message, {
      title: t.profile.hooks.saveErrorTitle,
    });
  };

  useEffect(() => {
    if (!fetchKey) return;

    let cancelled = false;

    Promise.allSettled([
      usersService.getProfile(),
      usersService.getStreak({ days: 365 }),
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
              setStreakDays(streakRes.value.data.days.map(Boolean));
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

  useEffect(() => {
    if (!fetchKey || !isStripeActive) {
      return;
    }

    let cancelled = false;

    Promise.allSettled([
      billingService.getStatus(),
      billingService.listInvoices(),
    ]).then(([statusRes, invoicesRes]) => {
      if (cancelled) return;

      if (statusRes.status === "fulfilled" && statusRes.value.data) {
        setBillingStatus(statusRes.value.data);
      }
      if (
        invoicesRes.status === "fulfilled" &&
        Array.isArray(invoicesRes.value.data)
      ) {
        setInvoices(invoicesRes.value.data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [fetchKey, isStripeActive]);

  const effectiveSubscription = currentSubscription ?? authSubscription;
  const effectiveLanguagesSettings = languagesSettings ?? authLanguagesSettings;
  const effectiveCategoriesSettings =
    categoriesSettings ?? authCategoriesSettings;

  const refreshBillingSnapshot = async (): Promise<void> => {
    if (!isStripeActive) return;
    const [statusRes, invoicesRes] = await Promise.allSettled([
      billingService.getStatus(),
      billingService.listInvoices(),
    ]);
    if (statusRes.status === "fulfilled" && statusRes.value.data) {
      setBillingStatus(statusRes.value.data);
    }
    if (
      invoicesRes.status === "fulfilled" &&
      Array.isArray(invoicesRes.value.data)
    ) {
      setInvoices(invoicesRes.value.data);
    }
  };

  const handleUpdateFullName = async (nextName: string): Promise<boolean> => {
    const clean = nextName.trim();
    if (!clean) return false;

    setIsSavingProfile(true);
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

  const commitCategories = async (
    nextCategories: string[],
  ): Promise<boolean> => {
    setIsSavingPreferences(true);
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

    const savedCategories = effectiveCategoriesSettings?.selected ?? [];
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
      toast.warning(t.profile.minCategoriesNotice);
      return;
    }

    // Si aún no alcanza el mínimo de 3 categorías, acumulamos en borrador local
    // hasta llegar a 3 antes de sincronizar con el backend.
    if (nextCategories.length < MIN_USER_CATEGORIES) {
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
      toast.warning(t.profile.hooks.categoryLengthError);
      return false;
    }

    const currentSelected =
      draftCategoryIds ?? effectiveCategoriesSettings?.selected ?? [];
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

    const savedCategories = effectiveCategoriesSettings?.selected ?? [];
    const currentSelected = draftCategoryIds ?? savedCategories;
    const isCurrentlySelected = currentSelected.some(
      (id) => id.toLowerCase() === normalizedTarget,
    );
    const inServerCatalog = (effectiveCategoriesSettings?.catalog ?? []).some(
      (item) => item.id.toLowerCase() === normalizedTarget,
    );
    const inServerSelected = savedCategories.some(
      (id) => id.toLowerCase() === normalizedTarget,
    );

    if (
      (isCurrentlySelected &&
        currentSelected.length <= MIN_USER_CATEGORIES &&
        inServerSelected) ||
      (inServerSelected && savedCategories.length <= MIN_USER_CATEGORIES)
    ) {
      toast.warning(t.profile.hooks.deleteMinCategoriesNotice);
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
      reportSuccess(
        t.profile.hooks.deletedCategoryNotice,
        t.profile.hooks.prefsSavedTitle,
      );
      return true;
    }

    setIsSavingPreferences(true);
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
      effectiveLanguagesSettings?.selected &&
      effectiveLanguagesSettings.selected.length > 0
        ? effectiveLanguagesSettings.selected
        : (profile?.selectedLanguages ?? []);
    const active =
      effectiveLanguagesSettings?.active &&
      effectiveLanguagesSettings.active.length > 0
        ? effectiveLanguagesSettings.active
        : saved;

    if (!active.includes(code) || active[0] === code) {
      return;
    }

    setIsSavingPreferences(true);
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
        const maxSlots =
          effectiveLanguagesSettings?.maxLanguages ?? active.length;
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
    try {
      if (isStripeActive) {
        const idemKey = createBillingIdempotencyKey("lang_unlock");
        const sessionRes = await billingService.createLanguageUnlockCheckout(
          { uiMode: billingConfig.uiMode },
          idemKey,
        );
        if (sessionRes.data.uiMode === "hosted" && sessionRes.data.url) {
          if (typeof window !== "undefined") {
            window.location.assign(sessionRes.data.url);
          }
          return true;
        }
        setCheckoutKind("language_unlock");
        setCheckoutSession(sessionRes.data);
        return true;
      }

      if (effectiveAccessRequestsEnabled) {
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
    try {
      if (isStripeActive && (tier === "dolly_plus" || tier === "dolly_pro")) {
        const hasActiveStripe = Boolean(
          billingStatus?.subscription &&
            billingStatus.subscription.status !== "canceled",
        );
        if (hasActiveStripe) {
          return await handleChangePaidPlan(tier);
        }

        const idemKey = createBillingIdempotencyKey(`sub_${tier}`);
        const sessionRes = await billingService.createSubscriptionCheckout(
          { tier, uiMode: billingConfig.uiMode },
          idemKey,
        );
        if (sessionRes.data.uiMode === "hosted" && sessionRes.data.url) {
          if (typeof window !== "undefined") {
            window.location.assign(sessionRes.data.url);
          }
          return true;
        }
        setCheckoutKind("subscription");
        setCheckoutSession(sessionRes.data);
        return true;
      }

      if (effectiveAccessRequestsEnabled) {
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

  const handleChangePaidPlan = async (
    tier: PaidSubscriptionTier,
  ): Promise<boolean> => {
    if (isManagingBilling) return false;
    setIsManagingBilling(true);
    try {
      const idemKey = createBillingIdempotencyKey(`change_${tier}`);
      const res = await billingService.changePlan({ tier }, idemKey);
      setBillingStatus(res.data);
      await handleRefreshAccessRequests();
      await refreshBillingSnapshot();
      const planDisplayName = t.plans.tiers[tier]?.name ?? tier;
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
      setIsManagingBilling(false);
    }
  };

  const handleCancelSubscription = async (): Promise<boolean> => {
    if (isManagingBilling) return false;
    setIsManagingBilling(true);
    try {
      const res = await billingService.cancelSubscription();
      setBillingStatus(res.data);
      await handleRefreshAccessRequests();
      reportSuccess(t.billing.subscriptionManage.cancelSuccessToast);
      return true;
    } catch (err) {
      reportError(err, t.profile.hooks.switchPlanError);
      return false;
    } finally {
      setIsManagingBilling(false);
    }
  };

  const handleResumeSubscription = async (): Promise<boolean> => {
    if (isManagingBilling) return false;
    setIsManagingBilling(true);
    try {
      const res = await billingService.resumeSubscription();
      setBillingStatus(res.data);
      await handleRefreshAccessRequests();
      reportSuccess(t.billing.subscriptionManage.resumeSuccessToast);
      return true;
    } catch (err) {
      reportError(err, t.profile.hooks.switchPlanError);
      return false;
    } finally {
      setIsManagingBilling(false);
    }
  };

  const handleOpenUpdateCard = async (): Promise<void> => {
    if (isManagingBilling) return;
    setIsManagingBilling(true);
    try {
      const idemKey = createBillingIdempotencyKey("setup_intent");
      const res = await billingService.createSetupIntent(idemKey);
      setSetupIntentSession(res.data);
    } catch (err) {
      reportError(err, t.billing.checkout.errorTitle);
    } finally {
      setIsManagingBilling(false);
    }
  };

  const handlePaymentMethodSaved = async (
    summary: BillingPaymentMethodSummary,
  ): Promise<void> => {
    setSetupIntentSession(null);
    setBillingStatus((prev) =>
      prev && prev.subscription
        ? {
            ...prev,
            subscription: {
              ...prev.subscription,
              paymentMethod: summary,
            },
          }
        : prev,
    );
    await refreshBillingSnapshot();
    reportSuccess(t.billing.subscriptionManage.cardUpdatedToast);
  };

  const handleOpenBillingPortal = async (): Promise<void> => {
    if (isManagingBilling) return;
    setIsManagingBilling(true);
    try {
      const res = await billingService.createPortal();
      if (res.data.url && typeof window !== "undefined") {
        window.location.assign(res.data.url);
      }
    } catch (err) {
      reportError(err, t.billing.checkout.errorTitle);
    } finally {
      setIsManagingBilling(false);
    }
  };

  const handleCheckoutCompleted = async (sessionId: string): Promise<void> => {
    setCheckoutSession(null);
    const completedKind = checkoutKind;
    setCheckoutKind(null);
    try {
      const syncRes = await billingService.syncCheckoutSession(sessionId);
      setBillingStatus(syncRes.data);
      await handleRefreshAccessRequests();
      await refreshBillingSnapshot();
      if (completedKind === "language_unlock") {
        reportSuccess(t.profile.hooks.unlockSuccess);
      } else {
        reportSuccess(t.billing.checkout.paymentSuccessToast);
      }
    } catch {
      router.replace(
        `/billing/return?session_id=${encodeURIComponent(sessionId)}`,
      );
    }
  };

  const handleCancelAccessRequest = async (
    requestId: number,
  ): Promise<boolean> => {
    if (isCancellingRequest) return false;
    setIsCancellingRequest(true);
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
    const [, profileRes, langsRes, catsRes, subscriptionRes] =
      await Promise.allSettled([
        reloadAccountState(),
        usersService.getProfile(),
        settingsService.getLanguages(),
        settingsService.getCategories(),
        subscriptionsService.getCurrentSubscription(),
      ]);

    if (profileRes.status === "fulfilled" && profileRes.value.data) {
      setProfile(profileRes.value.data);
      if (typeof profileRes.value.data.currentStreak === "number") {
        setStreakCount(profileRes.value.data.currentStreak);
      }
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

  const resolvedUser =
    profile && user ? { ...profile, ...user } : (profile ?? user);
  const resolvedStreakCount = streakCount ?? resolvedUser?.currentStreak ?? 0;
  const baseCatalog = effectiveCategoriesSettings?.catalog ?? [];

  const selectedCategoryIds =
    draftCategoryIds ?? (effectiveCategoriesSettings?.selected ?? []);
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
    effectiveLanguagesSettings?.active &&
    effectiveLanguagesSettings.active.length > 0
      ? effectiveLanguagesSettings.active
      : effectiveLanguagesSettings?.selected &&
          effectiveLanguagesSettings.selected.length > 0
        ? effectiveLanguagesSettings.selected
        : (profile?.selectedLanguages ?? []);

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

  const languageUnlockPriceLabel = isStripeActive
    ? formatBillingAmount(
        billingConfig.languageUnlock.amountCents,
        billingConfig.languageUnlock.currency || billingConfig.currency,
      )
    : null;

  return {
    locale,
    t,
    resolvedUser,
    resolvedStreakCount,
    historySummary,
    streakDays,
    currentSubscription: effectiveSubscription,
    billingConfig,
    isStripeActive,
    billingStatus,
    invoices,
    checkoutSession,
    checkoutKind,
    setupIntentSession,
    languageUnlockPriceLabel,
    plans,
    isLoadingPlans,
    plansError,
    languagesSettings: effectiveLanguagesSettings,
    resolvedCategories,
    selectedCategoryIds,
    activeLanguageItems,
    accessRequestsEnabled: effectiveAccessRequestsEnabled,
    pendingSubscriptionRequest,
    pendingLanguageUnlockRequest,
    latestRejectedSubscriptionRequest,
    latestRejectedLanguageUnlockRequest,
    isLoading,
    isSavingProfile,
    isSavingPreferences,
    isUnlockingLanguage,
    isSavingPlan,
    isManagingBilling,
    isCancellingRequest,
    isLoggingOutAll,
    setCheckoutSession,
    setSetupIntentSession,
    handleUpdateFullName,
    handleToggleCategory,
    handleAddCustomCategory,
    handleDeleteCategory,
    handlePromoteLanguage,
    handleUpdateLanguages,
    handleUnlockLanguageChange,
    handleSelectPlan,
    handleChangePaidPlan,
    handleCancelSubscription,
    handleResumeSubscription,
    handleOpenUpdateCard,
    handlePaymentMethodSaved,
    handleOpenBillingPortal,
    handleCheckoutCompleted,
    handleCancelAccessRequest,
    handleRefreshAccessRequests,
    handleLogoutAll,
  };
}
