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
  type AcceptFriendStreakInput,
  ApiClientError,
  type CategoriesSettings,
  type CopyFriendCategoriesResponseDto,
  type FriendReadingDetailDto,
  type FriendReadingListItemDto,
  friendsService,
  type FriendStreakDto,
  type LanguagesSettings,
  normalizePaginatedList,
  type ProposeFriendStreakInput,
  resolveStartedReadingId,
  settingsService,
  type UpdateFriendStreakCategoriesInput,
} from "@/lib";

export type FriendProfileTab = "readings" | "categories" | "streak";

const READINGS_PAGE_SIZE = 12;

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

  const [friendName, setFriendName] = useState<string | null>(null);
  const [readings, setReadings] = useState<FriendReadingListItemDto[]>([]);
  const [readingsTotal, setReadingsTotal] = useState(0);
  const [readingsPage, setReadingsPage] = useState(1);
  const [readingsTotalPages, setReadingsTotalPages] = useState(1);

  const [previewReading, setPreviewReading] =
    useState<FriendReadingDetailDto | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [startingReadingId, setStartingReadingId] = useState<number | null>(
    null,
  );

  const [friendCategories, setFriendCategories] = useState<string[]>([]);
  const [selectedCategoriesToCopy, setSelectedCategoriesToCopy] = useState<
    string[]
  >([]);
  const [copyResult, setCopyResult] =
    useState<CopyFriendCategoriesResponseDto | null>(null);

  const [streak, setStreak] = useState<FriendStreakDto | null>(null);
  const [categoriesSettings, setCategoriesSettings] =
    useState<CategoriesSettings | null>(null);
  const [languagesSettings, setLanguagesSettings] =
    useState<LanguagesSettings | null>(null);

  const canFetch =
    isAuthenticated && accessPhase === "ready" && friendUserId !== null;

  const loadAll = useCallback(
    async (page: number) => {
      if (!canFetch || friendUserId === null) {
        return;
      }

      const [
        friendsRes,
        readingsRes,
        friendCategoriesRes,
        streaksRes,
        myCategoriesRes,
        myLanguagesRes,
      ] = await Promise.allSettled([
        friendsService.listFriends({ page: 1, limit: 100 }),
        friendsService.listFriendReadings(friendUserId, {
          page,
          limit: READINGS_PAGE_SIZE,
        }),
        friendsService.getFriendCategories(friendUserId),
        friendsService.listStreaks(),
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
      if (friendsRes.status === "fulfilled") {
        const list = normalizePaginatedList(friendsRes.value.data, 100);
        const match = list.items.find((item) => item.userId === friendUserId);
        if (match?.fullName) {
          resolvedName = match.fullName;
        }
      }

      if (readingsRes.status === "fulfilled") {
        const normalized = normalizePaginatedList(
          readingsRes.value.data,
          READINGS_PAGE_SIZE,
        );
        setReadings(normalized.items);
        setReadingsTotal(normalized.total);
        setReadingsPage(normalized.page);
        setReadingsTotalPages(normalized.totalPages);
      }

      if (
        friendCategoriesRes.status === "fulfilled" &&
        friendCategoriesRes.value.data
      ) {
        const catData = friendCategoriesRes.value.data;
        setFriendCategories(
          Array.isArray(catData.categories) ? catData.categories : [],
        );
        if (!resolvedName && catData.friendName) {
          resolvedName = catData.friendName;
        }
      }

      if (
        streaksRes.status === "fulfilled" &&
        Array.isArray(streaksRes.value.data)
      ) {
        const matchingStreak =
          streaksRes.value.data.find(
            (item) =>
              item.partnerUserId === friendUserId && item.status !== "ended",
          ) ?? null;
        setStreak(matchingStreak);
        if (!resolvedName && matchingStreak?.partnerName) {
          resolvedName = matchingStreak.partnerName;
        }
      }

      if (myCategoriesRes.status === "fulfilled" && myCategoriesRes.value.data) {
        setCategoriesSettings(myCategoriesRes.value.data);
      }
      if (myLanguagesRes.status === "fulfilled" && myLanguagesRes.value.data) {
        setLanguagesSettings(myLanguagesRes.value.data);
      }

      setFriendName(resolvedName);
      setIsLoading(false);
    },
    [canFetch, friendUserId, locale, t.friends.profile.invalidIdDesc],
  );

  useEffect(() => {
    if (!canFetch) {
      return;
    }

    let cancelled = false;
    void (async () => {
      if (!cancelled) {
        await loadAll(1);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canFetch, loadAll]);

  const reloadAll = useCallback(async () => {
    setLoadError(null);
    await loadAll(readingsPage);
  }, [loadAll, readingsPage]);

  const changeReadingsPage = async (nextPage: number) => {
    if (friendUserId === null) {
      return;
    }
    setActionError(null);
    try {
      const res = await friendsService.listFriendReadings(friendUserId, {
        page: nextPage,
        limit: READINGS_PAGE_SIZE,
      });
      const normalized = normalizePaginatedList(res.data, READINGS_PAGE_SIZE);
      setReadings(normalized.items);
      setReadingsTotal(normalized.total);
      setReadingsPage(normalized.page);
      setReadingsTotalPages(normalized.totalPages);
    } catch (err) {
      setActionError(
        resolveErrorMessageText(err, locale, t.friends.common.errorTitle),
      );
    }
  };

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
        setStreak(res.data);
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
    input: AcceptFriendStreakInput,
  ): Promise<boolean> => {
    setActionError(null);
    setIsMutating(true);
    try {
      const res = await friendsService.acceptStreak(streakId, input);
      if (res.data) {
        setStreak(res.data);
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
      setStreak(null);
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
        setStreak(res.data);
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
      setStreak(null);
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
    readings,
    readingsTotal,
    readingsPage,
    readingsTotalPages,
    changeReadingsPage,
    previewReading,
    isLoadingPreview,
    openReadingPreview,
    closeReadingPreview,
    startingReadingId,
    startPrivateReading,
    friendCategories,
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
