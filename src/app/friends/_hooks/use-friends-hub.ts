"use client";

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
  type BlockedUserDto,
  type CategoriesSettings,
  type FriendInviteLinkDto,
  type FriendRequestDto,
  friendsService,
  type FriendStreakDto,
  type FriendSummaryDto,
  type LanguagesSettings,
  normalizePaginatedList,
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

  const [friends, setFriends] = useState<FriendSummaryDto[]>([]);
  const [friendsTotal, setFriendsTotal] = useState(0);
  const [friendsPage, setFriendsPage] = useState(1);
  const [friendsTotalPages, setFriendsTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [incomingRequests, setIncomingRequests] = useState<FriendRequestDto[]>(
    [],
  );
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestDto[]>(
    [],
  );
  const [inviteLinks, setInviteLinks] = useState<FriendInviteLinkDto[]>([]);
  const [streaks, setStreaks] = useState<FriendStreakDto[]>([]);
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

  const canFetch = isAuthenticated && accessPhase === "ready";

  const fetchFriendsList = useCallback(
    async (page: number, search: string) => {
      const res = await friendsService.listFriends({
        page,
        limit: FRIENDS_PAGE_SIZE,
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      const normalized = normalizePaginatedList(res.data, FRIENDS_PAGE_SIZE);
      setFriends(normalized.items);
      setFriendsTotal(normalized.total);
      setFriendsPage(normalized.page);
      setFriendsTotalPages(normalized.totalPages);
    },
    [],
  );

  const loadHub = useCallback(
    async (page: number, search: string) => {
      if (!canFetch) {
        return;
      }

      const [
        friendsRes,
        incomingRes,
        outgoingRes,
        linksRes,
        streaksRes,
        blockedRes,
        categoriesRes,
        languagesRes,
      ] = await Promise.allSettled([
        friendsService.listFriends({
          page,
          limit: FRIENDS_PAGE_SIZE,
          ...(search.trim() ? { search: search.trim() } : {}),
        }),
        friendsService.listIncomingRequests(),
        friendsService.listOutgoingRequests(),
        friendsService.listInviteLinks(),
        friendsService.listStreaks(),
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

      if (friendsRes.status === "fulfilled") {
        const normalized = normalizePaginatedList(
          friendsRes.value.data,
          FRIENDS_PAGE_SIZE,
        );
        setFriends(normalized.items);
        setFriendsTotal(normalized.total);
        setFriendsPage(normalized.page);
        setFriendsTotalPages(normalized.totalPages);
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
        setInviteLinks(linksRes.value.data);
      }
      if (
        streaksRes.status === "fulfilled" &&
        Array.isArray(streaksRes.value.data)
      ) {
        setStreaks(streaksRes.value.data);
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
    },
    [canFetch, locale, t.friends.common.errorTitle],
  );

  useEffect(() => {
    if (!canFetch) {
      return;
    }

    let cancelled = false;
    void (async () => {
      if (!cancelled) {
        await loadHub(1, "");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canFetch, loadHub]);

  const reloadAll = useCallback(async () => {
    setLoadError(null);
    await loadHub(friendsPage, appliedSearch);
  }, [appliedSearch, friendsPage, loadHub]);

  const handleSearchSubmit = async () => {
    const trimmed = searchInput.trim();
    setAppliedSearch(trimmed);
    setActionError(null);
    try {
      await fetchFriendsList(1, trimmed);
    } catch (err) {
      setActionError(
        resolveErrorMessageText(err, locale, t.friends.common.errorTitle),
      );
    }
  };

  const handleClearSearch = async () => {
    setSearchInput("");
    setAppliedSearch("");
    setActionError(null);
    try {
      await fetchFriendsList(1, "");
    } catch (err) {
      setActionError(
        resolveErrorMessageText(err, locale, t.friends.common.errorTitle),
      );
    }
  };

  const handlePageChange = async (nextPage: number) => {
    setActionError(null);
    try {
      await fetchFriendsList(nextPage, appliedSearch);
    } catch (err) {
      setActionError(
        resolveErrorMessageText(err, locale, t.friends.common.errorTitle),
      );
    }
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
          ...prev.filter((item) => item.id !== res.data!.id),
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
      await friendsService.acceptRequest(requestId);
      setIncomingRequests((prev) => prev.filter((item) => item.id !== requestId));
      await fetchFriendsList(friendsPage, appliedSearch);
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
      setIncomingRequests((prev) => prev.filter((item) => item.id !== requestId));
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
      setOutgoingRequests((prev) => prev.filter((item) => item.id !== requestId));
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
      setFriends((prev) => prev.filter((f) => f.userId !== friendUserId));
      setStreaks((prev) => prev.filter((s) => s.partnerUserId !== friendUserId));
      setFriendsTotal((prev) => Math.max(0, prev - 1));
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
      setFriends((prev) => prev.filter((f) => f.userId !== userId));
      setStreaks((prev) => prev.filter((s) => s.partnerUserId !== userId));
      setIncomingRequests((prev) =>
        prev.filter((r) => r.requesterId !== userId && r.addresseeId !== userId),
      );
      setOutgoingRequests((prev) =>
        prev.filter((r) => r.requesterId !== userId && r.addresseeId !== userId),
      );
      setFriendsTotal((prev) => Math.max(0, prev - 1));
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
      setBlockedUsers((prev) => prev.filter((u) => u.userId !== userId));
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
    input: AcceptFriendStreakInput,
  ): Promise<boolean> => {
    setActionError(null);
    setIsMutating(true);
    try {
      const res = await friendsService.acceptStreak(streakId, input);
      if (res.data) {
        setStreaks((prev) =>
          prev.map((item) => (item.id === streakId ? res.data! : item)),
        );
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
      setStreaks((prev) => prev.filter((item) => item.id !== streakId));
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
        setStreaks((prev) =>
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
      setStreaks((prev) => prev.filter((item) => item.id !== streakId));
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
    activeTab,
    setActiveTab,
    isLoading,
    loadError,
    actionError,
    setActionError,
    isMutating,
    reloadAll,
    friends,
    friendsTotal,
    friendsPage,
    friendsTotalPages,
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
