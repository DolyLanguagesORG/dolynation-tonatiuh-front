import { expect, test } from "@playwright/test";

import { attachMockBackend } from "./support/mock-api";

test.describe("Auth Session Revocation (T6), Password Reset & Q1 Core Loop", () => {
  test("T6: revokes all active sessions via logout-all and blocks protected workspace routes", async ({
    page,
    context,
    baseURL,
  }) => {
    const mock = await attachMockBackend(page, context, baseURL!, {
      initialAuthenticated: true,
      initialUser: { subscriptionTier: "dolly_pro" },
      initialSelectedLanguages: ["en"],
      initialSelectedCategories: ["technology", "history", "education"],
    });

    await page.goto("/profile");
    await page
      .getByRole("button", { name: "Cerrar todas las sesiones" })
      .click();
    await page.getByRole("button", { name: "Confirmar cierre global" }).click();

    await expect(page).toHaveURL(/\/login/);
    expect(mock.state.sessionActive).toBe(false);

    // Subsequent visit to protected route redirects back to login
    await page.goto("/readings");
    await expect(page).toHaveURL(/\/login/);
  });

  test("Forgot & Reset Password: sends recovery link, rejects invalid token, and accepts valid reset token", async ({
    page,
    context,
    baseURL,
  }) => {
    await attachMockBackend(page, context, baseURL!, {
      validResetToken: "reset-token-valid-999",
    });

    await page.goto("/forgot-password");
    await page.locator("#forgot-password-email").fill("ada@example.com");
    await page
      .getByRole("button", { name: "Enviar enlace de recuperación" })
      .click();

    await expect(page.getByText("CORREO ENVIADO")).toBeVisible();
    await expect(page.getByText("ada@example.com")).toBeVisible();

    // Invalid reset token surfaces AUTH_EMAIL_TOKEN_INVALID
    await page.goto("/reset-password?token=expired-reset-token");
    await page.locator("#reset-password-new").fill("NewStrongPass123!");
    await page.locator("#reset-password-confirm").fill("NewStrongPass123!");
    await page
      .getByRole("button", { name: "Guardar nueva contraseña" })
      .click();
    await expect(page.getByText("AUTH_EMAIL_TOKEN_INVALID")).toBeVisible();

    // Valid token updates password
    await page.goto("/reset-password?token=reset-token-valid-999");
    await page.locator("#reset-password-new").fill("NewStrongPass123!");
    await page.locator("#reset-password-confirm").fill("NewStrongPass123!");
    await page
      .getByRole("button", { name: "Guardar nueva contraseña" })
      .click();
    await expect(page.getByText("CONTRASEÑA ACTUALIZADA")).toBeVisible();
  });

  test("Q1: supports all 4 languages on Pro, generates reading, saves AI explanation to glossary, and completes draft + comprehension evaluation", async ({
    page,
    context,
    baseURL,
  }) => {
    await attachMockBackend(page, context, baseURL!, {
      initialAuthenticated: true,
      initialUser: { subscriptionTier: "dolly_pro" },
      initialSelectedLanguages: ["en"],
      initialSelectedCategories: ["technology", "history", "education"],
    });

    await page.goto("/generate");

    // Q1: Dolly Pro exposes all 4 supported languages (es, en, fr, it)
    await expect(page.getByRole("radio", { name: /Español/i })).toBeVisible();
    await expect(page.getByRole("radio", { name: /Inglés/i })).toBeVisible();
    await expect(page.getByRole("radio", { name: /Francés/i })).toBeVisible();
    await expect(page.getByRole("radio", { name: /Italiano/i })).toBeVisible();

    await page.getByRole("radio", { name: /Francés/i }).click();
    await page
      .getByRole("button", { name: "GENERAR Y COMENZAR LECTURA" })
      .click();

    await expect(page).toHaveURL(/\/readings\/(\d+)$/);
    const readingUrlMatch = /\/readings\/(\d+)$/.exec(page.url());
    const readingId = readingUrlMatch?.[1];
    expect(readingId).toBeTruthy();

    // Immersive reading shell: no navbar, sidebar, streak, or footer
    await expect(page.getByRole("banner")).toHaveCount(0);
    await expect(page.locator("footer")).toHaveCount(0);
    await expect(page.locator("#doly-sidebar-desktop")).toHaveCount(0);
    await expect(page.getByText(/Racha:/i)).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");

    // French reading renders all chrome in French while preserving internal nav controls
    await expect(page.getByText("RETOUR AUX LECTURES")).toBeVisible();
    await expect(page.getByText("[FR] FRANÇAIS")).toBeVisible();
    await expect(page.getByText("CONTINUER L'ÉVALUATION")).toBeVisible();
    await expect(page.getByText("Revenir à la configuration")).toBeVisible();

    // Click detected vocabulary chip to open contextual AI explanation popover in French
    const vocabChip = page.getByRole("button", { name: /comprehension/i }).first();
    await expect(vocabChip).toBeVisible();
    await vocabChip.click();

    const asidePanel = page.locator("aside");
    await expect(asidePanel).toBeVisible();
    await expect(asidePanel.getByText("Sens littéral")).toBeVisible();
    await expect(
      asidePanel.getByText("Ce que cela signifie dans cette lecture"),
    ).toBeVisible();
    await expect(
      asidePanel.getByText(/Explicación contextual académica/i),
    ).toBeVisible();

    // Save explanation to personal glossary (French button labels)
    const saveGlossaryBtn = asidePanel.getByRole("button", {
      name: "Enregistrer dans le glossaire",
    });
    await saveGlossaryBtn.click();
    await expect(
      asidePanel.getByRole("button", { name: "Enregistré dans le glossaire" }),
    ).toBeVisible();

    // Navigate to glossary: global shell returns in outer UI locale
    await page.goto("/glossary");
    await expect(page.getByRole("banner")).toHaveCount(1);
    await expect(page.locator("footer")).toHaveCount(1);
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(
      page.getByRole("heading", { name: "Comprehension" }),
    ).toBeVisible();
    await expect(page.getByText("GUARDADO").first()).toBeVisible();

    // Navigate to evaluation flow for this French reading (immersive French, no global chrome)
    await page.goto(`/readings/${readingId}/evaluate`);
    await expect(page.getByRole("banner")).toHaveCount(0);
    await expect(page.locator("footer")).toHaveCount(0);
    await expect(page.locator("#doly-sidebar-desktop")).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.getByText("Revenir au texte original")).toBeVisible();
    const textarea = page.getByRole("textbox");
    await expect(textarea).toHaveAttribute("lang", "fr");

    // Below 15 words must trigger French validation error
    await textarea.fill("Résumé très court.");
    await page
      .getByRole("button", {
        name: "Envoyer le résumé pour évaluation par l'IA",
      })
      .click();
    await expect(page.getByText(/au moins 15 mots/i)).toBeVisible();

    // >= 15 words + local draft persistence across reload
    const validSummary =
      "Ce texte explore les fondements essentiels de la technologie académique, la synthèse structurée des idées, l'analyse critique et le lexique appliqué en contexte.";
    await textarea.fill(validSummary);
    await page.getByRole("button", { name: /brouillon/i }).click();
    await expect(
      page.getByText("Brouillon enregistré localement"),
    ).toBeVisible();

    await page.reload();
    await expect(page.getByRole("textbox")).toHaveValue(validSummary);

    await page
      .getByRole("button", {
        name: "Envoyer le résumé pour évaluation par l'IA",
      })
      .click();

    await expect(page).toHaveURL(new RegExp(`/readings/${readingId}/result$`));
    await expect(page.getByRole("banner")).toHaveCount(0);
    await expect(page.locator("footer")).toHaveCount(0);
    await expect(page.locator("#doly-sidebar-desktop")).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.getByText("• ÉVALUATION TERMINÉE")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Générer une nouvelle lecture" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Voir mes lectures terminées" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Accueil" })).toBeVisible();
    await expect(
      page.getByText(/Marco de evaluación contextual alineado/i),
    ).toHaveCount(0);
    await expect(page.getByText("90", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("90%")).toBeVisible();
    await expect(
      page.getByText("Excelente comprensión estructural del texto."),
    ).toBeVisible();
  });

  test("Reading interactive selection: clicks build contiguous range within a paragraph, reset across paragraphs, and confirm via floating bar before calling AI", async ({
    page,
    context,
    baseURL,
  }) => {
    const mock = await attachMockBackend(page, context, baseURL!, {
      initialAuthenticated: true,
      initialUser: { subscriptionTier: "dolly_pro" },
      initialSelectedLanguages: ["es"],
      initialSelectedCategories: ["history", "culture", "education"],
      initialReadings: [
        {
          id: 473,
          userId: 101,
          title: "Lectura Contextual de Prueba",
          description: "Ensayo breve sobre el exilio y la memoria.",
          content:
            "En el exilio de mil novecientos treinta y nueve, marcado por la ruptura. Lejos de concebir la melancolía como un estado pasivo.\n\nEsta perspectiva innovadora desafió la separación tradicional.",
          category: "history",
          difficulty: "medium",
          language: "es",
          wordCount: 30,
          status: "pending",
          score: null,
          feedback: null,
          userResponse: null,
          passed: null,
          createdAt: "2026-11-13T00:00:00.000Z",
          updatedAt: null,
          deletedAt: null,
        },
      ],
    });

    await page.goto("/readings/473");

    const article = page.locator("article");
    const explainFloatingBtn = article.getByRole("button", {
      name: "Pedir ayuda / Explicar",
    });

    // 1. Clic en primera palabra NO dispara POST IA inmediata; muestra barra flotante
    await article.getByText("exilio", { exact: true }).click();
    await expect(explainFloatingBtn).toBeVisible();
    await expect(page.locator("aside")).toHaveCount(0);
    expect(
      mock.state.requests.filter(
        (r) => r.path.includes("/explanations") && r.method === "POST",
      ),
    ).toHaveLength(0);

    // 2. Limpiar con el botón × del menú flotante
    await article.getByRole("button", { name: "Limpiar selección" }).click();
    await expect(explainFloatingBtn).toHaveCount(0);

    // 3. Clic en otro párrafo reinicia la selección en ese párrafo (nunca cruza párrafos)
    await article.getByText("exilio", { exact: true }).click();
    await article.getByText("innovadora", { exact: true }).click();
    await expect(
      article.getByText("exilio", { exact: true }),
    ).not.toHaveAttribute("data-selected", "pending");
    await expect(
      article.getByText("innovadora", { exact: true }),
    ).toHaveAttribute("data-selected", "pending");

    // 4. Volver al primer párrafo y seleccionar rango continuo cruzando oración
    await article.getByText("exilio", { exact: true }).click();
    await article.getByText("melancolía", { exact: true }).click();
    await expect(
      article.getByText("ruptura.", { exact: true }),
    ).toHaveAttribute("data-selected", "pending");
    await expect(
      article.getByText("Lejos", { exact: true }),
    ).toHaveAttribute("data-selected", "pending");

    // 5. Confirmar en menú flotante envía toda la frase contigua a la IA y la mantiene resaltada
    await explainFloatingBtn.click();

    const expectedPhrase =
      "exilio de mil novecientos treinta y nueve, marcado por la ruptura. Lejos de concebir la melancolía";
    const asidePanel = page.locator("aside");
    await expect(asidePanel).toBeVisible();
    await expect(asidePanel).toContainText(expectedPhrase);
    expect(
      mock.state.requests.filter(
        (r) => r.path.includes("/explanations") && r.method === "POST",
      ),
    ).toHaveLength(1);
    await expect(
      article.getByText("exilio", { exact: true }),
    ).toHaveAttribute("data-selected", "confirmed");
    await expect(
      article.getByText("melancolía", { exact: true }),
    ).toHaveAttribute("data-selected", "confirmed");

    // 6. Cerrar el panel lateral limpia el resaltado en la lectura
    await asidePanel.getByRole("button", { name: "Cerrar ayuda" }).click();
    await expect(asidePanel).toHaveCount(0);
    await expect(
      article.getByText("exilio", { exact: true }),
    ).not.toHaveAttribute("data-selected", "confirmed");

    // 7. Arrastre real con mouse en el navegador dentro del segundo párrafo
    const startBox = await article
      .getByText("perspectiva", { exact: true })
      .boundingBox();
    const endBox = await article
      .getByText("innovadora", { exact: true })
      .boundingBox();
    expect(startBox).not.toBeNull();
    expect(endBox).not.toBeNull();

    await page.mouse.move(
      startBox!.x + 4,
      startBox!.y + startBox!.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      endBox!.x + endBox!.width - 4,
      endBox!.y + endBox!.height / 2,
      { steps: 8 },
    );
    await page.mouse.up();

    await expect(explainFloatingBtn).toBeVisible();
    await expect(
      article.getByText("perspectiva", { exact: true }),
    ).toHaveAttribute("data-selected", "pending");
    await expect(
      article.getByText("innovadora", { exact: true }),
    ).toHaveAttribute("data-selected", "pending");

    await explainFloatingBtn.click();
    await expect(asidePanel).toBeVisible();
    await expect(asidePanel).toContainText("perspectiva innovadora");
  });
});
