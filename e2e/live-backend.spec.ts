import { expect, test } from "@playwright/test";

const IS_LIVE = process.env.E2E_TARGET === "backend";

test.describe("Live Backend Smoke Suite (E2E_TARGET=backend)", () => {
  test.skip(
    !IS_LIVE,
    "Skipped unless E2E_TARGET=backend is set against a running API server.",
  );

  test("renders login and rejects invalid credentials against real backend BFF", async ({
    page,
  }) => {
    await page.goto("/login");
    await page
      .getByLabel(/Correo electrónico/i)
      .fill("nonexistent.e2e@example.com");
    await page.locator("#login-password").fill("WrongPass123!");
    await page
      .getByRole("button", { name: "Iniciar sesión en DolyNation" })
      .click();

    // El codigo vive en el badge del banner de error (`role="alert"`). Un locator
    // laxo sobre la palabra "credenciales" tambien matchea el subtitulo del
    // formulario y el boton en estado de carga, y Playwright falla en modo estricto.
    await expect(
      page.getByRole("alert").getByText("AUTH_INVALID_CREDENTIALS", { exact: true }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("unauthenticated navigation to /generate redirects to /login with live BFF", async ({
    page,
  }) => {
    await page.goto("/generate");
    await expect(page).toHaveURL(/\/login/);
  });
});
