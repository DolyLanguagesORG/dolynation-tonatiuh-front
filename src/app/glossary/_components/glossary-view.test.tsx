import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import type { ReactNode } from "react";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => "/glossary",
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

interface MockAuthSnapshot {
  subscriptionTier: "dolly" | "dolly_plus" | "dolly_pro";
  maxLanguages: number;
  activeLanguages: ("es" | "en" | "fr" | "it")[];
  selectedLanguages: ("es" | "en" | "fr" | "it")[];
}

let mockAuthConfig: MockAuthSnapshot = {
  subscriptionTier: "dolly_pro",
  maxLanguages: 4,
  activeLanguages: ["es", "en", "fr", "it"],
  selectedLanguages: ["es", "en", "fr", "it"],
};

jest.mock("@/context", () => ({
  useAuth: () => ({
    user: {
      id: 7,
      email: "learner@example.com",
      fullName: "Ada Lovelace",
      subscriptionTier: mockAuthConfig.subscriptionTier,
      currentStreak: 3,
      lastStreakDate: null,
      emailVerifiedAt: "2026-11-10T10:00:00.000Z",
      locale: "es",
      createdAt: "2026-11-10T10:00:00.000Z",
    },
    subscription: {
      tier: mockAuthConfig.subscriptionTier,
      plan: {
        id: mockAuthConfig.subscriptionTier,
        name: mockAuthConfig.subscriptionTier,
        description: "Test plan",
        maxCategories: null,
        maxLanguages: mockAuthConfig.maxLanguages,
        allowedLanguages: ["es", "en", "fr", "it"],
        dailyReadingsLimit: null,
        dailyQuestionsLimit: null,
      },
      usage: {
        categoriesCount: 3,
        categoriesLimit: null,
        languagesCount: mockAuthConfig.activeLanguages.length,
        languagesLimit: mockAuthConfig.maxLanguages,
        readingsCreatedToday: 0,
        readingsLimit: null,
        readingsRemainingToday: null,
        questionsAskedToday: 0,
        questionsLimit: null,
        questionsRemainingToday: null,
      },
    },
    languagesSettings: {
      catalog: [
        { id: "es", name: "Español" },
        { id: "en", name: "Inglés" },
        { id: "fr", name: "Francés" },
        { id: "it", name: "Italiano" },
      ],
      selected: mockAuthConfig.selectedLanguages,
      active: mockAuthConfig.activeLanguages,
      maxLanguages: mockAuthConfig.maxLanguages,
      canChangeFree: false,
      nextFreeChangeAt: null,
      lastLanguageChangeAt: "2026-11-01T00:00:00.000Z",
      languageChangeCredits: 0,
    },
    accessPhase: "ready",
    isAuthenticated: true,
  }),
}));

import { GlossaryView } from "@/app/glossary/_components/glossary-view";
import { LocaleProvider } from "@/i18n";
import { type GlossaryEntryDto, readingsService } from "@/lib";

function Wrapper({ children }: { children: ReactNode }) {
  return <LocaleProvider initialLocale="es">{children}</LocaleProvider>;
}

const EN_ACTIVE_ENTRY: GlossaryEntryDto = {
  id: 1,
  readingId: 101,
  readingTitle: "Ancient Stoic Ideas",
  readingAvailable: true,
  word: "wrote",
  normalizedWord: "wrote",
  entryType: "word",
  language: "en",
  difficulty: "easy",
  context: "Marcus Aurelius wrote a private journal.",
  literalMeaning: "Formed letters on paper in the past.",
  explanation: "Describes his daily writing habit.",
  wordBreakdown: [
    {
      token: "wrote",
      lemma: "write",
      partOfSpeech: "verb",
      literalDefinition: "Recorded text in the past",
      roleInPhrase: "Main past-tense verb",
    },
  ],
  otherWaysToSay: [
    {
      expression: "put down on paper",
      register: "informal",
      note: "Physical act of writing thoughts",
    },
  ],
  otherContexts: [
    {
      contextLabel: "LITERARY CREATION",
      explanation: "Used for authoring books.",
      example: "Jane Austen wrote many novels.",
    },
  ],
  isSaved: true,
  savedAt: "2026-11-14T10:00:00.000Z",
  createdAt: "2026-11-14T10:00:00.000Z",
  updatedAt: "2026-11-14T10:00:00.000Z",
};

const FR_DELETED_ENTRY: GlossaryEntryDto = {
  id: 2,
  readingId: 102,
  readingTitle: "Les idées stoïciennes",
  readingAvailable: false,
  word: "en fin de compte",
  normalizedWord: "en fin de compte",
  entryType: "phrase",
  language: "fr",
  difficulty: "medium",
  context: "En fin de compte, la patience guide l'esprit.",
  literalMeaning: "Au bout du calcul.",
  explanation: "Exprime une conclusion après réflexion.",
  wordBreakdown: [
    {
      token: "compte",
      lemma: "compte",
      partOfSpeech: "nom",
      literalDefinition: "Résultat final",
      roleInPhrase: "Noyau de la locution",
    },
  ],
  otherWaysToSay: [],
  otherContexts: [],
  isSaved: true,
  savedAt: "2026-11-14T09:00:00.000Z",
  createdAt: "2026-11-14T09:00:00.000Z",
  updatedAt: "2026-11-14T09:00:00.000Z",
};

describe("GlossaryView per-card immersion, plan language filters & deleted-reading state", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockReplace.mockReset();
    mockAuthConfig = {
      subscriptionTier: "dolly_pro",
      maxLanguages: 4,
      activeLanguages: ["es", "en", "fr", "it"],
      selectedLanguages: ["es", "en", "fr", "it"],
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders mixed-language cards immersed in each entry language and handles deleted readings cleanly", async () => {
    jest.spyOn(readingsService, "getGlossary").mockResolvedValue({
      message: "OK",
      data: [EN_ACTIVE_ENTRY, FR_DELETED_ENTRY],
    });

    render(<GlossaryView />, { wrapper: Wrapper });

    const englishCard = (await screen.findByRole("heading", { name: "wrote" }))
      .closest("article") as HTMLElement;
    const frenchCard = screen
      .getByRole("heading", { name: "en fin de compte" })
      .closest("article") as HTMLElement;

    // Outer page remains in global Spanish UI locale
    expect(
      screen.getByRole("heading", { name: "Glosario y Ayudas Contextuales" }),
    ).toBeVisible();

    // English active card uses 100% English skeleton + Open reading link
    expect(englishCard).toHaveAttribute("lang", "en");
    expect(within(englishCard).getByText("WORD")).toBeVisible();
    expect(within(englishCard).getByText("[EN] ENGLISH · EASY")).toBeVisible();
    expect(within(englishCard).getByText("SAVED")).toBeVisible();
    expect(within(englishCard).getByText("Meaning in reading")).toBeVisible();
    expect(within(englishCard).getByText("Literal sense")).toBeVisible();
    expect(
      within(englishCard).getByRole("button", { name: "Remove from saved" }),
    ).toBeVisible();
    expect(
      within(englishCard).getByRole("button", { name: "Hide details" }),
    ).toBeVisible();
    expect(within(englishCard).getByText("Role: Main past-tense verb")).toBeVisible();
    const openLink = within(englishCard).getByRole("link", {
      name: /Open reading/i,
    });
    expect(openLink).toHaveAttribute("href", "/readings/101");

    // French deleted-reading card uses 100% French skeleton, preserves context, hides open link, shows unavailable notice
    expect(frenchCard).toHaveAttribute("lang", "fr");
    expect(within(frenchCard).getByText("PHRASE · EXPRESSION")).toBeVisible();
    expect(
      within(frenchCard).getByText("[FR] FRANÇAIS · MOYEN"),
    ).toBeVisible();
    expect(within(frenchCard).getByText("ENREGISTRÉ")).toBeVisible();
    expect(
      within(frenchCard).getByText("Ce que cela signifie dans cette lecture"),
    ).toBeVisible();
    expect(within(frenchCard).getByText("Sens littéral")).toBeVisible();
    expect(
      within(frenchCard).getByText(/En fin de compte, la patience guide/i),
    ).toBeVisible();
    expect(
      within(frenchCard).queryByRole("link", { name: /Ouvrir la lecture/i }),
    ).toBeNull();
    expect(
      within(frenchCard).getByText("Lecture indisponible"),
    ).toBeVisible();
    expect(
      within(frenchCard).getByText(/La lecture d'origine a été supprimée/i),
    ).toBeVisible();
  });

  it("filters entries in one click by plan-allowed quick language chips", async () => {
    mockAuthConfig = {
      subscriptionTier: "dolly_plus",
      maxLanguages: 2,
      activeLanguages: ["en", "fr"],
      selectedLanguages: ["en", "fr"],
    };

    jest.spyOn(readingsService, "getGlossary").mockResolvedValue({
      message: "OK",
      data: [EN_ACTIVE_ENTRY, FR_DELETED_ENTRY],
    });

    render(<GlossaryView />, { wrapper: Wrapper });
    const user = userEvent.setup();

    await screen.findByRole("heading", { name: "wrote" });

    const languageGroup = screen.getByRole("radiogroup", {
      name: "Filtrar glosario por idioma",
    });
    expect(
      within(languageGroup).getByRole("radio", { name: /\[EN\] INGLÉS \(1\)/i }),
    ).toBeVisible();
    expect(
      within(languageGroup).getByRole("radio", { name: /\[FR\] FRANCÉS \(1\)/i }),
    ).toBeVisible();
    expect(
      within(languageGroup).queryByRole("radio", { name: /\[IT\] ITALIANO/i }),
    ).toBeNull();

    await user.click(
      within(languageGroup).getByRole("radio", { name: /\[FR\] FRANCÉS \(1\)/i }),
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "wrote" }),
      ).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole("heading", { name: "en fin de compte" }),
    ).toBeVisible();
  });

  it("renders simplified single-language badge on Dolly plan when only one active language exists", async () => {
    mockAuthConfig = {
      subscriptionTier: "dolly",
      maxLanguages: 1,
      activeLanguages: ["en"],
      selectedLanguages: ["en"],
    };

    jest.spyOn(readingsService, "getGlossary").mockResolvedValue({
      message: "OK",
      data: [EN_ACTIVE_ENTRY],
    });

    render(<GlossaryView />, { wrapper: Wrapper });

    await screen.findByRole("heading", { name: "wrote" });
    expect(
      screen.queryByRole("radiogroup", { name: "Filtrar glosario por idioma" }),
    ).toBeNull();
    expect(
      screen.getByText(/Idioma activo de tu plan: \[EN\] INGLÉS \(1\)/i),
    ).toBeVisible();
  });

  it("localizes outer glossary shell into French and Italian while keeping each entry card immersed in its language", async () => {
    jest.spyOn(readingsService, "getGlossary").mockResolvedValue({
      message: "OK",
      data: [EN_ACTIVE_ENTRY, FR_DELETED_ENTRY],
    });

    const { unmount } = render(
      <LocaleProvider initialLocale="fr">
        <GlossaryView />
      </LocaleProvider>,
    );

    const englishCardFr = (await screen.findByRole("heading", { name: "wrote" }))
      .closest("article") as HTMLElement;
    const frenchCardFr = screen
      .getByRole("heading", { name: "en fin de compte" })
      .closest("article") as HTMLElement;

    expect(
      screen.getByRole("heading", { name: "Glossaire et Aides Contextuelles" }),
    ).toBeVisible();
    expect(englishCardFr).toHaveAttribute("lang", "en");
    expect(within(englishCardFr).getByText("WORD")).toBeVisible();
    expect(frenchCardFr).toHaveAttribute("lang", "fr");
    expect(within(frenchCardFr).getByText("PHRASE · EXPRESSION")).toBeVisible();
    expect(within(frenchCardFr).getByText("ENREGISTRÉ")).toBeVisible();
    unmount();

    render(
      <LocaleProvider initialLocale="it">
        <GlossaryView />
      </LocaleProvider>,
    );

    const englishCardIt = (await screen.findByRole("heading", { name: "wrote" }))
      .closest("article") as HTMLElement;
    expect(
      screen.getByRole("heading", { name: "Glossario e Aiuti Contestuali" }),
    ).toBeVisible();
    expect(within(englishCardIt).getByText("Literal sense")).toBeVisible();
  });
});
