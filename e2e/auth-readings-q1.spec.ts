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

    // Click detected vocabulary chip to open contextual AI explanation popover
    const vocabChip = page.getByRole("button", { name: /comprehension/i }).first();
    await expect(vocabChip).toBeVisible();
    await vocabChip.click();

    const asidePanel = page.locator("aside");
    await expect(asidePanel).toBeVisible();
    await expect(
      asidePanel.getByText(/Explicación contextual académica/i),
    ).toBeVisible();

    // Save explanation to personal glossary
    const saveGlossaryBtn = asidePanel.locator("button", {
      hasText: /guardar/i,
    });
    await saveGlossaryBtn.click();
    await expect(asidePanel).toContainText(/guardad/i);

    // Navigate to glossary and verify persisted entry + filter
    await page.goto("/glossary");
    await expect(
      page.getByRole("heading", { name: "Comprehension" }),
    ).toBeVisible();
    await expect(page.getByText("GUARDADO").first()).toBeVisible();

    // Navigate to evaluation flow for this reading
    await page.goto(`/readings/${readingId}/evaluate`);
    const textarea = page.getByRole("textbox");

    // Below 15 words must trigger validation error
    await textarea.fill("Resumen muy corto.");
    await page
      .getByRole("button", { name: "Enviar resumen para evaluación por IA" })
      .click();
    await expect(page.getByText(/al menos 15 palabras/i)).toBeVisible();

    // >= 15 words + local draft persistence across reload
    const validSummary =
      "This reading explains the core foundations of academic technology, structured problem synthesis, critical comprehension strategies, and applied terminology across formal contexts.";
    await textarea.fill(validSummary);
    await page.getByRole("button", { name: /borrador/i }).click();

    await page.reload();
    await expect(page.getByRole("textbox")).toHaveValue(validSummary);

    await page
      .getByRole("button", { name: "Enviar resumen para evaluación por IA" })
      .click();

    await expect(page).toHaveURL(new RegExp(`/readings/${readingId}/result$`));
    await expect(page.getByText("90", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("90%")).toBeVisible();
    await expect(
      page.getByText("Excelente comprensión estructural del texto."),
    ).toBeVisible();
  });
});
