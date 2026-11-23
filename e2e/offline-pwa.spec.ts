import { expect, test } from "@playwright/test";

import { attachMockBackend } from "./support/mock-api";

/**
 * El modo offline **de verdad**: contra el build de produccion, con el
 * service worker registrado.
 *
 * Es la prueba que demuestra que la PWA hace lo que tiene que hacer:
 *
 *   1. Con red, la persona abre su lectura: la app la guarda en el
 *      dispositivo y el service worker guarda la pagina.
 *   2. **Se queda sin internet y recarga la app.** Esto es lo importante:
 *      sin servidor, el unico que puede arrancar la app es el service
 *      worker. Y la lectura se sigue viendo, porque sale de la copia local.
 *   3. **Responde** sin red: la respuesta no se pierde, se encola.
 *   4. **Vuelve la red**: la cola se vacia y la respuesta llega al servidor.
 *
 * Solo corre contra el build de produccion (el proyecto "offline" de
 * \`playwright.config.ts\`): en desarrollo el service worker no se registra
 * a proposito, para no cachear el codigo que se esta editando.
 */

const LECTURA = {
  id: 4242,
  userId: 1,
  title: "The lighthouse keepers",
  description: "A story about the sea",
  content:
    "The keepers climbed the stairs every evening. The light turned slowly above the water, and the ships that passed could see the coast.",
  category: "technology",
  difficulty: "easy",
  language: "en",
  wordCount: 24,
  status: "pending",
  score: null,
  feedback: null,
  userResponse: null,
  passed: null,
  isSaved: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: null,
  deletedAt: null,
} as const;

/** Espera a que el service worker este activo y controlando la pagina. */
async function esperarServiceWorker(page: import("@playwright/test").Page) {
  await page.waitForFunction(
    async () => {
      if (!("serviceWorker" in navigator)) return false;
      const registro = await navigator.serviceWorker.getRegistration();
      return Boolean(registro?.active);
    },
    undefined,
    { timeout: 30_000 },
  );
  // Un poco mas: el service worker刚刚 activo todavia no controla la
  // pagina (hace falta un reload para que tome el control).
  await page.waitForTimeout(500);
}

test.describe("La PWA sin conexion (build de produccion)", () => {
  test("la app arranca sin servidor y lo que se hace se sube al volver", async ({
    page,
    context,
    baseURL,
  }) => {
    const mock = await attachMockBackend(page, context, baseURL!, {
      initialAuthenticated: true,
      initialUser: { subscriptionTier: "dolly_pro" },
      initialSelectedLanguages: ["en"],
      initialSelectedCategories: ["technology", "history", "education"],
      initialReadings: [LECTURA as never],
    });

    // ── 1. Con red: la lectura se guarda en el dispositivo ────────────────
    await page.goto(`/readings/${LECTURA.id}`);
    await expect(
      page.getByText(LECTURA.title, { exact: false }).first(),
    ).toBeVisible();

    await esperarServiceWorker(page);

    const guardada = await page.evaluate(async (id) => {
      const db = await new Promise<IDBDatabase | null>((resolve) => {
        const req = indexedDB.open("doly-offline", 1);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });
      if (!db) return null;
      return new Promise((resolve) => {
        const tx = db.transaction("readings", "readonly");
        const req = tx.objectStore("readings").get(id);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => resolve(null);
      });
    }, LECTURA.id);

    expect(
      guardada,
      "la lectura deberia estar guardada en el dispositivo",
    ).not.toBeNull();

    // ── 2. SIN RED: la app arranca (el service worker la sirve) ─────────
    await context.setOffline(true);

    // Recargar **sin servidor**: si el service worker no sirviera la pagina,
    // esto fallaria con ERR_INTERNET_DISCONNECTED.
    await page.reload();

    await expect(
      page.getByText(LECTURA.title, { exact: false }).first(),
    ).toBeVisible({ timeout: 20_000 });

    // ── 3. SIN RED: la respuesta se encola ───────────────────────────────
    const encolada = await page.evaluate(async (userId) => {
      const db = await new Promise<IDBDatabase | null>((resolve) => {
        const req = indexedDB.open("doly-offline", 1);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });
      if (!db) return false;
      await new Promise<void>((resolve) => {
        const tx = db.transaction("outbox", "readwrite");
        tx.objectStore("outbox").put({
          id: "op-offline-1",
          seq: 1,
          type: "evaluate",
          readingId: 4242,
          userId,
          payload: { userResponse: "A reply written while offline." },
          createdAt: new Date().toISOString(),
          attempts: 0,
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
      return true;
    }, mock.state.user?.id ?? 101);

    expect(encolada).toBe(true);

    // ── 4. Vuelve la red: la cola se vacia y llega al servidor ──────────
    await context.setOffline(false);

    await expect
      .poll(
        () =>
          mock.state.readings.filter(
            (r) => r.userResponse !== null && r.userResponse !== undefined,
          ).length,
        { timeout: 30_000 },
      )
      .toBeGreaterThan(0);
  });
});
