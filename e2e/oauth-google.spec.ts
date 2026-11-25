import { expect, test } from "@playwright/test";

import { attachMockBackend } from "./support/mock-api";

const ENABLED_OAUTH_PROVIDERS = [
  {
    provider: "google" as const,
    enabled: true,
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    clientId: "e2e-google-client.apps.googleusercontent.com",
    redirectUri: "http://127.0.0.1:3100/api/auth/oauth/google/callback",
    scopes: ["openid", "email", "profile"],
  },
  {
    provider: "microsoft" as const,
    enabled: true,
    authorizationEndpoint:
      "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    clientId: "e2e-ms-client-id",
    redirectUri: "http://127.0.0.1:3100/api/auth/oauth/microsoft/callback",
    scopes: ["openid", "email", "profile"],
  },
];

test.describe("External OAuth UI & BFF navigation flows", () => {
  test("hides Google and Microsoft OAuth buttons on /login and /register when disabled", async ({
    page,
    context,
    baseURL,
  }) => {
    await attachMockBackend(page, context, baseURL!, {
      oauthProviders: [
        { provider: "google", enabled: false },
        { provider: "microsoft", enabled: false },
      ],
    });

    const waitProvidersLogin = page.waitForResponse(
      (res) =>
        res.url().includes("/api/v1/auth/oauth/providers") &&
        res.status() === 200,
    );
    await page.goto("/login");
    await waitProvidersLogin;
    await expect(
      page.getByRole("button", { name: "Iniciar sesión en DolyNation" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Google/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Microsoft/i })).toHaveCount(
      0,
    );

    const waitProvidersRegister = page.waitForResponse(
      (res) =>
        res.url().includes("/api/v1/auth/oauth/providers") &&
        res.status() === 200,
    );
    await page.goto("/register");
    await waitProvidersRegister;
    await expect(
      page.getByRole("button", { name: "Crear cuenta y comenzar" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Google/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Microsoft/i })).toHaveCount(
      0,
    );
  });

  test("renders Google and Microsoft OAuth buttons when enabled and navigates with origin, redirect, and locale", async ({
    page,
    context,
    baseURL,
  }) => {
    await attachMockBackend(page, context, baseURL!, {
      oauthProviders: ENABLED_OAUTH_PROVIDERS,
    });

    let capturedLoginOAuthUrl: string | null = null;
    await page.route("**/api/auth/oauth/google**", async (route) => {
      capturedLoginOAuthUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<html><body><h1>OAuth Redirect Intercepted</h1></body></html>",
      });
    });

    let capturedLoginMsUrl: string | null = null;
    await page.route("**/api/auth/oauth/microsoft**", async (route) => {
      capturedLoginMsUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<html><body><h1>Microsoft OAuth Redirect Intercepted</h1></body></html>",
      });
    });

    await page.goto("/login?redirect=%2Fhistory");
    const loginGoogleBtn = page.getByRole("button", {
      name: "Continuar con cuenta de Google",
    });
    const loginMsBtn = page.getByRole("button", {
      name: "Continuar con cuenta de Microsoft",
    });
    await expect(loginGoogleBtn).toBeVisible();
    await expect(loginMsBtn).toBeVisible();

    await Promise.all([
      page.waitForURL(/\/api\/auth\/oauth\/google/),
      loginGoogleBtn.click(),
    ]);

    expect(capturedLoginOAuthUrl).toBeTruthy();
    const loginParsed = new URL(capturedLoginOAuthUrl!);
    expect(loginParsed.searchParams.get("origin")).toBe("login");
    expect(loginParsed.searchParams.get("redirect")).toBe("/history");
    expect(loginParsed.searchParams.get("locale")).toBe("es");

    await page.goto("/login?redirect=%2Fhistory");
    await Promise.all([
      page.waitForURL(/\/api\/auth\/oauth\/microsoft/),
      page
        .getByRole("button", { name: "Continuar con cuenta de Microsoft" })
        .click(),
    ]);
    expect(capturedLoginMsUrl).toBeTruthy();
    const msLoginParsed = new URL(capturedLoginMsUrl!);
    expect(msLoginParsed.searchParams.get("origin")).toBe("login");
    expect(msLoginParsed.searchParams.get("redirect")).toBe("/history");
    expect(msLoginParsed.searchParams.get("locale")).toBe("es");

    let capturedRegisterOAuthUrl: string | null = null;
    await page.unroute("**/api/auth/oauth/google**");
    await page.route("**/api/auth/oauth/google**", async (route) => {
      capturedRegisterOAuthUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<html><body><h1>OAuth Register Intercepted</h1></body></html>",
      });
    });

    await page.goto("/register");
    const registerGoogleBtn = page.getByRole("button", {
      name: "Registrarse con cuenta de Google",
    });
    const registerMsBtn = page.getByRole("button", {
      name: "Registrarse con cuenta de Microsoft",
    });
    await expect(registerGoogleBtn).toBeVisible();
    await expect(registerMsBtn).toBeVisible();

    await Promise.all([
      page.waitForURL(/\/api\/auth\/oauth\/google/),
      registerGoogleBtn.click(),
    ]);

    expect(capturedRegisterOAuthUrl).toBeTruthy();
    const registerParsed = new URL(capturedRegisterOAuthUrl!);
    expect(registerParsed.searchParams.get("origin")).toBe("register");
    expect(registerParsed.searchParams.get("locale")).toBe("es");
  });

  test("renders localized error banners for oauthError query params on /login and /register", async ({
    page,
    context,
    baseURL,
  }) => {
    await attachMockBackend(page, context, baseURL!, {
      oauthProviders: ENABLED_OAUTH_PROVIDERS,
    });

    await page.goto("/login?oauthError=AUTH_OAUTH_ADMIN_FORBIDDEN");
    await expect(
      page.getByText(
        /cuentas de administrador deben iniciar sesión con correo/i,
      ),
    ).toBeVisible();

    await page.goto("/register?oauthError=AUTH_OAUTH_CANCELLED");
    await expect(
      page.getByText(
        /Cancelaste el inicio de sesión con el proveedor externo/i,
      ),
    ).toBeVisible();
  });

  test("replaces history on Microsoft OAuth start, blocks Back from triggering AADSTS900561 on /select-plan, and allows controlled account switching", async ({
    page,
    context,
    baseURL,
  }) => {
    const mock = await attachMockBackend(page, context, baseURL!, {
      emailVerificationRequired: true,
      oauthProviders: ENABLED_OAUTH_PROVIDERS,
    });

    let entraGetRequests = 0;

    await page.route("**/api/auth/oauth/microsoft**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: `<!doctype html><html><body>
          <h1>Mock Microsoft Sign-In</h1>
          <form method="POST" action="https://login.microsoftonline.com/common/login">
            <button type="submit">Completar Microsoft</button>
          </form>
        </body></html>`,
      });
    });

    await page.route(
      "https://login.microsoftonline.com/common/login",
      async (route) => {
        if (route.request().method() === "GET") {
          entraGetRequests += 1;
          await route.fulfill({
            status: 400,
            contentType: "text/html; charset=utf-8",
            body: "<h1>AADSTS900561: The endpoint only accepts POST requests. Received a GET request.</h1>",
          });
          return;
        }

        // Simula el POST exitoso en Entra ID que autentica al usuario sin plan y navega al callback -> /select-plan?oauth=microsoft.
        mock.state.user = {
          id: 99,
          email: "ms.oauth@example.com",
          fullName: "Microsoft Student",
          role: "student",
          subscriptionTier: null,
          currentStreak: 0,
          lastStreakDate: null,
          emailVerifiedAt: "2026-11-24T00:00:00.000Z",
          locale: "es",
          createdAt: "2026-11-24T00:00:00.000Z",
        };
        await mock.setSessionCookie(true);

        const callbackTarget = JSON.stringify(
          `${baseURL!}/select-plan?oauth=microsoft`,
        );
        await route.fulfill({
          status: 200,
          contentType: "text/html; charset=utf-8",
          body: `<!doctype html><html><body>
            <p>Completing sign-in...</p>
            <script>window.location.href = ${callbackTarget};</script>
          </body></html>`,
        });
      },
    );

    await page.goto("/login");
    const historyLengthOnLogin = await page.evaluate(
      () => window.history.length,
    );

    await Promise.all([
      page.waitForURL(/\/api\/auth\/oauth\/microsoft/),
      page
        .getByRole("button", { name: "Continuar con cuenta de Microsoft" })
        .click(),
    ]);

    // location.replace reemplaza /login en lugar de apilar una entrada extra.
    const historyLengthAfterOAuthStart = await page.evaluate(
      () => window.history.length,
    );
    expect(historyLengthAfterOAuthStart).toBe(historyLengthOnLogin);

    await page.getByRole("button", { name: "Completar Microsoft" }).click();

    // Tras completar el flujo OAuth, /select-plan limpia ?oauth=microsoft y arma el guard.
    await expect(page).toHaveURL(/\/select-plan$/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: "Selecciona tu Plan de Suscripción" }),
    ).toBeVisible();

    // Presionar "Atrás" NO debe enviar GET a login.microsoftonline.com ni disparar AADSTS900561.
    await page.goBack();
    await expect(page).toHaveURL(/\/select-plan$/);
    expect(entraGetRequests).toBe(0);
    await expect(page.getByText("Sesión iniciada")).toBeVisible();
    await expect(
      page.getByText(/utiliza el botón «Cambiar de cuenta»/i),
    ).toBeVisible();

    // Interactuar con la página y volver a presionar "Atrás" mantiene la protección (re-armado).
    await page
      .locator("button, [role='button'], [role='radio']")
      .filter({ hasText: "Dolly Plus" })
      .first()
      .click();
    await page.goBack();
    await expect(page).toHaveURL(/\/select-plan$/);
    expect(entraGetRequests).toBe(0);

    // El botón visible "Cambiar de cuenta" cierra sesión y vuelve de forma controlada a /login.
    await page.getByRole("button", { name: "Cambiar de cuenta" }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    expect(
      mock.state.requests.some(
        (r) => r.method === "POST" && r.path === "/auth/logout",
      ),
    ).toBe(true);
    const remainingMarker = await page.evaluate(() =>
      window.sessionStorage.getItem("doly.select_plan_oauth_guard"),
    );
    expect(remainingMarker).toBeNull();
  });
});
