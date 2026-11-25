import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import type {
  ApiTransport,
  FriendStreakDto,
  FriendshipDto,
  ReadingDto,
} from "@/lib/api-contracts";
import type { ApiResponse } from "@/lib/api-errors";
import {
  buildFriendInvitePath,
  buildFriendInviteUrl,
  buildWhatsAppShareUrl,
  clearLocallyInitiatedStreak,
  consumePendingInviteRedirect,
  correlateStreakReadings,
  createFriendsService,
  hasLocallyInitiatedStreak,
  isStreakAwaitingMyAcceptance,
  isValidInviteRedirectPath,
  mapFriendshipToSummary,
  markLocallyInitiatedStreak,
  normalizePaginatedList,
  paginateItems,
  peekPendingInviteRedirect,
  resolveStartedReadingId,
  savePendingInviteRedirect,
} from "@/lib/services/friends-service";

function createMockTransport(): jest.Mocked<ApiTransport> {
  const ok: ApiResponse<unknown> = {
    data: null,
    message: "ok",
  };
  return {
    request: jest.fn(async () => ok) as jest.MockedFunction<ApiTransport["request"]>,
    get: jest.fn(async () => ok) as jest.MockedFunction<ApiTransport["get"]>,
    post: jest.fn(async () => ok) as jest.MockedFunction<ApiTransport["post"]>,
    put: jest.fn(async () => ok) as jest.MockedFunction<ApiTransport["put"]>,
    patch: jest.fn(async () => ok) as jest.MockedFunction<ApiTransport["patch"]>,
    delete: jest.fn(async () => ok) as jest.MockedFunction<ApiTransport["delete"]>,
  };
}

describe("friendsService", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  afterEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it("calls all friendship request and invite link endpoints with expected paths and skipAuth preview", async () => {
    const transport = createMockTransport();
    const service = createFriendsService(transport);

    await service.sendRequestByEmail({ email: "ana@example.com" });
    expect(transport.post).toHaveBeenCalledWith(
      "/friends/requests/by-email",
      { email: "ana@example.com" },
      undefined,
    );

    await service.listIncomingRequests();
    expect(transport.get).toHaveBeenCalledWith(
      "/friends/requests/incoming",
      undefined,
    );

    await service.listOutgoingRequests();
    expect(transport.get).toHaveBeenCalledWith(
      "/friends/requests/outgoing",
      undefined,
    );

    await service.acceptRequest(14);
    expect(transport.post).toHaveBeenCalledWith(
      "/friends/requests/14/accept",
      undefined,
      undefined,
    );

    await service.rejectRequest(14);
    expect(transport.post).toHaveBeenCalledWith(
      "/friends/requests/14/reject",
      undefined,
      undefined,
    );

    await service.cancelRequest(14);
    expect(transport.delete).toHaveBeenCalledWith(
      "/friends/requests/14",
      undefined,
    );

    await service.createInviteLink({ maxUses: 1 });
    expect(transport.post).toHaveBeenCalledWith(
      "/friends/invite-links",
      { maxUses: 1 },
      undefined,
    );

    await service.createInviteLink();
    expect(transport.post).toHaveBeenCalledWith(
      "/friends/invite-links",
      {},
      undefined,
    );

    await service.listInviteLinks();
    expect(transport.get).toHaveBeenCalledWith(
      "/friends/invite-links",
      undefined,
    );

    await service.revokeInviteLink(8);
    expect(transport.delete).toHaveBeenCalledWith(
      "/friends/invite-links/8",
      undefined,
    );

    await service.previewInviteLink("tok abc");
    expect(transport.get).toHaveBeenCalledWith(
      "/friends/invite-links/tok%20abc",
      { skipAuth: true },
    );

    await service.acceptInviteLink("tok-1");
    expect(transport.post).toHaveBeenCalledWith(
      "/friends/invite-links/tok-1/accept",
      undefined,
      undefined,
    );

    await service.declineInviteLink("tok-1");
    expect(transport.post).toHaveBeenCalledWith(
      "/friends/invite-links/tok-1/decline",
      undefined,
      undefined,
    );
  });

  it("calls friend reading, category copy, block, and streak endpoints accurately without forbidden params", async () => {
    const transport = createMockTransport();
    const service = createFriendsService(transport);

    await service.listFriends();
    expect(transport.get).toHaveBeenCalledWith("/friends", undefined);

    await service.removeFriend(7);
    expect(transport.delete).toHaveBeenCalledWith("/friends/7", undefined);

    await service.listBlockedUsers();
    expect(transport.get).toHaveBeenCalledWith("/friends/blocks", undefined);

    await service.blockUser(7);
    expect(transport.post).toHaveBeenCalledWith(
      "/friends/blocks/7",
      undefined,
      undefined,
    );

    await service.unblockUser(7);
    expect(transport.delete).toHaveBeenCalledWith(
      "/friends/blocks/7",
      undefined,
    );

    await service.listFriendReadings(7, { limit: 50 });
    expect(transport.get).toHaveBeenCalledWith("/friends/7/readings", {
      query: { limit: 50 },
    });

    await service.listFriendReadings(7, { limit: 999 });
    expect(transport.get).toHaveBeenCalledWith("/friends/7/readings", {
      query: { limit: 50 },
    });

    await service.getFriendReading(7, 99);
    expect(transport.get).toHaveBeenCalledWith(
      "/friends/7/readings/99",
      undefined,
    );

    await service.startFriendReading(7, 99);
    expect(transport.post).toHaveBeenCalledWith(
      "/friends/7/readings/99/start",
      undefined,
      undefined,
    );

    await service.getFriendCategories(7);
    expect(transport.get).toHaveBeenCalledWith(
      "/friends/7/categories",
      undefined,
    );

    await service.copyFriendCategories(7, { categories: ["Arte", "Historia"] });
    expect(transport.post).toHaveBeenCalledWith(
      "/friends/7/categories/copy",
      { categories: ["Arte", "Historia"] },
      undefined,
    );

    await service.proposeStreak(7, {
      categories: ["Ciencia", "Historia"],
      friendCategories: ["Arte", "Música"],
      language: "en",
      difficulty: "medium",
      size: "medium",
    });
    expect(transport.post).toHaveBeenCalledWith(
      "/friends/7/streak",
      {
        categories: ["Ciencia", "Historia"],
        friendCategories: ["Arte", "Música"],
        language: "en",
        difficulty: "medium",
        size: "medium",
      },
      undefined,
    );

    await service.acceptStreak(12);
    expect(transport.post).toHaveBeenCalledWith(
      "/friends/streaks/12/accept",
      undefined,
      undefined,
    );

    await service.rejectStreak(12);
    expect(transport.post).toHaveBeenCalledWith(
      "/friends/streaks/12/reject",
      undefined,
      undefined,
    );

    await service.updateStreakCategories(12, {
      categories: ["Cine", "Viajes"],
    });
    expect(transport.patch).toHaveBeenCalledWith(
      "/friends/streaks/12/categories",
      { categories: ["Cine", "Viajes"] },
      undefined,
    );

    await service.endStreak(12);
    expect(transport.delete).toHaveBeenCalledWith(
      "/friends/streaks/12",
      undefined,
    );

    await service.listStreaks();
    expect(transport.get).toHaveBeenCalledWith("/friends/streaks", undefined);

    await service.getStreak(12);
    expect(transport.get).toHaveBeenCalledWith(
      "/friends/streaks/12",
      undefined,
    );
  });

  it("normalizes and paginates arrays cleanly", () => {
    expect(normalizePaginatedList(null, 12)).toEqual({
      items: [],
      total: 0,
      page: 1,
      limit: 12,
      totalPages: 1,
    });

    expect(normalizePaginatedList([{ id: 1 }, { id: 2 }], 12)).toEqual({
      items: [{ id: 1 }, { id: 2 }],
      total: 2,
      page: 1,
      limit: 12,
      totalPages: 1,
    });

    expect(paginateItems([1, 2, 3, 4, 5], 2, 2)).toEqual({
      items: [3, 4],
      total: 5,
      page: 2,
      limit: 2,
      totalPages: 3,
    });

    expect(paginateItems([1, 2, 3], 99, 2)).toEqual({
      items: [3],
      total: 3,
      page: 2,
      limit: 2,
      totalPages: 2,
    });
  });

  it("maps FriendshipDto, tracks local initiated streaks, and correlates streaks with pending readings", () => {
    const friendship: FriendshipDto = {
      id: 10,
      friend: {
        id: 202,
        fullName: "Ana Sofía",
        since: "2026-11-10T10:00:00.000Z",
      },
      createdAt: "2026-11-10T10:00:00.000Z",
    };

    const friendsById = new Map([[friendship.friend.id, friendship]]);

    const activeStreak: FriendStreakDto = {
      id: 50,
      status: "active",
      myCategories: ["Tecnología", "Ciencia"],
      partnerCategories: ["Cine", "Música"],
      language: "en",
      difficulty: "medium",
      size: "medium",
      currentStreak: 4,
      longestStreak: 7,
      lastCompletedDate: null,
      myCompletedToday: false,
      partnerCompletedToday: true,
      friendUserId: 202,
    };

    const pendingReading: ReadingDto = {
      id: 901,
      userId: 101,
      title: "AI & Jazz",
      description: "Daily streak",
      content: "Content",
      category: "Música",
      difficulty: "medium",
      language: "en",
      wordCount: 220,
      status: "pending",
      score: null,
      feedback: null,
      userResponse: null,
      passed: null,
      originType: "friend_streak",
      createdAt: "2026-11-24T06:00:00.000Z",
      updatedAt: null,
      deletedAt: null,
    };

    const [enriched] = correlateStreakReadings(
      [activeStreak],
      [pendingReading],
      friendsById,
    );

    expect(enriched).toMatchObject({
      partnerUserId: 202,
      partnerName: "Ana Sofía",
      categoryPool: ["Tecnología", "Ciencia", "Cine", "Música"],
      todayReadingId: 901,
      todayCategory: "Música",
      todayStatus: "pending",
    });

    expect(mapFriendshipToSummary(friendship, enriched)).toEqual({
      userId: 202,
      friendshipId: 10,
      fullName: "Ana Sofía",
      since: "2026-11-10T10:00:00.000Z",
      activeStreak: {
        id: 50,
        status: "active",
        currentStreak: 4,
        longestStreak: 7,
        language: "en",
        myCompletedToday: false,
        partnerCompletedToday: true,
        todayReadingId: 901,
      },
    });

    const pendingStreak: FriendStreakDto = {
      ...activeStreak,
      id: 77,
      status: "pending_partner",
    };
    expect(isStreakAwaitingMyAcceptance(pendingStreak, 101)).toBe(true);
    markLocallyInitiatedStreak(77);
    expect(hasLocallyInitiatedStreak(77)).toBe(true);
    expect(isStreakAwaitingMyAcceptance(pendingStreak, 101)).toBe(false);
    clearLocallyInitiatedStreak(77);
    expect(hasLocallyInitiatedStreak(77)).toBe(false);
  });

  it("builds /friends/invite?token= URLs, resolves started reading IDs, and guards invite redirects for both query and segment formats", () => {
    expect(buildFriendInvitePath("  abc-123  ")).toBe(
      "/friends/invite?token=abc-123",
    );
    expect(
      buildFriendInviteUrl("  abc-123  ", "https://dolynation.app/"),
    ).toBe("https://dolynation.app/friends/invite?token=abc-123");

    expect(buildWhatsAppShareUrl("Únete: https://x.test/a")).toBe(
      "https://wa.me/?text=%C3%9Anete%3A%20https%3A%2F%2Fx.test%2Fa",
    );

    expect(resolveStartedReadingId({ readingId: 401 })).toBe(401);
    expect(
      resolveStartedReadingId({
        reading: { id: 402 } as never,
      }),
    ).toBe(402);
    expect(resolveStartedReadingId({ id: 403 })).toBe(403);
    expect(resolveStartedReadingId(null)).toBeNull();

    expect(isValidInviteRedirectPath("/friends/invite?token=tok-123")).toBe(
      true,
    );
    expect(isValidInviteRedirectPath("/friends/invite/tok-123")).toBe(true);
    expect(isValidInviteRedirectPath("/friends/invite?token=")).toBe(false);
    expect(isValidInviteRedirectPath("/friends/invite/")).toBe(false);
    expect(isValidInviteRedirectPath("//evil.test/phish")).toBe(false);

    savePendingInviteRedirect("https://evil.test/phish");
    expect(peekPendingInviteRedirect()).toBeNull();

    savePendingInviteRedirect("/friends/invite/");
    expect(peekPendingInviteRedirect()).toBeNull();

    savePendingInviteRedirect(" /friends/invite?token=tok-999 ");
    expect(peekPendingInviteRedirect()).toBe("/friends/invite?token=tok-999");
    expect(consumePendingInviteRedirect()).toBe(
      "/friends/invite?token=tok-999",
    );
    expect(consumePendingInviteRedirect()).toBeNull();
  });
});
