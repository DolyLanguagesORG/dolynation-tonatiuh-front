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
});
