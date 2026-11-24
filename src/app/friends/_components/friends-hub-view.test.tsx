import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
};

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  usePathname: () => "/friends",
}));

jest.mock("@/context", () => ({
  useAuth: () => ({
    accessPhase: "ready",
    isAuthenticated: true,
    user: { id: 1, fullName: "Juan Student", role: "student" },
    categoriesSettings: null,
    languagesSettings: null,
    onboarding: {
      selectedCategories: ["Tecnología", "Ciencia", "Historia"],
      selectedLanguages: ["en"],
    },
  }),
}));

jest.mock("@/context/toast-context", () => ({
  useToast: () => mockToast,
}));

import { FriendsHubView } from "@/app/friends/_components/friends-hub-view";
import { LocaleProvider } from "@/i18n";
import { friendsService, settingsService } from "@/lib";

describe("FriendsHubView", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(friendsService, "listFriends").mockResolvedValue({
      message: "ok",
      data: {
        items: [
          {
            userId: 2,
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
          },
        ],
        total: 1,
        page: 1,
        limit: 12,
        totalPages: 1,
      },
    });
    jest.spyOn(friendsService, "listIncomingRequests").mockResolvedValue({
      message: "ok",
      data: [
        {
          id: 71,
          status: "pending",
          origin: "email",
          requesterId: 3,
          addresseeId: 1,
          requesterName: "Carlos Méndez",
          requesterEmail: "carlos@example.com",
          addresseeName: "Juan Student",
          createdAt: "2026-11-20T12:00:00.000Z",
          respondedAt: null,
        },
      ],
    });
    jest.spyOn(friendsService, "listOutgoingRequests").mockResolvedValue({
      message: "ok",
      data: [],
    });
    jest.spyOn(friendsService, "listInviteLinks").mockResolvedValue({
      message: "ok",
      data: [
        {
          id: 81,
          token: "tok-active-1",
          url: "http://localhost:3000/friends/invite/tok-active-1",
          maxUses: 1,
          usesCount: 0,
          expiresAt: "2099-12-01T00:00:00.000Z",
          revokedAt: null,
          createdAt: "2026-11-20T00:00:00.000Z",
        },
      ],
    });
    jest.spyOn(friendsService, "listStreaks").mockResolvedValue({
      message: "ok",
      data: [
        {
          id: 50,
          friendshipId: 10,
          partnerUserId: 2,
          partnerName: "Ana Sofía",
          initiatedByUserId: 2,
          awaitingMyAcceptance: true,
          status: "pending_partner",
          myCategories: [],
          partnerCategories: ["Cine", "Música"],
          categoryPool: ["Cine", "Música"],
          language: "en",
          difficulty: "medium",
          size: "medium",
          currentStreak: 0,
          longestStreak: 0,
          lastCompletedDate: null,
          startedAt: null,
          createdAt: "2026-11-22T08:00:00.000Z",
          updatedAt: null,
          myCompletedToday: false,
          partnerCompletedToday: false,
          todayReadingId: null,
        },
      ],
    });
    jest.spyOn(friendsService, "listBlockedUsers").mockResolvedValue({
      message: "ok",
      data: [
        {
          userId: 9,
          fullName: "Cuenta Bloqueada",
          blockedAt: "2026-11-18T12:00:00.000Z",
        },
      ],
    });
    jest.spyOn(settingsService, "getCategories").mockResolvedValue({
      message: "ok",
      data: {
        catalog: [
          { id: "Tecnología", name: "Tecnología" },
          { id: "Ciencia", name: "Ciencia" },
          { id: "Historia", name: "Historia" },
        ],
        selected: ["Tecnología", "Ciencia", "Historia"],
      },
    });
    jest.spyOn(settingsService, "getLanguages").mockResolvedValue({
      message: "ok",
      data: {
        catalog: [{ id: "en", name: "Inglés" }],
        selected: ["en"],
        active: ["en"],
        maxLanguages: 1,
        canChangeFree: true,
        nextFreeChangeAt: null,
        lastLanguageChangeAt: null,
        languageChangeCredits: 0,
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it(
    "renders friends list, supports keyboard tab navigation, email request, and invite link copy/WhatsApp",
    async () => {
      const user = userEvent.setup();
      const writeTextMock = jest.fn<Promise<void>, [string]>(
        async () => undefined,
      );
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: writeTextMock },
        configurable: true,
      });

      const sendEmailSpy = jest
        .spyOn(friendsService, "sendRequestByEmail")
        .mockResolvedValue({
          message: "ok",
          data: {
            id: 72,
            status: "pending",
            origin: "email",
            requesterId: 1,
            addresseeId: 4,
            requesterName: "Juan Student",
            addresseeName: "Lucía",
            addresseeEmail: "lucia@example.com",
            createdAt: "2026-11-23T00:00:00.000Z",
            respondedAt: null,
          },
        });

      render(
        <LocaleProvider initialLocale="es">
          <FriendsHubView />
        </LocaleProvider>,
      );

      expect(
        await screen.findByRole("heading", { name: "Ana Sofía" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /Explorar en privado/i }),
      ).toHaveAttribute("href", "/friends/2");

      const friendsTab = screen.getByRole("tab", { name: /Mis amigos/i });
      friendsTab.focus();
      await user.keyboard("{ArrowRight}");

      const addTab = screen.getByRole("tab", { name: /Agregar amigo/i });
      expect(addTab).toHaveAttribute("aria-selected", "true");

      await user.type(
        screen.getByLabelText(/Correo de tu amigo/i),
        "lucia@example.com",
      );
      await user.click(
        screen.getByRole("button", { name: /Enviar solicitud por correo/i }),
      );

      await waitFor(() => {
        expect(sendEmailSpy).toHaveBeenCalledWith({
          email: "lucia@example.com",
        });
      });

      const whatsAppLink = screen.getByRole("link", { name: /WhatsApp/i });
      expect(whatsAppLink).toHaveAttribute(
        "href",
        expect.stringContaining("https://wa.me/?text="),
      );
      await user.click(screen.getByRole("button", { name: /Copiar enlace/i }));
      expect(writeTextMock).toHaveBeenCalledWith(
        "http://localhost:3000/friends/invite/tok-active-1",
      );
    },
    15_000,
  );

  it(
    "handles incoming request acceptance, streak 2-category acceptance, and unblock confirm",
    async () => {
      const user = userEvent.setup();
      const acceptRequestSpy = jest
        .spyOn(friendsService, "acceptRequest")
        .mockResolvedValue({
          message: "ok",
          data: {
            id: 71,
            status: "accepted",
            origin: "email",
            requesterId: 3,
            addresseeId: 1,
            requesterName: "Carlos Méndez",
            addresseeName: "Juan Student",
            createdAt: "2026-11-20T12:00:00.000Z",
            respondedAt: "2026-11-23T00:00:00.000Z",
          },
        });
      const acceptStreakSpy = jest
        .spyOn(friendsService, "acceptStreak")
        .mockResolvedValue({
          message: "ok",
          data: {
            id: 50,
            friendshipId: 10,
            partnerUserId: 2,
            partnerName: "Ana Sofía",
            initiatedByUserId: 2,
            awaitingMyAcceptance: false,
            status: "active",
            myCategories: ["Tecnología", "Ciencia"],
            partnerCategories: ["Cine", "Música"],
            categoryPool: ["Tecnología", "Ciencia", "Cine", "Música"],
            language: "en",
            difficulty: "medium",
            size: "medium",
            currentStreak: 1,
            longestStreak: 1,
            lastCompletedDate: null,
            startedAt: "2026-11-23T00:00:00.000Z",
            createdAt: "2026-11-22T08:00:00.000Z",
            updatedAt: null,
            myCompletedToday: false,
            partnerCompletedToday: false,
            todayReadingId: 501,
          },
        });
      const unblockSpy = jest
        .spyOn(friendsService, "unblockUser")
        .mockResolvedValue({
          message: "ok",
          data: null,
        });

      render(
        <LocaleProvider initialLocale="es">
          <FriendsHubView initialTab="requests" />
        </LocaleProvider>,
      );

      expect(await screen.findByText("Carlos Méndez")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /^Aceptar$/i }));
      await waitFor(() => {
        expect(acceptRequestSpy).toHaveBeenCalledWith(71);
      });

      await user.click(screen.getByRole("tab", { name: /Rachas/i }));
      await user.click(
        screen.getByRole("button", { name: /Aceptar y elegir 2 categorías/i }),
      );
      const modal = screen.getByRole("dialog");
      await user.click(
        within(modal).getByRole("button", { name: "Tecnología" }),
      );
      await user.click(within(modal).getByRole("button", { name: "Ciencia" }));
      await user.click(
        within(modal).getByRole("button", { name: /Aceptar y activar racha/i }),
      );
      await waitFor(() => {
        expect(acceptStreakSpy).toHaveBeenCalledWith(50, {
          categories: ["Tecnología", "Ciencia"],
        });
      });

      await user.click(screen.getByRole("tab", { name: /Bloqueados/i }));
      expect(screen.getByText("Cuenta Bloqueada")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /^Desbloquear$/i }));
      const confirmModal = screen.getByRole("dialog");
      await user.click(
        within(confirmModal).getByRole("button", { name: /Sí, desbloquear/i }),
      );
      await waitFor(() => {
        expect(unblockSpy).toHaveBeenCalledWith(9);
      });
    },
    15_000,
  );
});
