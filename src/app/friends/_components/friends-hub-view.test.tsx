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
import { friendsService, readingsService, settingsService } from "@/lib";

describe("FriendsHubView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();

    jest.spyOn(friendsService, "listFriends").mockResolvedValue({
      message: "ok",
      data: [
        {
          id: 10,
          friend: {
            id: 2,
            fullName: "Ana Sofía",
            since: "2026-11-10T10:00:00.000Z",
          },
          createdAt: "2026-11-10T10:00:00.000Z",
        },
      ],
    });
    jest.spyOn(friendsService, "listIncomingRequests").mockResolvedValue({
      message: "ok",
      data: [
        {
          requestId: 71,
          id: 3,
          fullName: "Carlos Méndez",
          since: "2026-11-20T12:00:00.000Z",
          direction: "incoming",
          origin: "email",
          createdAt: "2026-11-20T12:00:00.000Z",
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
          url: null,
          maxUses: 1,
          usesCount: 0,
          expiresAt: "2099-12-01T00:00:00.000Z",
          revokedAt: null,
        },
      ],
    });
    jest.spyOn(friendsService, "listStreaks").mockResolvedValue({
      message: "ok",
      data: [
        {
          id: 50,
          status: "pending_partner",
          myCategories: ["Tecnología", "Historia"],
          partnerCategories: ["Cine", "Música"],
          language: "en",
          difficulty: "medium",
          size: "medium",
          currentStreak: 0,
          longestStreak: 0,
          lastCompletedDate: null,
          myCompletedToday: false,
          partnerCompletedToday: false,
          friendUserId: 2,
        },
      ],
    });
    jest.spyOn(readingsService, "listPending").mockResolvedValue({
      message: "ok",
      data: [],
    });
    jest.spyOn(friendsService, "listBlockedUsers").mockResolvedValue({
      message: "ok",
      data: [
        {
          id: 9,
          fullName: "Cuenta Bloqueada",
          createdAt: "2026-11-18T12:00:00.000Z",
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
    window.localStorage.clear();
  });

  it(
    "renders friends list, supports keyboard tab navigation, email request, null existing link note, and newly created invite link copy/WhatsApp",
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
            requestId: 72,
            id: 4,
            fullName: "Lucía",
            since: "2026-11-23T00:00:00.000Z",
            direction: "outgoing",
            origin: "email",
            createdAt: "2026-11-23T00:00:00.000Z",
          },
        });

      const createLinkSpy = jest
        .spyOn(friendsService, "createInviteLink")
        .mockResolvedValue({
          message: "ok",
          data: {
            id: 82,
            token: "tok-created-2",
            url: "http://localhost:3000/friends/invite?token=tok-created-2",
            maxUses: 1,
            usesCount: 0,
            expiresAt: "2099-12-01T00:00:00.000Z",
            revokedAt: null,
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

      expect(
        screen.getByText(/Por seguridad, la URL solo se muestra justo al crear/i),
      ).toBeInTheDocument();

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

      await user.click(
        screen.getByRole("button", { name: /Generar enlace de amistad/i }),
      );
      await waitFor(() => {
        expect(createLinkSpy).toHaveBeenCalledWith({ maxUses: 1 });
      });

      const whatsAppLink = screen.getByRole("link", { name: /WhatsApp/i });
      expect(whatsAppLink).toHaveAttribute(
        "href",
        expect.stringContaining("https://wa.me/?text="),
      );
      await user.click(screen.getByRole("button", { name: /Copiar enlace/i }));
      expect(writeTextMock).toHaveBeenCalledWith(
        "http://localhost:3000/friends/invite?token=tok-created-2",
      );
    },
    15_000,
  );

  it(
    "handles incoming request acceptance by requestId, streak acceptance without body (with optional category edit), and unblock by blocked.id",
    async () => {
      const user = userEvent.setup();
      const acceptRequestSpy = jest
        .spyOn(friendsService, "acceptRequest")
        .mockResolvedValue({
          message: "ok",
          data: {
            id: 71,
            friend: {
              id: 3,
              fullName: "Carlos Méndez",
              since: "2026-11-23T00:00:00.000Z",
            },
            createdAt: "2026-11-23T00:00:00.000Z",
          },
        });
      const updateCategoriesSpy = jest
        .spyOn(friendsService, "updateStreakCategories")
        .mockResolvedValue({
          message: "ok",
          data: {
            id: 50,
            status: "pending_partner",
            myCategories: ["Tecnología", "Ciencia"],
            partnerCategories: ["Cine", "Música"],
            language: "en",
            difficulty: "medium",
            size: "medium",
            currentStreak: 0,
            longestStreak: 0,
            lastCompletedDate: null,
            myCompletedToday: false,
            partnerCompletedToday: false,
            friendUserId: 2,
          },
        });
      const acceptStreakSpy = jest
        .spyOn(friendsService, "acceptStreak")
        .mockResolvedValue({
          message: "ok",
          data: {
            id: 50,
            status: "active",
            myCategories: ["Tecnología", "Ciencia"],
            partnerCategories: ["Cine", "Música"],
            language: "en",
            difficulty: "medium",
            size: "medium",
            currentStreak: 1,
            longestStreak: 1,
            lastCompletedDate: null,
            myCompletedToday: false,
            partnerCompletedToday: false,
            friendUserId: 2,
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
      expect(
        screen.getByText(/Ana Sofía te propuso esta racha diaria/i),
      ).toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: /Aceptar propuesta/i }),
      );
      const modal = screen.getByRole("dialog");
      // Historia venía preseleccionada: la cambiamos por Ciencia antes de confirmar
      await user.click(within(modal).getByRole("button", { name: "Historia" }));
      await user.click(within(modal).getByRole("button", { name: "Ciencia" }));
      await user.click(
        within(modal).getByRole("button", { name: /Aceptar y activar racha/i }),
      );
      await waitFor(() => {
        expect(updateCategoriesSpy).toHaveBeenCalledWith(50, {
          categories: ["Tecnología", "Ciencia"],
        });
        expect(acceptStreakSpy).toHaveBeenCalledWith(50);
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
