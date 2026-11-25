"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  resolveAvailableCategoriesForStreak,
  resolveLanguageOptionsForStreak,
} from "@/components/friends/streak-helpers";
import { useAuth } from "@/context";
import { useToast } from "@/context/toast-context";
import { formatMessage, useLocale } from "@/i18n";
import {
  ApiClientError,
  type BlockedUserDto,
  type CategoriesSettings,
  clearLocallyInitiatedStreak,
  correlateStreakReadings,
  type FriendInviteLinkDto,
  type FriendshipDto,
  type FriendshipRequestDto,
  friendsService,
  type FriendStreakDto,
  type FriendSummaryDto,
  type LanguagesSettings,
  mapFriendshipToSummary,
  paginateItems,
  type ReadingDto,
  readingsService,
  settingsService,
  type UpdateFriendStreakCategoriesInput,
} from "@/lib";

export type FriendsHubTab =
  | "friends"
  | "add"
  | "requests"
  | "streaks"
  | "blocked";

const FRIENDS_PAGE_SIZE = 12;

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
 * Hook de datos y mutaciones para `/friends`.
 */
export function useFriendsHub(initialTab: FriendsHubTab = "friends") {
  const { locale, t } = useLocale();
  const toast = useToast();
  const {
    user,
    accessPhase,
    isAuthenticated,
    categoriesSettings: authCategoriesSettings,
    languagesSettings: authLanguagesSettings,
    onboarding,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<FriendsHubTab>(initialTab);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const [rawFriendships, setRawFriendships] = useState<FriendshipDto[]>([]);
  const [friendsPage, setFriendsPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [incomingRequests, setIncomingRequests] = useState<
    FriendshipRequestDto[]
  >([]);
  const [outgoingRequests, setOutgoingRequests] = useState<
    FriendshipRequestDto[]
  >([]);
  const [inviteLinks, setInviteLinks] = useState<FriendInviteLinkDto[]>([]);
  const [rawStreaks, setRawStreaks] = useState<FriendStreakDto[]>([]);
  const [pendingReadings, setPendingReadings] = useState<ReadingDto[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserDto[]>([]);

  const [categoriesSettings, setCategoriesSettings] =
    useState<CategoriesSettings | null>(null);
  const [languagesSettings, setLanguagesSettings] =
    useState<LanguagesSettings | null>(null);
  const [referenceNowMs, setReferenceNowMs] = useState<number | null>(null);

  const [emailInput, setEmailInput] = useState("");
  const [emailFieldError, setEmailFieldError] = useState<string | null>(null);
  const [emailSentTarget, setEmailSentTarget] = useState<string | null>(null);
  const [maxUsesChoice, setMaxUsesChoice] = useState<"1" | "unlimited">("1");
  const [lastCreatedLink, setLastCreatedLink] =
    useState<FriendInviteLinkDto | null>(null);

  const createdLinkUrlsRef = useRef<
    Map<number, { url: string | null; token?: string }>
  >(new Map());

  const canFetch = isAuthenticated && accessPhase === "ready";

  const mergeWithCachedUrls = useCallback(
    (links: readonly FriendInviteLinkDto[]): FriendInviteLinkDto[] =>
      links.map((link) => {
        const cached = createdLinkUrlsRef.current.get(link.id);
        if (cached && !link.url) {
          return {
            ...link,
            url: cached.url,
            ...(cached.token ? { token: cached.token } : {}),
          };
        }
        return link;
      }),
    [],
  );

  const fetchFriendsList = useCallback(async () => {
    const res = await friendsService.listFriends();
    if (Array.isArray(res.data)) {
      setRawFriendships(res.data);
    }
  }, []);

  const loadHub = useCallback(async () => {
    if (!canFetch) {
      return;
    }

    const [
      friendsRes,
      incomingRes,
      outgoingRes,
      linksRes,
      streaksRes,
      pendingReadingsRes,
      blockedRes,
      categoriesRes,
      languagesRes,
    ] = await Promise.allSettled([
      friendsService.listFriends(),
      friendsService.listIncomingRequests(),
      friendsService.listOutgoingRequests(),
      friendsService.listInviteLinks(),
      friendsService.listStreaks(),
      readingsService.listPending(),
      friendsService.listBlockedUsers(),
      settingsService.getCategories(),
      settingsService.getLanguages(),
    ]);

    setReferenceNowMs(Date.now());

    const coreFailed =
      friendsRes.status === "rejected" &&
      incomingRes.status === "rejected" &&
      streaksRes.status === "rejected";

    if (coreFailed) {
      setLoadError(
        resolveErrorMessageText(
          friendsRes.reason,
          locale,
          t.friends.common.errorTitle,
        ),
      );
      setIsLoading(false);
      return;
    }

    setLoadError(null);

    if (
      friendsRes.status === "fulfilled" &&
      Array.isArray(friendsRes.value.data)
    ) {
      setRawFriendships(friendsRes.value.data);
    }

    if (
      incomingRes.status === "fulfilled" &&
      Array.isArray(incomingRes.value.data)
    ) {
      setIncomingRequests(incomingRes.value.data);
    }
    if (
      outgoingRes.status === "fulfilled" &&
      Array.isArray(outgoingRes.value.data)
    ) {
      setOutgoingRequests(outgoingRes.value.data);
    }
    if (linksRes.status === "fulfilled" && Array.isArray(linksRes.value.data)) {
      setInviteLinks(mergeWithCachedUrls(linksRes.value.data));
    }
    if (
      streaksRes.status === "fulfilled" &&
      Array.isArray(streaksRes.value.data)
    ) {
      setRawStreaks(streaksRes.value.data);
    }
    if (
      pendingReadingsRes.status === "fulfilled" &&
      Array.isArray(pendingReadingsRes.value.data)
    ) {
      setPendingReadings(pendingReadingsRes.value.data);
    }
    if (
      blockedRes.status === "fulfilled" &&
      Array.isArray(blockedRes.value.data)
    ) {
      setBlockedUsers(blockedRes.value.data);
    }
    if (categoriesRes.status === "fulfilled" && categoriesRes.value.data) {
      setCategoriesSettings(categoriesRes.value.data);
    }
    if (languagesRes.status === "fulfilled" && languagesRes.value.data) {
      setLanguagesSettings(languagesRes.value.data);
    }

    setIsLoading(false);
  }, [canFetch, locale, mergeWithCachedUrls, t.friends.common.errorTitle]);

  useEffect(() => {
    if (!canFetch) {
      return;
    }

    let cancelled = false;
    void (async () => {
      if (!cancelled) {
        await loadHub();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canFetch, loadHub]);

  const reloadAll = useCallback(async () => {
    setLoadError(null);
    await loadHub();
  }, [loadHub]);

  const friendsById = new Map(rawFriendships.map((f) => [f.friend.id, f]));
  const streaks = correlateStreakReadings(
    rawStreaks,
    pendingReadings,
    friendsById,
  );

  const activeStreakByFriendId = new Map<number, FriendStreakDto>();
  for (const streak of streaks) {
    if (streak.status !== "active" && streak.status !== "paused") {
      continue;
    }
    const existing = activeStreakByFriendId.get(streak.friendUserId);
    if (!existing || streak.status === "active") {
      activeStreakByFriendId.set(streak.friendUserId, streak);
    }
  }

  const allFriends: FriendSummaryDto[] = rawFriendships.map((friendship) =>
    mapFriendshipToSummary(
      friendship,
      activeStreakByFriendId.get(friendship.friend.id) ?? null,
    ),
  );

  const normalizedSearch = appliedSearch.trim().toLowerCase();
  const filteredFriends = normalizedSearch
    ? allFriends.filter((friend) =>
        friend.fullName.toLowerCase().includes(normalizedSearch),
      )
    : allFriends;

  const paginatedFriends = paginateItems(
    filteredFriends,
    friendsPage,
    FRIENDS_PAGE_SIZE,
  );

  const handleSearchSubmit = () => {
    setAppliedSearch(searchInput.trim());
    setFriendsPage(1);
    setActionError(null);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setAppliedSearch("");
    setFriendsPage(1);
    setActionError(null);
  };

  const handlePageChange = (nextPage: number) => {
    setFriendsPage(nextPage);
    setActionError(null);
  };

  const sendRequestByEmail = async () => {
    const email = emailInput.trim();
    if (!email || !email.includes("@")) {
      setEmailFieldError(t.friends.hub.addTab.emailRequiredError);
      return;
    }

    setEmailFieldError(null);
    setActionError(null);
    setEmailSentTarget(null);
    setIsMutating(true);

    try {
      const res = await friendsService.sendRequestByEmail({ email });
      if (res.data) {
        setOutgoingRequests((prev) => [
          res.data!,
          ...prev.filter((item) => item.requestId !== res.data!.requestId),
        ]);
      }
      setEmailInput("");
      setEmailSentTarget(email);
      toast.success(
        formatMessage(t.friends.hub.addTab.emailSentNotice, { email }),
        { title: t.friends.hub.addTab.emailSentTitle },
      );
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

  const createInviteLink = async () => {
    setActionError(null);
    setIsMutating(true);
    try {
      const maxUses = maxUsesChoice === "1" ? 1 : null;
      const res = await friendsService.createInviteLink({ maxUses });
      if (res.data) {
        createdLinkUrlsRef.current.set(res.data.id, {
          url: res.data.url,
          token: res.data.token,
        });
        setLastCreatedLink(res.data);
        setInviteLinks((prev) => [res.data!, ...prev]);
      }
      toast.success(t.friends.hub.addTab.linkCreatedNotice);
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

  const revokeInviteLink = async (linkId: number) => {
    setActionError(null);
    setIsMutating(true);
    try {
      await friendsService.revokeInviteLink(linkId);
      const nowIso = new Date().toISOString();
      setInviteLinks((prev) =>
        prev.map((link) =>
          link.id === linkId ? { ...link, revokedAt: nowIso } : link,
        ),
      );
      if (lastCreatedLink?.id === linkId) {
        setLastCreatedLink((prev) =>
          prev ? { ...prev, revokedAt: nowIso } : null,
        );
      }
      toast.success(t.friends.hub.addTab.revokedNotice);
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

  const acceptIncomingRequest = async (requestId: number, friendName: string) => {
    setActionError(null);
    setIsMutating(true);
    try {
      const res = await friendsService.acceptRequest(requestId);
      setIncomingRequests((prev) =>
        prev.filter((item) => item.requestId !== requestId),
      );
      if (res.data) {
        setRawFriendships((prev) => [
          res.data!,
          ...prev.filter((f) => f.friend.id !== res.data!.friend.id),
        ]);
      }
      await fetchFriendsList();
      toast.success(
        formatMessage(t.friends.hub.requestsTab.acceptedNotice, {
          name: friendName,
        }),
      );
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

  const rejectIncomingRequest = async (requestId: number) => {
    setActionError(null);
    setIsMutating(true);
    try {
      await friendsService.rejectRequest(requestId);
      setIncomingRequests((prev) =>
        prev.filter((item) => item.requestId !== requestId),
      );
      toast.success(t.friends.hub.requestsTab.rejectedNotice);
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

  const cancelOutgoingRequest = async (requestId: number) => {
    setActionError(null);
    setIsMutating(true);
    try {
      await friendsService.cancelRequest(requestId);
      setOutgoingRequests((prev) =>
        prev.filter((item) => item.requestId !== requestId),
      );
      toast.success(t.friends.hub.requestsTab.cancelledNotice);
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

  const removeFriend = async (friendUserId: number, friendName: string) => {
    setActionError(null);
    setIsMutating(true);
    try {
      await friendsService.removeFriend(friendUserId);
      setRawFriendships((prev) =>
        prev.filter((f) => f.friend.id !== friendUserId),
      );
      setRawStreaks((prev) =>
        prev.filter((s) => s.friendUserId !== friendUserId),
      );
      toast.success(
        formatMessage(t.friends.hub.friendsTab.removedNotice, {
          name: friendName,
        }),
      );
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

  const blockFriend = async (userId: number, friendName: string) => {
    setActionError(null);
    setIsMutating(true);
    try {
      await friendsService.blockUser(userId);
      setRawFriendships((prev) => prev.filter((f) => f.friend.id !== userId));
      setRawStreaks((prev) => prev.filter((s) => s.friendUserId !== userId));
      setIncomingRequests((prev) => prev.filter((r) => r.id !== userId));
      setOutgoingRequests((prev) => prev.filter((r) => r.id !== userId));
      const blockedRes = await friendsService.listBlockedUsers();
      if (Array.isArray(blockedRes.data)) {
        setBlockedUsers(blockedRes.data);
      }
      toast.success(
        formatMessage(t.friends.hub.friendsTab.blockedNotice, {
          name: friendName,
        }),
      );
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

  const unblockUser = async (userId: number, userName: string) => {
    setActionError(null);
    setIsMutating(true);
    try {
      await friendsService.unblockUser(userId);
      setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success(
        formatMessage(t.friends.hub.blockedTab.unblockedNotice, {
          name: userName,
        }),
      );
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
        setRawStreaks((prev) =>
          prev.map((item) => (item.id === streakId ? res.data! : item)),
        );
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
      const message = resolveErrorMessageText(
        err,
        locale,
        t.friends.common.errorTitle,
      );
      setActionError(message);
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
      setRawStreaks((prev) => prev.filter((item) => item.id !== streakId));
      toast.success(t.friends.hub.streaksTab.rejectedNotice);
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

  const editStreakCategories = async (
    streakId: number,
    input: UpdateFriendStreakCategoriesInput,
  ): Promise<boolean> => {
    setActionError(null);
    setIsMutating(true);
    try {
      const res = await friendsService.updateStreakCategories(streakId, input);
      if (res.data) {
        setRawStreaks((prev) =>
          prev.map((item) => (item.id === streakId ? res.data! : item)),
        );
      }
      toast.success(t.friends.hub.streaksTab.updatedCategoriesNotice);
      return true;
    } catch (err) {
      const message = resolveErrorMessageText(
        err,
        locale,
        t.friends.common.errorTitle,
      );
      setActionError(message);
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
      setRawStreaks((prev) => prev.filter((item) => item.id !== streakId));
      toast.success(t.friends.hub.streaksTab.endedNotice);
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
    activeTab,
    setActiveTab,
    isLoading,
    loadError,
    actionError,
    setActionError,
    isMutating,
    reloadAll,
    friends: paginatedFriends.items,
    friendsTotal: paginatedFriends.total,
    friendsPage: paginatedFriends.page,
    friendsTotalPages: paginatedFriends.totalPages,
    searchInput,
    setSearchInput,
    appliedSearch,
    handleSearchSubmit,
    handleClearSearch,
    handlePageChange,
    incomingRequests,
    outgoingRequests,
    inviteLinks,
    referenceNowMs,
    streaks,
    blockedUsers,
    availableCategories,
    languageOptions,
    emailInput,
    setEmailInput,
    emailFieldError,
    setEmailFieldError,
    emailSentTarget,
    maxUsesChoice,
    setMaxUsesChoice,
    lastCreatedLink,
    sendRequestByEmail,
    createInviteLink,
    revokeInviteLink,
    acceptIncomingRequest,
    rejectIncomingRequest,
    cancelOutgoingRequest,
    removeFriend,
    blockFriend,
    unblockUser,
    acceptStreak,
    rejectStreak,
    editStreakCategories,
    endStreak,
  };
}
