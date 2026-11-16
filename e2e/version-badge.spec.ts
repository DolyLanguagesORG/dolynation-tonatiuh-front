import { expect, test } from "@playwright/test";

import { attachMockBackend } from "./support/mock-api";

/**
 * El badge de versión sirve para que un usuario pueda reportar un bug
 * diciendo qué build usó.
 *
 * Este test existe porque el badge **fallaba en silencio**: pedía
 * `/version.json`, que es un archivo estático que genera el *build*
 * (`scripts/generate-version-json.mjs`). En desarrollo ese archivo no existe,
 * así que la petición daba 404 y el badge no se mostraba: nadie se enteró
 * hasta mirar la consola del navegador.
 *
 * Ahora usa la ruta `/version`, que siempre responde.
 */
test.describe("Badge de versión", () => {
  test("muestra la versión y no deja peticiones fallidas", async ({
    page,
    context,
    baseURL,
  }) => {
    // El badge vive en el pie de pagina: hay que estar en una pagina con el
    // shell (no en /login, que lo oculta).
    await attachMockBackend(page, context, baseURL!, {
      initialAuthenticated: true,
      initialUser: {
        email: "badge@example.com",
        emailVerifiedAt: "2026-11-16T00:00:00.000Z",
        subscriptionTier: "dolly_pro",
      },
      initialSelectedLanguages: ["en"],
      initialSelectedCategories: [
        "Historia de Mexico",
        "Ciencia",
        "Tecnologia",
      ],
    });

    // Solo se miran las peticiones de la version: el resto de la pagina la
    // resuelve el mock de la suite (que no cubre todos los endpoints).
    const fallos: string[] = [];
    page.on("response", (res) => {
      if (res.status() >= 400 && res.url().includes("/version")) {
        fallos.push(`${res.status()} ${res.url()}`);
      }
    });

    await page.goto("/profile");

    // La ruta `/version` responde 200 y trae la version.
    const version = await page.request.get("/version");
    expect(version.status()).toBe(200);
    const body = (await version.json()) as { appVersion?: string };
    expect(body.appVersion).toBeTruthy();

    // El badge se muestra con el numero de version.
    const badge = page.getByTestId("version-badge");
    await expect(badge).toBeVisible();
    await expect(badge).toContainText(`v${body.appVersion}`);

    // Y no hay ninguna peticion fallida en la pagina.
    expect(
      fallos,
      `peticiones de version fallidas: ${fallos.join(", ")}`,
    ).toEqual([]);
  });

  test("el endpoint /version responde siempre, sin build previo", async ({
    request,
  }) => {
    const res = await request.get("/version");
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { component?: string };
    expect(body.component).toBe("dolynation-tonatiuh-front");
  });
});
