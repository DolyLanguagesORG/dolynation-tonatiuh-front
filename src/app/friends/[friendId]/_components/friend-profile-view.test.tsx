import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRefreshPreferences = jest.fn(async () => undefined);
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
};

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  usePathname: () => "/friends/2",
}));

jest.mock("@/context", () => ({
  useAuth: () => ({
    accessPhase: "ready",
    isAuthenticated: true,
    user: { id: 1, fullName: "Juan Student", role: "student" },
    categoriesSettings: null,
    languagesSettings: null,
    onboarding: {
      selectedCategories: ["Tecnología", "Ciencia"],
      selectedLanguages: ["en"],
    },
    refreshPreferences: mockRefreshPreferences,
  }),
}));

jest.mock("@/context/toast-context", () => ({
  useToast: () => mockToast,
}));

import { FriendProfileView } from "@/app/friends/[friendId]/_components/friend-profile-view";
import { LocaleProvider } from "@/i18n";
import { friendsService, readingsService, settingsService } from "@/lib";

describe("FriendProfileView", () => {
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
    jest.spyOn(friendsService, "listFriendReadings").mockResolvedValue({
      message: "ok",
      data: [
        {
          id: 301,
          title: "Clean Friend Essay",
          description: "Explores orbital telescopes.",
          content: "Paragraph one about deep space.\n\nParagraph two about optics.",
          category: "Ciencia",
          difficulty: "medium",
          language: "en",
          wordCount: 320,
          createdAt: "2026-11-21T10:00:00.000Z",
        },
      ],
    });
    jest.spyOn(friendsService, "getFriendCategories").mockResolvedValue({
      message: "ok",
      data: [
        { category: "Astrofísica", canonicalKey: "astrofisica" },
        { category: "Cine", canonicalKey: "cine" },
        { category: "Literatura", canonicalKey: "literatura" },
      ],
    });
    jest.spyOn(friendsService, "listStreaks").mockResolvedValue({
      message: "ok",
      data: [],
    });
    jest.spyOn(readingsService, "listPending").mockResolvedValue({
      message: "ok",
      data: [],
    });
    jest.spyOn(settingsService, "getCategories").mockResolvedValue({
      message: "ok",
      data: {
        catalog: [
          { id: "Tecnología", name: "Tecnología" },
          { id: "Ciencia", name: "Ciencia" },
        ],
        selected: ["Tecnología", "Ciencia"],
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

  it("renders friend readings strictly without private score/feedback, previews clean text, starts private copy, copies categories, and enforces 2 own + 2 friend categories on streak proposal", async () => {
    const user = userEvent.setup();

    jest.spyOn(friendsService, "getFriendReading").mockResolvedValue({
      message: "ok",
      data: {
        id: 301,
        title: "Clean Friend Essay",
        description: "Explores orbital telescopes.",
        category: "Ciencia",
        difficulty: "medium",
        language: "en",
        wordCount: 320,
        createdAt: "2026-11-21T10:00:00.000Z",
        content: "Paragraph one about deep space.\n\nParagraph two about optics.",
      },
    });
    const startReadingSpy = jest
      .spyOn(friendsService, "startFriendReading")
      .mockResolvedValue({
        message: "ok",
        data: {
          readingId: 888,
          sourceReadingId: 301,
          originType: "friend_copy",
        },
      });
    jest.spyOn(friendsService, "copyFriendCategories").mockResolvedValue({
      message: "ok",
      data: {
        activated: ["Astrofísica"],
        savedOnly: ["Cine"],
      },
    });
    const proposeStreakSpy = jest
      .spyOn(friendsService, "proposeStreak")
      .mockResolvedValue({
        message: "ok",
        data: {
          id: 61,
          status: "pending_partner",
          myCategories: ["Tecnología", "Ciencia"],
          partnerCategories: ["Astrofísica", "Cine"],
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

    render(
      <LocaleProvider initialLocale="es">
        <FriendProfileView friendIdParam="2" />
      </LocaleProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: "Ana Sofía" }),
    ).toBeInTheDocument();
    expect(friendsService.listFriendReadings).toHaveBeenCalledWith(2, {
      limit: 50,
    });
    expect(screen.getByText("Clean Friend Essay")).toBeInTheDocument();
    expect(screen.queryByText(/\/100/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Completada/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Leer texto/i }));
    const previewDialog = await screen.findByRole("dialog");
    expect(
      within(previewDialog).getByText("Paragraph one about deep space."),
    ).toBeInTheDocument();

    await user.click(
      within(previewDialog).getByRole("button", {
        name: /Leer y contestar en privado/i,
      }),
    );
    await waitFor(() => {
      expect(startReadingSpy).toHaveBeenCalledWith(2, 301);
      expect(mockPush).toHaveBeenCalledWith("/readings/888");
    });

    await user.click(screen.getByRole("tab", { name: /Categorías/i }));
    await user.click(screen.getByRole("button", { name: "Astrofísica" }));
    await user.click(screen.getByRole("button", { name: "Cine" }));

    await user.click(
      screen.getByRole("button", { name: /Copiar seleccionadas \(2\)/i }),
    );
    expect(
      await screen.findByText(/Activadas en tu plan: Astrofísica/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Solo guardadas en biblioteca.*Cine/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /Racha diaria/i }));
    await user.click(
      screen.getByRole("button", { name: /Proponer racha diaria/i }),
    );
    const streakDialog = screen.getByRole("dialog");
    const submitProposal = within(streakDialog).getByRole("button", {
      name: /Enviar propuesta/i,
    });
    expect(submitProposal).toBeDisabled();

    await user.click(
      within(streakDialog).getByRole("button", { name: "Tecnología" }),
    );
    await user.click(
      within(streakDialog).getByRole("button", { name: "Ciencia" }),
    );
    expect(submitProposal).toBeDisabled();

    await user.click(
      within(streakDialog).getByRole("button", { name: "Astrofísica" }),
    );
    await user.click(
      within(streakDialog).getByRole("button", { name: "Cine" }),
    );
    expect(submitProposal).not.toBeDisabled();

    await user.click(submitProposal);
    await waitFor(() => {
      expect(proposeStreakSpy).toHaveBeenCalledWith(2, {
        categories: ["Tecnología", "Ciencia"],
        friendCategories: ["Astrofísica", "Cine"],
        language: "en",
        difficulty: "medium",
        size: "medium",
      });
    });
    expect(
      await screen.findByText(/Esperando a que Ana Sofía acepte/i),
    ).toBeInTheDocument();
  },
  15_000,
);
});
