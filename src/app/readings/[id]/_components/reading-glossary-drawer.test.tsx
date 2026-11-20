import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import type { ReactNode } from "react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/readings/42",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...rest
  }: {
    children: ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock("@/context", () => ({
  useAuth: () => ({
    user: {
      id: 7,
      email: "learner@example.com",
      fullName: "Ada Lovelace",
      subscriptionTier: "dolly_pro",
      currentStreak: 3,
      lastStreakDate: null,
      emailVerifiedAt: "2026-11-10T10:00:00.000Z",
      locale: "es",
      createdAt: "2026-11-10T10:00:00.000Z",
    },
    accessPhase: "ready",
    isAuthenticated: true,
  }),
}));

import { ReadingDetailView } from "@/app/readings/[id]/_components/reading-detail-view";
import { LocaleProvider } from "@/i18n";
import { type GlossaryEntryDto, type ReadingDto, readingsService } from "@/lib";

function Wrapper({ children }: { children: ReactNode }) {
  return <LocaleProvider initialLocale="es">{children}</LocaleProvider>;
}

const SPANISH_READING: ReadingDto = {
  id: 42,
  userId: 7,
  title: "El choque estelar en el Altiplano",
  description: "Cosmovisión andina y astronomía jesuita.",
  content:
    "Durante el siglo XVII, los Andes centrales presenciaron un intenso conflicto intelectual cuando la cosmovisión andina chocó frontalmente.",
  category: "astronomy",
  difficulty: "medium",
  language: "es",
  wordCount: 21,
  status: "pending",
  score: null,
  feedback: null,
  userResponse: null,
  passed: null,
  createdAt: "2026-11-13T12:00:00.000Z",
  updatedAt: null,
  deletedAt: null,
};

const CONSULTED_ENTRIES: GlossaryEntryDto[] = [
  {
    id: 101,
    readingId: 42,
    readingTitle: SPANISH_READING.title,
    readingAvailable: true,
    word: "cosmovisión",
    normalizedWord: "cosmovisión",
    entryType: "word",
    language: "es",
    difficulty: "medium",
    context: "cuando la cosmovisión andina chocó frontalmente.",
    literalMeaning: "Visión del cosmos.",
    explanation: "Forma integral de interpretar el mundo y el universo.",
    wordBreakdown: [],
    otherWaysToSay: [],
    otherContexts: [],
    isSaved: true,
    savedAt: "2026-11-14T10:00:00.000Z",
    createdAt: "2026-11-14T10:00:00.000Z",
    updatedAt: "2026-11-14T10:00:00.000Z",
  },
  {
    id: 102,
    readingId: 42,
    readingTitle: SPANISH_READING.title,
    readingAvailable: true,
    word: "conflicto intelectual",
    normalizedWord: "conflicto intelectual",
    entryType: "phrase",
    language: "es",
    difficulty: "medium",
    context: "presenciaron un intenso conflicto intelectual.",
    literalMeaning: "Choque de ideas.",
    explanation: "Disputa entre distintas corrientes de pensamiento.",
    wordBreakdown: [],
    otherWaysToSay: [],
    otherContexts: [],
    isSaved: false,
    savedAt: null,
    createdAt: "2026-11-14T10:05:00.000Z",
    updatedAt: "2026-11-14T10:05:00.000Z",
  },
];

describe("ReadingDetailView right-side glossary drawer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("removes bottom detected/consulted chips and opens right overlay drawer via toolbar button without floating button", async () => {
    const user = userEvent.setup();
    jest.spyOn(readingsService, "getById").mockResolvedValue({
      message: "OK",
      data: SPANISH_READING,
    });
    jest.spyOn(readingsService, "listExplanations").mockResolvedValue({
      message: "OK",
      data: CONSULTED_ENTRIES,
    });

    render(<ReadingDetailView readingId="42" />, { wrapper: Wrapper });

    expect(
      await screen.findByText("El choque estelar en el Altiplano"),
    ).toBeInTheDocument();

    // Bottom vocabulary/consulted section is removed from footer
    expect(
      screen.queryByText(/VOCABULARIO DETECTADO EN ESTA LECTURA/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/AYUDAS Y TÉRMINOS CONSULTADOS EN ESTA LECTURA/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();

    // Toolbar button is accessible and no floating bottom-right button is rendered
    const toolbarBtn = screen.getByRole("button", {
      name: /Abrir panel lateral de glosario y ayuda/i,
    });
    expect(toolbarBtn).toHaveTextContent("Glosario (2)");
    expect(
      screen.queryByRole("button", { name: /Abrir glosario lateral/i }),
    ).not.toBeInTheDocument();

    // Open via toolbar button -> shows Consultados tab without displacing article
    await user.click(toolbarBtn);

    const drawer = await screen.findByTestId("reading-glossary-drawer");
    expect(drawer.parentElement).toHaveClass("fixed", "inset-0", "justify-end");

    expect(within(drawer).getByText("cosmovisión")).toBeInTheDocument();
    expect(
      within(drawer).getByText("conflicto intelectual"),
    ).toBeInTheDocument();

    // Filter saved only
    await user.click(
      within(drawer).getByRole("button", { name: /Solo guardados \(1\)/i }),
    );
    expect(within(drawer).getByText("cosmovisión")).toBeInTheDocument();
    expect(
      within(drawer).queryByText("conflicto intelectual"),
    ).not.toBeInTheDocument();

    // Click consulted entry -> switches to Explanation tab inside the drawer
    await user.click(within(drawer).getByText("cosmovisión"));
    expect(
      within(drawer).getByText(
        "Forma integral de interpretar el mundo y el universo.",
      ),
    ).toBeInTheDocument();

    // Close via Escape and reopen via toolbar button
    await user.keyboard("{Escape}");
    expect(
      screen.queryByTestId("reading-glossary-drawer"),
    ).not.toBeInTheDocument();

    await user.click(toolbarBtn);
    expect(
      await screen.findByTestId("reading-glossary-drawer"),
    ).toBeInTheDocument();
  });
});
