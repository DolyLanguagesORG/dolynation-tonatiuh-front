"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  resolveAvailableCategoriesForStreak,
  resolveLanguageOptionsForStreak,
} from "@/components/friends/streak-helpers";
import { useAuth } from "@/context";
import { useToast } from "@/context/toast-context";
import { formatMessage, useLocale } from "@/i18n";
import {
  ApiClientError,
  type CatalogItem,
  type CategoriesSettings,
  clearLocallyInitiatedStreak,
  type CopyFriendCategoriesResponseDto,
  correlateStreakReadings,
  type FriendReadingDto,
  type FriendshipDto,
  friendsService,
  type FriendStreakDto,
  type LanguagesSettings,
  markLocallyInitiatedStreak,
  paginateItems,
  type ProposeFriendStreakInput,
  type ReadingDto,
  readingsService,
  resolveStartedReadingId,
  settingsService,
  type UpdateFriendStreakCategoriesInput,
} from "@/lib";

export type FriendProfileTab = "readings" | "categories" | "streak";

const READINGS_PAGE_SIZE = 12;
const FRIEND_READINGS_FETCH_LIMIT = 50;

function resolveErrorMessageText(
  err: unknown,
  locale: "es" | "en" | "fr" | "it",
  fallback: string,
): string {
  if (err instanceof ApiClientError) {
    return err.getUserMessage(locale);
  }
  return fallback;
}

/**
 * Hook de datos y acciones privadas para `/friends/[friendId]`.
 */
export function useFriendProfile(
  friendIdParam: string,
  initialTab: FriendProfileTab = "readings",
) {
  const router = useRouter();
  const { locale, t } = useLocale();
  const toast = useToast();
  const {
    user,
    accessPhase,
    isAuthenticated,
    categoriesSettings: authCategoriesSettings,
    languagesSettings: authLanguagesSettings,
    onboarding,
    refreshPreferences,
  } = useAuth();

  const trimmedParam = friendIdParam.trim();
  const parsedId = /^\d+$/.test(trimmedParam)
    ? Number.parseInt(trimmedParam, 10)
    : Number.NaN;
  const friendUserId =
    Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null;

  const [activeTab, setActiveTab] = useState<FriendProfileTab>(initialTab);
  const [isLoading, setIsLoading] = useState(friendUserId !== null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const [rawFriendships, setRawFriendships] = useState<FriendshipDto[]>([]);
  const [friendName, setFriendName] = useState<string | null>(null);
  const [allReadings, setAllReadings] = useState<FriendReadingDto[]>([]);
  const [readingsPage, setReadingsPage] = useState(1);

  const [previewReading, setPreviewReading] =
    useState<FriendReadingDto | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [startingReadingId, setStartingReadingId] = useState<number | null>(
    null,
  );

  const [friendCategories, setFriendCategories] = useState<string[]>([]);
  const [friendAvailableCategories, setFriendAvailableCategories] = useState<
    CatalogItem[]
  >([]);
  const [selectedCategoriesToCopy, setSelectedCategoriesToCopy] = useState<
    string[]
  >([]);
  const [copyResult, setCopyResult] =
    useState<CopyFriendCategoriesResponseDto | null>(null);

  const [rawStreak, setRawStreak] = useState<FriendStreakDto | null>(null);
  const [pendingReadings, setPendingReadings] = useState<ReadingDto[]>([]);
  const [categoriesSettings, setCategoriesSettings] =
    useState<CategoriesSettings | null>(null);
  const [languagesSettings, setLanguagesSettings] =
    useState<LanguagesSettings | null>(null);

  const canFetch =
    isAuthenticated && accessPhase === "ready" && friendUserId !== null;

  const loadAll = useCallback(async () => {
    if (!canFetch || friendUserId === null) {
      return;
    }

    const [
      friendsRes,
      readingsRes,
      friendCategoriesRes,
      streaksRes,
      pendingReadingsRes,
      myCategoriesRes,
      myLanguagesRes,
    ] = await Promise.allSettled([
      friendsService.listFriends(),
      friendsService.listFriendReadings(friendUserId, {
        limit: FRIEND_READINGS_FETCH_LIMIT,
      }),
      friendsService.getFriendCategories(friendUserId),
      friendsService.listStreaks(),
      readingsService.listPending(),
      settingsService.getCategories(),
      settingsService.getLanguages(),
    ]);

    if (
      readingsRes.status === "rejected" &&
      friendCategoriesRes.status === "rejected"
    ) {
      setLoadError(
        resolveErrorMessageText(
          readingsRes.reason,
          locale,
          t.friends.profile.invalidIdDesc,
        ),
      );
      setIsLoading(false);
      return;
    }

    setLoadError(null);

    let resolvedName: string | null = null;
    if (
      friendsRes.status === "fulfilled" &&
      Array.isArray(friendsRes.value.data)
    ) {
      setRawFriendships(friendsRes.value.data);
      const match = friendsRes.value.data.find(
        (item) => item.friend.id === friendUserId,
      );
      if (match?.friend.fullName) {
        resolvedName = match.friend.fullName;
      }
    }

    if (
      readingsRes.status === "fulfilled" &&
      Array.isArray(readingsRes.value.data)
    ) {
      setAllReadings(readingsRes.value.data);
      setReadingsPage(1);
    }

    if (
      friendCategoriesRes.status === "fulfilled" &&
      Array.isArray(friendCategoriesRes.value.data)
    ) {
      const seenNames = new Set<string>();
      const names: string[] = [];
      const catalog: CatalogItem[] = [];

      for (const entry of friendCategoriesRes.value.data) {
        const displayName = entry.category.trim();
        const dedupeKey = (entry.canonicalKey || displayName)
          .trim()
          .toLowerCase();
        if (!displayName || !dedupeKey || seenNames.has(dedupeKey)) {
          continue;
        }
        seenNames.add(dedupeKey);
        names.push(displayName);
        catalog.push({
          id: entry.canonicalKey || displayName,
          name: displayName,
        });
      }

      setFriendCategories(names);
      setFriendAvailableCategories(catalog);
    }

    if (
      streaksRes.status === "fulfilled" &&
      Array.isArray(streaksRes.value.data)
    ) {
      const matchingStreak =
        streaksRes.value.data.find(
          (item) =>
            item.friendUserId === friendUserId && item.status !== "ended",
        ) ?? null;
      setRawStreak(matchingStreak);
      if (!resolvedName && matchingStreak?.partnerName) {
        resolvedName = matchingStreak.partnerName;
      }
    }

    if (
      pendingReadingsRes.status === "fulfilled" &&
      Array.isArray(pendingReadingsRes.value.data)
    ) {
      setPendingReadings(pendingReadingsRes.value.data);
    }

    if (myCategoriesRes.status === "fulfilled" && myCategoriesRes.value.data) {
      setCategoriesSettings(myCategoriesRes.value.data);
    }
    if (myLanguagesRes.status === "fulfilled" && myLanguagesRes.value.data) {
      setLanguagesSettings(myLanguagesRes.value.data);
    }

    setFriendName(resolvedName);
    setIsLoading(false);
  }, [canFetch, friendUserId, locale, t.friends.profile.invalidIdDesc]);

  useEffect(() => {
    if (!canFetch) {
      return;
    }

    let cancelled = false;
    void (async () => {
      if (!cancelled) {
        await loadAll();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canFetch, loadAll]);

  const reloadAll = useCallback(async () => {
    setLoadError(null);
    await loadAll();
  }, [loadAll]);

  const changeReadingsPage = (nextPage: number) => {
    setActionError(null);
    setReadingsPage(nextPage);
  };

  const paginatedReadings = paginateItems(
    allReadings,
    readingsPage,
    READINGS_PAGE_SIZE,
  );

  const friendsById = new Map(rawFriendships.map((f) => [f.friend.id, f]));
  const streak = rawStreak
    ? (correlateStreakReadings([rawStreak], pendingReadings, friendsById)[0] ??
        null)
    : null;

  const openReadingPreview = async (readingId: number) => {
    if (friendUserId === null) {
      return;
    }
    setActionError(null);
    setIsLoadingPreview(true);
    try {
      const res = await friendsService.getFriendReading(
        friendUserId,
        readingId,
      );
      if (res.data) {
        setPreviewReading(res.data);
      }
    } catch (err) {
      setActionError(
        resolveErrorMessageText(err, locale, t.friends.common.errorTitle),
      );
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const closeReadingPreview = () => {
    setPreviewReading(null);
  };

  const startPrivateReading = async (readingId: number) => {
    if (friendUserId === null) {
      return;
    }
    setActionError(null);
    setStartingReadingId(readingId);
    try {
      const res = await friendsService.startFriendReading(
        friendUserId,
        readingId,
      );
      const startedId = resolveStartedReadingId(res.data);
      if (startedId === null) {
        setActionError(t.friends.common.errorTitle);
        return;
      }
      setPreviewReading(null);
      router.push(`/readings/${startedId}`);
    } catch (err) {
      setActionError(
        resolveErrorMessageText(err, locale, t.friends.common.errorTitle),
      );
    } finally {
      setStartingReadingId(null);
    }
  };

  const toggleCategorySelection = (category: string) => {
    setSelectedCategoriesToCopy((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category],
    );
  };

  const selectAllCategories = () => {
    setSelectedCategoriesToCopy([...friendCategories]);
  };

  const clearCategorySelection = () => {
    setSelectedCategoriesToCopy([]);
  };

  const copyCategories = async (categories: string[]) => {
    if (friendUserId === null || categories.length === 0) {
      return;
    }
    setActionError(null);
    setIsMutating(true);
    try {
      const res = await friendsService.copyFriendCategories(friendUserId, {
        categories,
      });
      if (res.data) {
        setCopyResult(res.data);
      }
      setSelectedCategoriesToCopy((prev) =>
        prev.filter((item) => !categories.includes(item)),
      );
      toast.success(t.friends.profile.categoriesTab.copySuccessToast);

      try {
        const updatedSettings = await settingsService.getCategories();
        if (updatedSettings.data) {
          setCategoriesSettings(updatedSettings.data);
        }
        await refreshPreferences();
      } catch {
        // Sincronización no bloqueante
      }
    } catch (err) {
      const message = resolveErrorMessageText(
        err,
        locale,
        t.friends.common.errorTitle,
      );
      setActionError(message);
      toast.error(message);
    } finally {
      setIsMutating(false);
    }
  };

  const proposeStreak = async (
    input: ProposeFriendStreakInput,
  ): Promise<boolean> => {
    if (friendUserId === null) {
      return false;
    }
    setActionError(null);
    setIsMutating(true);
    try {
      const res = await friendsService.proposeStreak(friendUserId, input);
      if (res.data) {
        markLocallyInitiatedStreak(res.data.id);
        setRawStreak(res.data);
      }
      toast.success(
        formatMessage(t.friends.streakModal.proposedNotice, {
          name: friendName?.trim() || t.friends.anonymousName,
        }),
      );
      return true;
    } catch (err) {
      setActionError(
        resolveErrorMessageText(err, locale, t.friends.common.errorTitle),
      );
      return false;
    } finally {
      setIsMutating(false);
    }
  };

  const acceptStreak = async (
    streakId: number,
    updatedCategories?: string[],
  ): Promise<boolean> => {
    setActionError(null);
    setIsMutating(true);
    try {
      if (updatedCategories && updatedCategories.length === 2) {
        await friendsService.updateStreakCategories(streakId, {
          categories: updatedCategories,
        });
      }
      const res = await friendsService.acceptStreak(streakId);
      clearLocallyInitiatedStreak(streakId);
      if (res.data) {
        setRawStreak(res.data);
      }
      try {
        const pendingRes = await readingsService.listPending();
        if (Array.isArray(pendingRes.data)) {
          setPendingReadings(pendingRes.data);
        }
      } catch {
        // Correlación no bloqueante
      }
      toast.success(t.friends.hub.streaksTab.acceptedNotice);
      return true;
    } catch (err) {
      setActionError(
        resolveErrorMessageText(err, locale, t.friends.common.errorTitle),
      );
      return false;
    } finally {
      setIsMutating(false);
    }
  };

  const rejectStreak = async (streakId: number) => {
    setActionError(null);
    setIsMutating(true);
    try {
      await friendsService.rejectStreak(streakId);
      clearLocallyInitiatedStreak(streakId);
      setRawStreak(null);
      toast.success(t.friends.hub.streaksTab.rejectedNotice);
    } catch (err) {
      setActionError(
        resolveErrorMessageText(err, locale, t.friends.common.errorTitle),
      );
    } finally {
      setIsMutating(false);
    }
  };

  const editStreakCategories = async (
    streakId: number,
    input: UpdateFriendStreakCategoriesInput,
  ): Promise<boolean> => {
    setActionError(null);
    setIsMutating(true);
    try {
      const res = await friendsService.updateStreakCategories(streakId, input);
      if (res.data) {
        setRawStreak(res.data);
      }
      toast.success(t.friends.hub.streaksTab.updatedCategoriesNotice);
      return true;
    } catch (err) {
      setActionError(
        resolveErrorMessageText(err, locale, t.friends.common.errorTitle),
      );
      return false;
    } finally {
      setIsMutating(false);
    }
  };

  const endStreak = async (streakId: number) => {
    setActionError(null);
    setIsMutating(true);
    try {
      await friendsService.endStreak(streakId);
      clearLocallyInitiatedStreak(streakId);
      setRawStreak(null);
      toast.success(t.friends.hub.streaksTab.endedNotice);
    } catch (err) {
      setActionError(
        resolveErrorMessageText(err, locale, t.friends.common.errorTitle),
      );
    } finally {
      setIsMutating(false);
    }
  };

  const removeFriend = async () => {
    if (friendUserId === null) {
      return;
    }
    setActionError(null);
    setIsMutating(true);
    try {
      await friendsService.removeFriend(friendUserId);
      toast.success(
        formatMessage(t.friends.hub.friendsTab.removedNotice, {
          name: friendName?.trim() || t.friends.anonymousName,
        }),
      );
      router.replace("/friends");
    } catch (err) {
      setActionError(
        resolveErrorMessageText(err, locale, t.friends.common.errorTitle),
      );
    } finally {
      setIsMutating(false);
    }
  };

  const blockFriend = async () => {
    if (friendUserId === null) {
      return;
    }
    setActionError(null);
    setIsMutating(true);
    try {
      await friendsService.blockUser(friendUserId);
      toast.success(
        formatMessage(t.friends.hub.friendsTab.blockedNotice, {
          name: friendName?.trim() || t.friends.anonymousName,
        }),
      );
      router.replace("/friends");
    } catch (err) {
      setActionError(
        resolveErrorMessageText(err, locale, t.friends.common.errorTitle),
      );
    } finally {
      setIsMutating(false);
    }
  };

  const availableCategories = resolveAvailableCategoriesForStreak(
    categoriesSettings ?? authCategoriesSettings,
    onboarding.selectedCategories,
  );
  const languageOptions = resolveLanguageOptionsForStreak(
    languagesSettings ?? authLanguagesSettings,
    locale,
    onboarding.selectedLanguages,
  );

  return {
    t,
    locale,
    currentUserId: user?.id ?? null,
    friendUserId,
    isInvalidId: friendUserId === null,
    friendName: friendName?.trim() || t.friends.anonymousName,
    activeTab,
    setActiveTab,
    isLoading,
    loadError,
    actionError,
    setActionError,
    isMutating,
    reloadAll,
    readings: paginatedReadings.items,
    readingsTotal: paginatedReadings.total,
    readingsPage: paginatedReadings.page,
    readingsTotalPages: paginatedReadings.totalPages,
    changeReadingsPage,
    previewReading,
    isLoadingPreview,
    openReadingPreview,
    closeReadingPreview,
    startingReadingId,
    startPrivateReading,
    friendCategories,
    friendAvailableCategories,
    selectedCategoriesToCopy,
    toggleCategorySelection,
    selectAllCategories,
    clearCategorySelection,
    copyResult,
    copyCategories,
    streak,
    availableCategories,
    languageOptions,
    proposeStreak,
    acceptStreak,
    rejectStreak,
    editStreakCategories,
    endStreak,
    removeFriend,
    blockFriend,
  };
}
