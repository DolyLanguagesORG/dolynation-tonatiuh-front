import { expect, test } from "@playwright/test";

import { attachMockBackend } from "./support/mock-api";

test.describe("Onboarding & Gating Flows (Frontend Core)", () => {
  test("Test 1: blocks all protected routes and login until email is verified", async ({
    page,
    context,
    baseURL,
  }) => {
    test.setTimeout(90_000);
    const mock = await attachMockBackend(page, context, baseURL!, {
      emailVerificationRequired: true,
      validVerificationToken: "verify-ok-123",
    });

    await page.goto("/register");

    await page.locator("#register-first-name").fill("Sofía");
    await page.locator("#register-last-name").fill("Morales");
    await page.locator("#register-email").fill("sofia.unverified@example.com");
    await page.locator("#register-password").fill("SecurePass123!");
    await page.locator("#register-accept-terms").check();

    await page
      .getByRole("button", { name: "Crear cuenta y comenzar" })
      .click();

    await expect(page).toHaveURL(/\/verify-email$/);
    await expect(page.getByText("VALIDACIÓN PENDIENTE")).toBeVisible();

    const blockedRoutes = [
      "/",
      "/generate",
      "/readings",
      "/glossary",
      "/profile",
      "/select-plan",
      "/setup-preferences",
    ];

    for (const routePath of blockedRoutes) {
      await page.goto(routePath);
      await expect(page).toHaveURL(/\/verify-email$/, { timeout: 15_000 });
    }

    // Switch back to login via explicit secondary CTA and confirm unverified login is bounced back to /verify-email (403)
    await page
      .getByRole("button", { name: /Usar otra cuenta o iniciar sesión/i })
      .click();
    await expect(page).toHaveURL(/\/login$/);
    await page
      .getByLabel(/Correo electrónico/i)
      .fill("sofia.unverified@example.com");
    await page.locator("#login-password").fill("SecurePass123!");
    await page
      .getByRole("button", { name: "Iniciar sesión en DolyNation" })
      .click();
    await expect(page).toHaveURL(/\/verify-email$/);
    expect(
      mock.state.requests.some(
        (r) => r.method === "POST" && r.path === "/auth/login",
      ),
    ).toBe(true);

    // Invalid verification token stays blocked
    await page.goto("/verify-email?token=expired-invalid-token");
    await expect(page.getByText("ENLACE INVÁLIDO")).toBeVisible();

    // Valid token verifies the account and advances to plan selection
    await page.goto("/verify-email?token=verify-ok-123");
    await expect(page).toHaveURL(/\/select-plan$/);
    await expect(
      page.getByRole("heading", { name: "Selecciona tu Plan de Suscripción" }),
    ).toBeVisible();
  });

  test("Test 2: verified user without a subscription plan is blocked from workspace views", async ({
    page,
    context,
    baseURL,
  }) => {
    const mock = await attachMockBackend(page, context, baseURL!, {
      emailVerificationRequired: true,
      initialAuthenticated: true,
      initialUser: {
        email: "verified.noplan@example.com",
        emailVerifiedAt: "2026-11-13T00:00:00.000Z",
        subscriptionTier: null,
      },
    });

    const restrictedRoutes = [
      "/",
      "/generate",
      "/readings",
      "/glossary",
      "/profile",
      "/setup-preferences",
    ];

    for (const routePath of restrictedRoutes) {
      await page.goto(routePath);
      await expect(page).toHaveURL(/\/select-plan$/);
    }

    // Minimal shell hides full navigation links until plan is chosen
    await expect(
      page.getByRole("link", { name: /Generar lectura/i }),
    ).toHaveCount(0);

    // Selecting Dolly unlocks setup-preferences
    await page
      .locator("button, [role='button'], [role='radio']")
      .filter({ hasText: "Plan inicial enfocado en un idioma" })
      .first()
      .click();

    await page
      .getByRole("button", { name: /Confirmar plan y configurar preferencias/i })
      .click();

    await expect(page).toHaveURL(/\/setup-preferences$/);
    expect(mock.state.user?.subscriptionTier).toBe("dolly");
  });

  test("Test 3-A: blocks generation on dolly when no target language is selected", async ({
    page,
    context,
    baseURL,
  }) => {
    const dollyMock = await attachMockBackend(page, context, baseURL!, {
      initialAuthenticated: true,
      initialUser: {
        email: "dolly.nolang@example.com",
        subscriptionTier: "dolly",
      },
      initialSelectedLanguages: [],
      initialSelectedCategories: ["technology", "history", "education"],
    });

    await page.goto("/");
    await expect(page.getByText("CONFIGURACIÓN PENDIENTE")).toBeVisible();

    await page.goto("/generate");
    await expect(
      page.getByText(
        "Debes seleccionar al menos un idioma meta de estudio para tu plan antes de generar lecturas.",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "GENERAR Y COMENZAR LECTURA" }),
    ).toBeDisabled();
    expect(
      dollyMock.state.requests.filter(
        (r) => r.method === "POST" && r.path === "/readings",
      ),
    ).toHaveLength(0);
  });

  test("Test 3-B + A2: blocks generation on dolly_plus with 0 languages, allows 1-language study, and keeps 2nd slot free before 365-day lock", async ({
    page,
    context,
    baseURL,
  }) => {
    const plusMock = await attachMockBackend(page, context, baseURL!, {
      initialAuthenticated: true,
      initialUser: {
        email: "dollyplus.user@example.com",
        subscriptionTier: "dolly_plus",
      },
      initialSelectedLanguages: [],
      initialSelectedCategories: [],
    });

    await page.goto("/setup-preferences");
    await page
      .getByRole("button", { name: "Cancelar y explorar después" })
      .click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText("CONFIGURACIÓN PENDIENTE")).toBeVisible();

    await page.goto("/generate");
    await expect(
      page.getByText(/seleccionar al menos un idioma meta de estudio/i),
    ).toBeVisible();
    await expect(
      page.getByRole("radio", { name: /Francés/i }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "GENERAR Y COMENZAR LECTURA" }),
    ).toBeDisabled();

    // User selects ONLY 1 language (Inglés) + 3 categories on dolly_plus -> generation works!
    await page.goto("/setup-preferences");
    await page.getByRole("button", { name: /\[EN\]/i }).click();
    await page.getByRole("button", { name: "Tecnología" }).click();
    await page.getByRole("button", { name: "Historia" }).click();
    await page.getByRole("button", { name: "Educación" }).click();
    await page
      .getByRole("button", { name: /Guardar preferencias y comenzar/i })
      .click();

    await expect(page).toHaveURL(/\/$/);

    await page.goto("/generate");
    const submitBtn = page.getByRole("button", {
      name: "GENERAR Y COMENZAR LECTURA",
    });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    await expect(page).toHaveURL(/\/readings\/\d+$/);
    expect(
      plusMock.state.requests.filter(
        (r) => r.method === "POST" && r.path === "/readings",
      ),
    ).toHaveLength(1);

    // Adding 2nd language on /profile uses free open slot instead of 365-day lock
    await page.goto("/profile");
    await expect(page.getByText("1/2 CUPOS ACTIVOS")).toBeVisible();
    await expect(page.getByText("1 CUPO LIBRE")).toBeVisible();
    await expect(page.getByText("BLOQUEADO ANUAL")).toHaveCount(0);

    await page.getByRole("button", { name: /Francés/i }).click();
    await page.getByRole("button", { name: "Guardar idiomas" }).click();

    await expect(page.getByText("2/2 CUPOS ACTIVOS")).toBeVisible();
    await expect(page.getByText("BLOQUEADO ANUAL")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Italiano/i }),
    ).toBeDisabled();
    expect(plusMock.state.selectedLanguages).toEqual(["en", "fr"]);
  });
});
