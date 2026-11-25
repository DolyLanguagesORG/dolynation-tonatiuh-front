import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

let mockAuthState: Record<string, unknown> = {};
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
};

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  usePathname: () => "/friends/invite/tok-123",
}));

jest.mock("@/context", () => ({
  useAuth: () => mockAuthState,
}));

jest.mock("@/context/toast-context", () => ({
  useToast: () => mockToast,
}));

import { FriendInviteView } from "@/app/friends/invite/[token]/_components/friend-invite-view";
import { LocaleProvider } from "@/i18n";
import { friendsService } from "@/lib";

describe("FriendInviteView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.sessionStorage.clear();
    mockAuthState = {
      accessPhase: "unauthenticated",
      isAuthenticated: false,
      logout: jest.fn(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("prompts unauthenticated visitors with inviter question, preserves pending redirect, and links to login/register", async () => {
    jest.spyOn(friendsService, "previewInviteLink").mockResolvedValue({
      message: "ok",
      data: {
        inviterName: "Ana Sofía",
        valid: true,
        expiresAt: "2099-12-01T00:00:00.000Z",
        alreadyFriends: false,
      },
    });

    render(
      <LocaleProvider initialLocale="es">
        <FriendInviteView token="tok-123" />
      </LocaleProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "¿Quieres ser amigo de Ana Sofía?",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /Iniciar sesión para aceptar/i }),
    ).toHaveAttribute(
      "href",
      "/login?redirect=%2Ffriends%2Finvite%3Ftoken%3Dtok-123",
    );
    expect(
      screen.getByRole("link", { name: /Crear cuenta/i }),
    ).toHaveAttribute(
      "href",
      "/register?redirect=%2Ffriends%2Finvite%3Ftoken%3Dtok-123",
    );
    expect(window.sessionStorage.getItem("doly.pending_invite_redirect")).toBe(
      "/friends/invite?token=tok-123",
    );
  });

  it("allows ready student to accept invite link and clears pending invite redirect", async () => {
    const user = userEvent.setup();
    window.sessionStorage.setItem(
      "doly.pending_invite_redirect",
      "/friends/invite?token=tok-123",
    );
    mockAuthState = {
      accessPhase: "ready",
      isAuthenticated: true,
      logout: jest.fn(),
    };
    jest.spyOn(friendsService, "previewInviteLink").mockResolvedValue({
      message: "ok",
      data: {
        inviterName: "Ana Sofía",
        valid: true,
        expiresAt: "2099-12-01T00:00:00.000Z",
        alreadyFriends: false,
      },
    });
    const acceptSpy = jest
      .spyOn(friendsService, "acceptInviteLink")
      .mockResolvedValue({
        message: "ok",
        data: {
          id: 11,
          friend: {
            id: 2,
            fullName: "Ana Sofía",
            since: "2026-11-23T00:00:00.000Z",
          },
          createdAt: "2026-11-23T00:00:00.000Z",
        },
      });

    render(
      <LocaleProvider initialLocale="es">
        <FriendInviteView token="tok-123" />
      </LocaleProvider>,
    );

    const acceptBtn = await screen.findByRole("button", { name: /^Aceptar$/i });
    await user.click(acceptBtn);

    await waitFor(() => {
      expect(acceptSpy).toHaveBeenCalledWith("tok-123");
    });
    expect(
      await screen.findByRole("heading", { name: /¡Ahora son amigos!/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Explorar lecturas de Ana Sofía/i }),
    ).toHaveAttribute("href", "/friends/2");
    expect(
      window.sessionStorage.getItem("doly.pending_invite_redirect"),
    ).toBeNull();
  });

  it("allows ready student to decline invite link and handles admin / expired states cleanly", async () => {
    const user = userEvent.setup();
    mockAuthState = {
      accessPhase: "ready",
      isAuthenticated: true,
      logout: jest.fn(),
    };
    const previewSpy = jest
      .spyOn(friendsService, "previewInviteLink")
      .mockResolvedValue({
        message: "ok",
        data: {
          inviterName: "Ana Sofía",
          valid: true,
          expiresAt: null,
          alreadyFriends: false,
        },
      });
    jest.spyOn(friendsService, "declineInviteLink").mockResolvedValue({
      message: "ok",
      data: null,
    });

    const { unmount } = render(
      <LocaleProvider initialLocale="es">
        <FriendInviteView token="tok-123" />
      </LocaleProvider>,
    );

    const declineBtn = await screen.findByRole("button", {
      name: /No aceptar/i,
    });
    await user.click(declineBtn);
    expect(
      await screen.findByText(/Invitación rechazada/i),
    ).toBeInTheDocument();
    unmount();

    mockAuthState = {
      accessPhase: "admin",
      isAuthenticated: true,
      logout: jest.fn(),
    };
    previewSpy.mockResolvedValue({
      message: "ok",
      data: {
        inviterName: "Ana Sofía",
        valid: false,
        expiresAt: null,
        alreadyFriends: false,
        reason: "expired",
      },
    });

    render(
      <LocaleProvider initialLocale="es">
        <FriendInviteView token="expired-tok" />
      </LocaleProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: /Enlace de invitación no válido/i,
      }),
    ).toBeInTheDocument();
  });
});
