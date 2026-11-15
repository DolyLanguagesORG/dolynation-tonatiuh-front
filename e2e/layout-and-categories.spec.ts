import { expect, test } from "@playwright/test";

import { attachMockBackend } from "./support/mock-api";

test.describe("Auth layout, responsive onboarding, streak & configured categories", () => {
  test("login and register hide the global top navbar", async ({
    page,
    context,
    baseURL,
  }) => {
    await attachMockBackend(page, context, baseURL!, {});

    for (const route of ["/login", "/register"]) {
      await page.goto(route);
      await expect(page.locator("header")).toHaveCount(0);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });

  test("select-plan lays plans out in a responsive grid (1 col mobile, 3 cols desktop)", async ({
    page,
    context,
    baseURL,
  }) => {
    await attachMockBackend(page, context, baseURL!, {
      emailVerificationRequired: true,
      initialAuthenticated: true,
      initialUser: {
        email: "verified.noplan@example.com",
        emailVerifiedAt: "2026-11-13T00:00:00.000Z",
        subscriptionTier: null,
      },
    });

    await page.goto("/select-plan");
    await expect(page.getByRole("radio")).toHaveCount(3);

    // El servidor webpack de Playwright no procesa Tailwind (usa @tailwindcss/turbopack),
    // por lo que se valida el contrato de clases responsive en lugar de las coordenadas.
    const group = page.getByRole("radiogroup").first();
    await expect(group).toHaveClass(/\bgrid-cols-1\b/);
    await expect(group).toHaveClass(/\bmd:grid-cols-3\b/);
  });

  test("/generate lists only the categories configured on the account", async ({
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
    const group = page.getByRole("radiogroup", { name: /DOMINIO TEMÁTICO/i });
    await expect(group.getByRole("radio")).toHaveCount(3);
    await expect(group.getByRole("radio", { name: "Programación" })).toHaveCount(
      0,
    );
    await expect(group.getByRole("radio", { name: "Cultura Pop" })).toHaveCount(
      0,
    );
  });

  test("a new account shows a 0-day streak on the dashboard", async ({
    page,
    context,
    baseURL,
  }) => {
    await attachMockBackend(page, context, baseURL!, {
      initialAuthenticated: true,
      initialUser: { subscriptionTier: "dolly", currentStreak: 0 },
      initialSelectedLanguages: ["en"],
      initialSelectedCategories: ["technology", "history", "education"],
    });

    await page.goto("/");
    await expect(page.getByText("RACHA DE CONSISTENCIA")).toBeVisible();
    await expect(page.getByText("7 días consecutivos")).toHaveCount(0);
    await expect(page.getByText("Racha: 0 días")).toBeVisible();
  });
});
