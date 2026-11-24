import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import type { ApiTransport } from "@/lib/api-contracts";
import type { ApiResponse } from "@/lib/api-errors";
import {
  buildFriendInviteUrl,
  buildWhatsAppShareUrl,
  consumePendingInviteRedirect,
  createFriendsService,
  normalizePaginatedList,
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

    await service.listIncomingRequests({ page: 1, limit: 10 });
    expect(transport.get).toHaveBeenCalledWith("/friends/requests/incoming", {
      query: { page: 1, limit: 10 },
    });

    await service.listOutgoingRequests();
    expect(transport.get).toHaveBeenCalledWith("/friends/requests/outgoing", {
      query: undefined,
    });

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

  it("calls friend reading, category copy, block, and streak endpoints accurately", async () => {
    const transport = createMockTransport();
    const service = createFriendsService(transport);

    await service.listFriends({ page: 2, limit: 12, search: "Carlos" });
    expect(transport.get).toHaveBeenCalledWith("/friends", {
      query: { page: 2, limit: 12, search: "Carlos" },
    });

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

    await service.listFriendReadings(7, { page: 1, limit: 12 });
    expect(transport.get).toHaveBeenCalledWith("/friends/7/readings", {
      query: { page: 1, limit: 12 },
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
      language: "en",
      difficulty: "medium",
      size: "medium",
    });
    expect(transport.post).toHaveBeenCalledWith(
      "/friends/7/streak",
      {
        categories: ["Ciencia", "Historia"],
        language: "en",
        difficulty: "medium",
        size: "medium",
      },
      undefined,
    );

    await service.acceptStreak(12, { categories: ["Arte", "Música"] });
    expect(transport.post).toHaveBeenCalledWith(
      "/friends/streaks/12/accept",
      { categories: ["Arte", "Música"] },
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

  it("normalizes arrays and paginated envelopes cleanly", () => {
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

    expect(
      normalizePaginatedList(
        { items: [{ id: 3 }], total: 25, page: 2, limit: 10 },
        12,
      ),
    ).toEqual({
      items: [{ id: 3 }],
      total: 25,
      page: 2,
      limit: 10,
      totalPages: 3,
    });
  });

  it("builds invite URLs, WhatsApp URLs, resolves started reading IDs, and guards invite redirect storage", () => {
    expect(
      buildFriendInviteUrl("  abc-123  ", "https://dolynation.app/"),
    ).toBe("https://dolynation.app/friends/invite/abc-123");

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

    savePendingInviteRedirect("https://evil.test/phish");
    expect(peekPendingInviteRedirect()).toBeNull();

    savePendingInviteRedirect("/friends/invite/");
    expect(peekPendingInviteRedirect()).toBeNull();

    savePendingInviteRedirect(" /friends/invite/tok-999 ");
    expect(peekPendingInviteRedirect()).toBe("/friends/invite/tok-999");
    expect(consumePendingInviteRedirect()).toBe("/friends/invite/tok-999");
    expect(consumePendingInviteRedirect()).toBeNull();
  });
});
