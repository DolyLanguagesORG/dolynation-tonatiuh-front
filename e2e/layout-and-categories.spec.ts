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

  test("responsive shell separates mobile/desktop sidebar toggles and exposes profile & logout in mobile drawer and header", async ({
    page,
    context,
    baseURL,
  }) => {
    await attachMockBackend(page, context, baseURL!, {
      initialAuthenticated: true,
      initialUser: {
        email: "sebastianrdzc04@gmail.com",
        fullName: "sebastian rodriguez",
        subscriptionTier: "dolly_pro",
        currentStreak: 1,
      },
      initialSelectedLanguages: ["en"],
      initialSelectedCategories: ["technology", "history", "education"],
    });

    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/");

    const mobileToggle = page.getByRole("button", { name: /Abrir menú/i });
    const desktopToggle = page.locator(
      'button[aria-controls="doly-sidebar-desktop"]',
    );
    const userMenuBtn = page.getByRole("button", {
      name: /Menú de cuenta de sebastian rodriguez/i,
    });

    await expect(mobileToggle).toBeVisible();
    await expect(mobileToggle).toHaveClass(/\blg:hidden\b/);
    await expect(desktopToggle).toHaveCount(1);
    await expect(desktopToggle).toHaveClass(/\bhidden\b/);
    await expect(desktopToggle).toHaveClass(/\blg:inline-flex\b/);
    await expect(userMenuBtn).toBeVisible();

    // Open user menu on phone and confirm profile + logout actions
    await userMenuBtn.click();
    await expect(
      page.getByRole("menuitem", { name: /Perfil y Progreso/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: /Cerrar sesión/i }),
    ).toBeVisible();
    await page.keyboard.press("Escape");

    // Open mobile drawer and verify full-height drawer header, close button, user card & sign out
    await mobileToggle.click();
    const drawer = page.locator("#doly-sidebar-drawer");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText("DolyNation")).toBeVisible();
    await expect(drawer.getByText("sebastian rodriguez")).toBeVisible();
    await expect(drawer.getByText("sebastianrdzc04@gmail.com")).toBeVisible();
    await expect(
      drawer.getByRole("link", { name: /Perfil y Progreso/i }),
    ).toBeVisible();
    await expect(
      drawer.getByRole("button", { name: /Cerrar sesión/i }),
    ).toBeVisible();

    await drawer.getByRole("button", { name: /Cerrar menú/i }).click();
    await expect(drawer).toHaveCount(0);
  });
});
