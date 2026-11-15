import { expect, test } from "@playwright/test";

import { attachMockBackend, type MockReading } from "./support/mock-api";

const READINGS_FIXTURE: MockReading[] = [
  {
    id: 301,
    userId: 101,
    title: "Neon Skulls on City Walls for Dia de Muertos",
    description:
      "Discover how street artists use bright neon spray paint to transform modern city walls.",
    content: "Street art continues evolving ".repeat(48).trim(),
    category: "art",
    difficulty: "easy",
    language: "en",
    wordCount: 144,
    status: "pending",
    score: null,
    feedback: null,
    userResponse: null,
    passed: null,
    createdAt: "2026-11-14T09:00:00.000Z",
    updatedAt: null,
    deletedAt: null,
  },
  {
    id: 302,
    userId: 101,
    title: "L'avenir des bibliothèques numériques",
    description: "Une exploration de la lecture savante à l'ère moderne.",
    content: "La lecture numérique transforme nos habitudes ".repeat(45).trim(),
    category: "history",
    difficulty: "medium",
    language: "fr",
    wordCount: 360,
    status: "completed",
    score: 92,
    feedback: "Très bonne compréhension.",
    userResponse: "Résumé solide en français.",
    passed: true,
    createdAt: "2026-11-13T09:00:00.000Z",
    updatedAt: "2026-11-13T09:30:00.000Z",
    deletedAt: null,
  },
  {
    id: 303,
    userId: 101,
    title: "Architettura e luce nel Mediterraneo",
    description: "Come la luce definisce lo spazio pubblico.",
    content: "L'architettura mediterranea dialoga con il sole ".repeat(40).trim(),
    category: "design",
    difficulty: "hard",
    language: "it",
    wordCount: 180,
    status: "pending",
    score: null,
    feedback: null,
    userResponse: null,
    passed: null,
    createdAt: "2026-11-12T09:00:00.000Z",
    updatedAt: null,
    deletedAt: null,
  },
];

test.describe("Reading cards per-language immersion on Home and /readings", () => {
  test("renders each Home and /readings card immersed in its reading language while keeping outer shell in Spanish", async ({
    page,
    context,
    baseURL,
  }) => {
    await attachMockBackend(page, context, baseURL!, {
      initialAuthenticated: true,
      initialUser: { subscriptionTier: "dolly_pro" },
      initialSelectedLanguages: ["es", "en", "fr", "it"],
      initialSelectedCategories: ["art", "history", "design"],
      initialReadings: READINGS_FIXTURE,
    });

    // 1. Home dashboard (/)
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.getByText(/SESIÓN ACTIVA:|ACTIVE SESSION:/i)).toHaveCount(0);
    await expect(
      page.getByText(/PRECISIÓN PROMEDIO:|AVERAGE ACCURACY:|TÉRMINOS CONSULTADOS:|LOOKED-UP TERMS:/i),
    ).toHaveCount(0);
    await expect(page.getByText("ÚLTIMAS LECTURAS REALIZADAS")).toBeVisible();

    const enHomeCard = page.locator("article[lang='en']");
    const frHomeCard = page.locator("article[lang='fr']");
    const itHomeCard = page.locator("article[lang='it']");

    await expect(enHomeCard).toBeVisible();
    await expect(enHomeCard.getByText("[EN] ENGLISH")).toBeVisible();
    await expect(enHomeCard.getByText("EASY")).toBeVisible();
    await expect(enHomeCard.getByText("PENDING EVALUATION")).toBeVisible();
    await expect(enHomeCard.getByText("2 MIN READ • 144 WORDS")).toBeVisible();
    await expect(enHomeCard.getByRole("link", { name: "EVALUATE" })).toBeVisible();
    await expect(enHomeCard.getByRole("link", { name: "READ" })).toBeVisible();

    await expect(frHomeCard).toBeVisible();
    await expect(frHomeCard.getByText("[FR] FRANÇAIS")).toBeVisible();
    await expect(frHomeCard.getByText("MOYEN")).toBeVisible();
    await expect(frHomeCard.getByText("TERMINÉE (92/100)")).toBeVisible();
    await expect(frHomeCard.getByText("2 MIN DE LECTURE • 360 MOTS")).toBeVisible();
    await expect(frHomeCard.getByRole("link", { name: "RETOUR" })).toBeVisible();
    await expect(frHomeCard.getByRole("link", { name: "RELIRE" })).toBeVisible();

    await expect(itHomeCard).toBeVisible();
    await expect(itHomeCard.getByText("[IT] ITALIANO")).toBeVisible();
    await expect(itHomeCard.getByText("DIFFICILE")).toBeVisible();
    await expect(itHomeCard.getByText("IN ATTESA DI VALUTAZIONE")).toBeVisible();
    await expect(itHomeCard.getByText("2 MIN DI LETTURA • 180 PAROLE")).toBeVisible();
    await expect(itHomeCard.getByRole("link", { name: "VALUTA" })).toBeVisible();
    await expect(itHomeCard.getByRole("link", { name: "LEGGI" })).toBeVisible();
    await expect(page.getByText(/A1–A2|B1–B2|C1–C2|CEFR/)).toHaveCount(0);

    // Home filter input in Spanish UI still matches Spanish language query ("Francés")
    await page
      .getByPlaceholder("Ej. Cloud Systems, Francés, Cognición...")
      .fill("Francés");
    await expect(frHomeCard).toBeVisible();
    await expect(enHomeCard).toHaveCount(0);

    // 2. Readings archive (/readings)
    await page.goto("/readings");
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.getByText("TÍTULO DE LA LECTURA")).toBeVisible();

    const enRow = page.locator("tr[lang='en']");
    const frRow = page.locator("tr[lang='fr']");
    const itRow = page.locator("tr[lang='it']");

    await expect(enRow.getByText("[EN] ENGLISH")).toBeVisible();
    await expect(enRow.getByText("EASY")).toBeVisible();
    await expect(enRow.getByText("PENDING")).toBeVisible();
    await expect(enRow.getByRole("link", { name: "EVALUATE" })).toBeVisible();
    await expect(enRow.getByRole("link", { name: "READ" })).toBeVisible();

    await expect(frRow.getByText("[FR] FRANÇAIS")).toBeVisible();
    await expect(frRow.getByText("MOYEN")).toBeVisible();
    await expect(frRow.getByRole("link", { name: "DÉTAIL" })).toBeVisible();
    await expect(frRow.getByRole("link", { name: "RELIRE" })).toBeVisible();

    await expect(itRow.getByText("[IT] ITALIANO")).toBeVisible();
    await expect(itRow.getByText("DIFFICILE")).toBeVisible();
    await expect(itRow.getByText("IN SOSPESO")).toBeVisible();
    await expect(itRow.getByRole("link", { name: "VALUTA" })).toBeVisible();
    await expect(itRow.getByRole("link", { name: "LEGGI" })).toBeVisible();
    await expect(page.getByText(/A1–A2|B1–B2|C1–C2|CEFR/)).toHaveCount(0);

    // Immersed delete confirmation on Italian reading row
    await itRow
      .getByRole("button", {
        name: "Elimina lettura: Architettura e luce nel Mediterraneo",
      })
      .click();
    await expect(itRow.getByRole("button", { name: "Conferma" })).toBeVisible();
    await expect(itRow.getByRole("button", { name: "Annulla" })).toBeVisible();
  });

  test("reloading Home does not flash the subscription gate banner before account settings finish loading", async ({
    page,
    context,
    baseURL,
  }) => {
    await attachMockBackend(page, context, baseURL!, {
      initialAuthenticated: true,
      initialUser: { subscriptionTier: "dolly_pro" },
      initialSelectedLanguages: ["es", "en", "fr", "it"],
      initialSelectedCategories: ["art", "history", "design"],
      initialReadings: READINGS_FIXTURE,
    });

    await page.route(
      /\/api\/v1\/(?:subscriptions\/current|settings\/(?:languages|categories))(?:\?.*)?$/,
      async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 350));
        await route.fallback();
      },
    );

    await page.addInitScript(() => {
      const w = window as unknown as { __sawGateFlash?: boolean };
      w.__sawGateFlash = false;
      const checkText = () => {
        const text = document.body?.innerText ?? "";
        if (
          /SUBSCRIPTION REQUIRED|SUSCRIPCIÓN REQUERIDA|Select your plan to unlock|Selecciona tu plan para desbloquear|Completa tu configuración de aprendizaje/i.test(
            text,
          )
        ) {
          w.__sawGateFlash = true;
        }
      };
      const observer = new MutationObserver(checkText);
      const startObserving = () => {
        if (!document.documentElement) return;
        observer.observe(document.documentElement, {
          childList: true,
          subtree: true,
          characterData: true,
        });
        checkText();
      };
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startObserving);
      } else {
        startObserving();
      }
    });

    await page.goto("/");
    await expect(page.getByText("ÚLTIMAS LECTURAS REALIZADAS")).toBeVisible();

    await page.reload();
    await expect(page.getByText("ÚLTIMAS LECTURAS REALIZADAS")).toBeVisible();

    const sawGateFlash = await page.evaluate(
      () => (window as unknown as { __sawGateFlash?: boolean }).__sawGateFlash,
    );
    expect(sawGateFlash).toBe(false);
  });
});
