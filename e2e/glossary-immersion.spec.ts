import { expect, test } from "@playwright/test";

import {
  attachMockBackend,
  type MockGlossaryEntry,
  type MockReading,
} from "./support/mock-api";

const ACTIVE_EN_READING: MockReading = {
  id: 201,
  userId: 101,
  title: "Ancient Stoic Ideas",
  description: "Reflections by Marcus Aurelius.",
  content: "Marcus Aurelius wrote a private journal two thousand years ago.",
  category: "philosophy",
  difficulty: "easy",
  language: "en",
  wordCount: 10,
  status: "pending",
  score: null,
  feedback: null,
  userResponse: null,
  passed: null,
  createdAt: "2026-11-14T08:00:00.000Z",
  updatedAt: null,
  deletedAt: null,
};

const ACTIVE_FR_READING: MockReading = {
  id: 202,
  userId: 101,
  title: "Philosophie contemporaine",
  description: "Texte académique en français.",
  content: "En fin de compte, la lecture critique reste essentielle.",
  category: "philosophy",
  difficulty: "medium",
  language: "fr",
  wordCount: 9,
  status: "pending",
  score: null,
  feedback: null,
  userResponse: null,
  passed: null,
  createdAt: "2026-11-14T08:30:00.000Z",
  updatedAt: null,
  deletedAt: null,
};

const DELETED_IT_READING: MockReading = {
  id: 203,
  userId: 101,
  title: "Filosofia del mattino",
  description: "Lettura rimossa dall'utente.",
  content: "La chiarezza nasce dal pensiero disciplinato.",
  category: "philosophy",
  difficulty: "hard",
  language: "it",
  wordCount: 7,
  status: "pending",
  score: null,
  feedback: null,
  userResponse: null,
  passed: null,
  createdAt: "2026-11-14T07:00:00.000Z",
  updatedAt: null,
  deletedAt: "2026-11-14T09:00:00.000Z",
};

const SEEDED_ENTRIES: MockGlossaryEntry[] = [
  {
    id: 501,
    readingId: ACTIVE_EN_READING.id,
    readingTitle: ACTIVE_EN_READING.title,
    word: "wrote",
    normalizedWord: "wrote",
    entryType: "word",
    language: "en",
    difficulty: "easy",
    context: "Marcus Aurelius wrote a private journal.",
    literalMeaning: "Formed words or letters on a surface.",
    explanation: "Expresses the emperor's daily habit of journaling.",
    wordBreakdown: [
      {
        token: "wrote",
        lemma: "write",
        partOfSpeech: "verb",
        literalDefinition: "Past tense of write",
      },
    ],
    otherWaysToSay: [{ expression: "jotted down", note: "Quickly written" }],
    otherContexts: [
      {
        contextLabel: "JOURNALISM",
        explanation: "Used for reporting.",
        example: "She wrote the morning column.",
      },
    ],
    isSaved: true,
    savedAt: "2026-11-14T08:10:00.000Z",
    createdAt: "2026-11-14T08:10:00.000Z",
    updatedAt: "2026-11-14T08:10:00.000Z",
  },
  {
    id: 502,
    readingId: ACTIVE_FR_READING.id,
    readingTitle: ACTIVE_FR_READING.title,
    word: "en fin de compte",
    normalizedWord: "en fin de compte",
    entryType: "phrase",
    language: "fr",
    difficulty: "medium",
    context: "En fin de compte, la lecture critique reste essentielle.",
    literalMeaning: "Au terme du décompte.",
    explanation: "Introduit une conclusion générale.",
    wordBreakdown: [],
    otherWaysToSay: [],
    otherContexts: [],
    isSaved: true,
    savedAt: "2026-11-14T08:40:00.000Z",
    createdAt: "2026-11-14T08:40:00.000Z",
    updatedAt: "2026-11-14T08:40:00.000Z",
  },
  {
    id: 503,
    readingId: DELETED_IT_READING.id,
    readingTitle: DELETED_IT_READING.title,
    word: "chiarezza",
    normalizedWord: "chiarezza",
    entryType: "word",
    language: "it",
    difficulty: "hard",
    context: "La chiarezza nasce dal pensiero disciplinato.",
    literalMeaning: "Qualità di ciò che è chiaro.",
    explanation: "Indica lucidità concettuale nel ragionamento.",
    wordBreakdown: [],
    otherWaysToSay: [],
    otherContexts: [],
    isSaved: true,
    savedAt: "2026-11-14T07:10:00.000Z",
    createdAt: "2026-11-14T07:10:00.000Z",
    updatedAt: "2026-11-14T07:10:00.000Z",
  },
];

test.describe("Glossary per-card language immersion, plan filters & deleted reading state", () => {
  test("renders mixed-language cards immersed in each entry language, filters quickly on Pro, and hides links for deleted readings", async ({
    page,
    context,
    baseURL,
  }) => {
    await attachMockBackend(page, context, baseURL!, {
      initialAuthenticated: true,
      initialUser: { subscriptionTier: "dolly_pro" },
      initialSelectedLanguages: ["es", "en", "fr", "it"],
      initialSelectedCategories: ["philosophy", "history", "science"],
      initialReadings: [
        ACTIVE_EN_READING,
        ACTIVE_FR_READING,
        DELETED_IT_READING,
      ],
      initialExplanations: SEEDED_ENTRIES,
    });

    await page.goto("/glossary");

    // Global shell remains in Spanish while each card immerses in its own language
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    const enCard = page.locator("article[lang='en']");
    const frCard = page.locator("article[lang='fr']");
    const itCard = page.locator("article[lang='it']");

    await expect(enCard).toBeVisible();
    await expect(enCard.getByText("[EN] ENGLISH · EASY")).toBeVisible();
    await expect(
      enCard.getByRole("link", { name: /Open reading/i }),
    ).toBeVisible();

    await expect(frCard).toBeVisible();
    await expect(frCard.getByText("[FR] FRANÇAIS · MOYEN")).toBeVisible();
    await expect(
      frCard.getByRole("link", { name: /Ouvrir la lecture/i }),
    ).toBeVisible();

    // Soft-deleted Italian reading keeps context/title, removes Open link, shows Italian unavailable notice
    await expect(itCard).toBeVisible();
    await expect(itCard.getByText("[IT] ITALIANO · DIFFICILE")).toBeVisible();
    await expect(
      itCard.getByText(/La chiarezza nasce dal pensiero disciplinato/i),
    ).toBeVisible();
    await expect(
      itCard.getByRole("link", { name: /Apri lettura/i }),
    ).toHaveCount(0);
    await expect(itCard.getByText("Lettura non disponibile")).toBeVisible();

    // Quick language filter works in 1 click on Pro
    const langGroup = page.getByRole("radiogroup", {
      name: "Filtrar glosario por idioma",
    });
    await expect(
      langGroup.getByRole("radio", { name: /\[ES\] ESPAÑOL/i }),
    ).toBeVisible();
    await langGroup.getByRole("radio", { name: /\[FR\] FRANCÉS \(1\)/i }).click();

    await expect(frCard).toBeVisible();
    await expect(enCard).toHaveCount(0);
    await expect(itCard).toHaveCount(0);
  });

  test("marks historical consulted languages cleanly when user is on single-language Dolly plan", async ({
    page,
    context,
    baseURL,
  }) => {
    await attachMockBackend(page, context, baseURL!, {
      initialAuthenticated: true,
      initialUser: { subscriptionTier: "dolly" },
      initialSelectedLanguages: ["en"],
      initialSelectedCategories: ["philosophy", "history", "science"],
      initialReadings: [ACTIVE_EN_READING, ACTIVE_FR_READING],
      initialExplanations: SEEDED_ENTRIES.slice(0, 2),
    });

    await page.goto("/glossary");

    const langGroup = page.getByRole("radiogroup", {
      name: "Filtrar glosario por idioma",
    });
    await expect(
      langGroup.getByRole("radio", { name: /\[EN\] INGLÉS \(1\)/i }),
    ).toBeVisible();
    await expect(
      langGroup.getByRole("radio", { name: /\[FR\] FRANCÉS \(1\) · HISTÓRICO/i }),
    ).toBeVisible();
    await expect(
      langGroup.getByRole("radio", { name: /\[IT\] ITALIANO/i }),
    ).toHaveCount(0);
  });

  test("switches UI shell across ES, EN, FR, and IT from top Header dropdown while keeping cards immersed and persisting across reload", async ({
    page,
    context,
    baseURL,
  }) => {
    await attachMockBackend(page, context, baseURL!, {
      initialAuthenticated: true,
      initialUser: { subscriptionTier: "dolly_pro" },
      initialSelectedLanguages: ["es", "en", "fr", "it"],
      initialSelectedCategories: ["philosophy", "history", "science"],
      initialReadings: [
        ACTIVE_EN_READING,
        ACTIVE_FR_READING,
        DELETED_IT_READING,
      ],
      initialExplanations: SEEDED_ENTRIES,
    });

    await page.goto("/glossary");
    await expect(page.locator("html")).toHaveAttribute("lang", "es");

    // Switch global shell to French
    await page
      .getByRole("button", { name: /Idioma de interfaz: Español \(ES\)/i })
      .click();
    await page.getByRole("menuitemradio", { name: /FR\s*Français/i }).click();

    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(
      page.getByRole("heading", { name: "Glossaire et Aides Contextuelles" }),
    ).toBeVisible();
    await expect(
      page.locator("#doly-sidebar-desktop").getByRole("link", { name: "Accueil" }),
    ).toBeVisible();

    // Per-entry card immersion remains untouched
    const enCardFrShell = page.locator("article[lang='en']");
    const itCardFrShell = page.locator("article[lang='it']");
    await expect(enCardFrShell.getByText("[EN] ENGLISH · EASY")).toBeVisible();
    await expect(
      itCardFrShell.getByText("[IT] ITALIANO · DIFFICILE"),
    ).toBeVisible();

    // Reload persists French UI across server/client hydration
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(
      page.getByRole("heading", { name: "Glossaire et Aides Contextuelles" }),
    ).toBeVisible();

    // Switch global shell to Italian
    await page
      .getByRole("button", { name: /Langue de l'interface: Français \(FR\)/i })
      .click();
    await page.getByRole("menuitemradio", { name: /IT\s*Italiano/i }).click();

    await expect(page.locator("html")).toHaveAttribute("lang", "it");
    await expect(
      page.getByRole("heading", { name: "Glossario e Aiuti Contestuali" }),
    ).toBeVisible();
    await expect(
      page
        .locator("#doly-sidebar-desktop")
        .getByRole("link", { name: "Le Mie Letture" }),
    ).toBeVisible();

    // Cards stay in their target language even when UI shell is Italian
    await expect(enCardFrShell.getByText("Meaning in reading")).toBeVisible();
    await expect(
      page
        .locator("article[lang='fr']")
        .getByText("Ce que cela signifie dans cette lecture"),
    ).toBeVisible();

    // Switch global shell to English
    await page
      .getByRole("button", { name: /Lingua dell'interfaccia: Italiano \(IT\)/i })
      .click();
    await page.getByRole("menuitemradio", { name: /EN\s*English/i }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(
      page
        .locator("#doly-sidebar-desktop")
        .getByRole("link", { name: "My Readings" }),
    ).toBeVisible();
  });
});
