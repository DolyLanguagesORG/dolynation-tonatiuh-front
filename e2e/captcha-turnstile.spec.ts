import { expect, test } from "@playwright/test";

import { attachMockBackend } from "./support/mock-api";

const TURNSTILE_STUB_SCRIPT = `
(() => {
  let seq = 0;
  let resetCount = 0;
  const widgets = new Map();
  window.__turnstileStub = {
    get resetCount() { return resetCount; },
    get renderedActions() {
      return Array.from(widgets.values()).map((w) => w.action);
    },
  };
  window.turnstile = {
    render: (container, opts) => {
      seq += 1;
      const id = 'cf-widget-' + seq;
      widgets.set(id, opts);
      return id;
    },
    execute: (id) => {
      const opts = widgets.get(id);
      if (opts && typeof opts.callback === 'function') {
        setTimeout(() => opts.callback('cf-e2e-token-' + (opts.action || 'default') + '-' + resetCount), 0);
      }
    },
    reset: () => {
      resetCount += 1;
    },
    remove: (id) => {
      widgets.delete(id);
    },
    getResponse: () => undefined,
  };
})();
`;

test.describe("Cloudflare Turnstile invisible anti-bot UI integration", () => {
  test("sends X-Captcha-Token invisibly on /register and /login without breaking editorial layout", async ({
    page,
    context,
    baseURL,
  }) => {
    const backend = await attachMockBackend(page, context, baseURL!, {
      emailVerificationRequired: false,
      captchaConfig: {
        enabled: true,
        provider: "turnstile",
        siteKey: "1x00000000000000000000AA",
        appearance: "interaction-only",
      },
    });

    await page.route(
      "https://challenges.cloudflare.com/turnstile/v0/api.js*",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/javascript; charset=utf-8",
          body: TURNSTILE_STUB_SCRIPT,
        });
      },
    );

    // 1) Registro invisible con Turnstile
    await page.goto("/register");
    await expect(
      page.getByRole("button", { name: "Crear cuenta y comenzar" }),
    ).toBeVisible();

    // El contenedor Turnstile permanece vacío/invisible (height 0) en modo interaction-only
    const registerSlotBox = await page
      .getByTestId("turnstile-slot")
      .boundingBox()
      .catch(() => null);
    expect(registerSlotBox === null || registerSlotBox.height === 0).toBe(true);

    await page.getByLabel(/Nombre/i).first().fill("Ada");
    await page.getByLabel(/Correo electrónico/i).fill("ada.turnstile@example.com");
    await page.getByLabel(/^Contraseña/i).fill("StrongPass123!");
    await page.getByRole("checkbox").check();

    await Promise.all([
      page.waitForURL(/\/select-plan/),
      page.getByRole("button", { name: "Crear cuenta y comenzar" }).click(),
    ]);

    const registerReq = backend.state.requests.find(
      (r) => r.method === "POST" && r.path === "/auth/register",
    );
    expect(registerReq?.captchaToken).toBe("cf-e2e-token-register-0");

    // 2) Login con error primero (verifica reset() automático) y luego éxito
    const rejectedLoginTokens: Array<string | null> = [];
    let failFirstLoginAttempt = true;
    await page.route("**/api/v1/auth/login", async (route) => {
      if (failFirstLoginAttempt && route.request().method() === "POST") {
        failFirstLoginAttempt = false;
        rejectedLoginTokens.push(
          route.request().headers()["x-captcha-token"] ?? null,
        );
        await route.fulfill({
          status: 401,
          contentType: "application/json; charset=utf-8",
          body: JSON.stringify({
            message: "Invalid credentials",
            data: null,
            error: {
              code: "AUTH_INVALID_CREDENTIALS",
              message: "Invalid credentials",
            },
          }),
        });
        return;
      }
      await route.fallback();
    });

    await context.clearCookies();
    await page.goto("/login");
    await expect(
      page.getByRole("button", { name: "Iniciar sesión en DolyNation" }),
    ).toBeVisible();

    await page.getByLabel(/Correo electrónico/i).fill("ada.turnstile@example.com");
    await page.getByLabel(/^Contraseña/i).fill("WrongPassword!");
    await page
      .getByRole("button", { name: "Iniciar sesión en DolyNation" })
      .click();

    await expect(
      page.getByText(/El correo o la contraseña no son correctos/i),
    ).toBeVisible();

    await page.getByLabel(/^Contraseña/i).fill("StrongPass123!");
    await Promise.all([
      page.waitForURL(/\/select-plan/),
      page
        .getByRole("button", { name: "Iniciar sesión en DolyNation" })
        .click(),
    ]);

    const loginSuccessReqs = backend.state.requests.filter(
      (r) => r.method === "POST" && r.path === "/auth/login",
    );
    expect(rejectedLoginTokens).toEqual(["cf-e2e-token-login-0"]);
    expect(loginSuccessReqs).toHaveLength(1);
    expect(loginSuccessReqs[0]?.captchaToken).toBe("cf-e2e-token-login-1");
  });

  test("sends X-Captcha-Token for billing_checkout on /select-plan with Stripe and skips /auth/me polling on focus", async ({
    page,
    context,
    baseURL,
  }) => {
    const backend = await attachMockBackend(page, context, baseURL!, {
      initialAuthenticated: true,
      initialUser: {
        subscriptionTier: null,
        emailVerifiedAt: "2026-11-13T00:00:00.000Z",
      },
      billingProvider: "stripe",
      accessRequestsEnabled: false,
      captchaConfig: {
        enabled: true,
        provider: "turnstile",
        siteKey: "1x00000000000000000000AA",
        appearance: "interaction-only",
      },
    });

    await page.route(
      "https://challenges.cloudflare.com/turnstile/v0/api.js*",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/javascript; charset=utf-8",
          body: TURNSTILE_STUB_SCRIPT,
        });
      },
    );

    await page.goto("/select-plan");
    const continueButton = page.getByRole("button", {
      name: /Confirmar plan y configurar preferencias/i,
    });
    await expect(continueButton).toBeVisible();

    const meCallsBeforeFocus = backend.state.requests.filter(
      (r) => r.method === "GET" && r.path === "/auth/me",
    ).length;

    await page.evaluate(() => {
      window.dispatchEvent(new Event("focus"));
    });
    await page.waitForTimeout(150);

    const meCallsAfterFocus = backend.state.requests.filter(
      (r) => r.method === "GET" && r.path === "/auth/me",
    ).length;
    expect(meCallsAfterFocus).toBe(meCallsBeforeFocus);

    await continueButton.click();

    await expect
      .poll(() =>
        backend.state.requests.find(
          (r) =>
            r.method === "POST" && r.path === "/billing/checkout/subscription",
        ),
      )
      .toMatchObject({
        method: "POST",
        path: "/billing/checkout/subscription",
        captchaToken: "cf-e2e-token-billing_checkout-0",
      });
  });

  test("skips /auth/me and /access-requests/me on focus/visibilitychange in /select-plan and inside Stripe Checkout modal when accessRequestsEnabled=true and Stripe is active", async ({
    page,
    context,
    baseURL,
  }) => {
    await page.addInitScript(() => {
      let clockOffsetMs = 0;
      const nativeNow = Date.now.bind(Date);
      Date.now = () => nativeNow() + clockOffsetMs;
      (
        window as unknown as { __advanceClockMs: (ms: number) => void }
      ).__advanceClockMs = (ms: number) => {
        clockOffsetMs += ms;
      };
    });

    const backend = await attachMockBackend(page, context, baseURL!, {
      initialAuthenticated: true,
      initialUser: {
        subscriptionTier: null,
        emailVerifiedAt: "2026-11-13T00:00:00.000Z",
      },
      billingProvider: "stripe",
      accessRequestsEnabled: true,
      captchaConfig: {
        enabled: false,
      },
    });

    await page.goto("/select-plan");
    const continueButton = page.getByRole("button", {
      name: /Confirmar plan y configurar preferencias/i,
    });
    await expect(continueButton).toBeVisible();

    const meCountAfterLoad = backend.state.requests.filter(
      (r) => r.method === "GET" && r.path === "/auth/me",
    ).length;
    const reqsCountAfterLoad = backend.state.requests.filter(
      (r) => r.method === "GET" && r.path === "/access-requests/me",
    ).length;

    // Primer evento focus/visibilitychange sobre /select-plan (> 5s desde epoch 0).
    await page.evaluate(() => {
      window.dispatchEvent(new Event("focus"));
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(150);

    expect(
      backend.state.requests.filter(
        (r) => r.method === "GET" && r.path === "/auth/me",
      ).length,
    ).toBe(meCountAfterLoad);
    expect(
      backend.state.requests.filter(
        (r) => r.method === "GET" && r.path === "/access-requests/me",
      ).length,
    ).toBe(reqsCountAfterLoad);

    // Abre el modal de Stripe Checkout y simula salir/volver del iframe pasados > 5s.
    await continueButton.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.evaluate(() => {
      (
        window as unknown as { __advanceClockMs: (ms: number) => void }
      ).__advanceClockMs(6_000);
      window.dispatchEvent(new Event("focus"));
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(150);

    expect(
      backend.state.requests.filter(
        (r) => r.method === "GET" && r.path === "/auth/me",
      ).length,
    ).toBe(meCountAfterLoad);
    expect(
      backend.state.requests.filter(
        (r) => r.method === "GET" && r.path === "/access-requests/me",
      ).length,
    ).toBe(reqsCountAfterLoad);
  });
});
