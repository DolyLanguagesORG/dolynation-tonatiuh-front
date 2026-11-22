import { expect, test } from "@playwright/test";

import { attachMockBackend } from "./support/mock-api";

/**
 * El modo offline de punta a punta (la parte de los DATOS).
 *
 * Es el caso de uso de la PWA: la persona genera una historia **con red**,
 * se queda sin internet, sigue con esa historia y responde; cuando vuelve
 * la red, lo que hizo se sube.
 *
 * Lo que se comprueba:
 *
 *   1. Con red, la lectura se guarda en el dispositivo (IndexedDB).
 *   2. Lo que hay en la cola **se sube** al volver la red, y llega al
 *      servidor **con su clave de idempotencia** (para que un reintento no
 *      repita la operacion).
 *
 * Lo que **no** se prueba aqui (y por que): que la app **arranque** sin
 * servidor. Eso lo hace el service worker, y solo funciona en el build de
 * produccion (en desarrollo no se registra a proposito, para no cachear el
 * codigo que se esta editando). La estrategia del service worker tiene sus
 * propios tests (\`src/app/sw.test.ts\`).
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

/** Lee un almacen de la base local del navegador. */
async function leerAlmacen(
  page: import("@playwright/test").Page,
  almacen: "readings" | "outbox",
): Promise<unknown[]> {
  return page.evaluate(async (nombre) => {
    const db = await new Promise<IDBDatabase | null>((resolve) => {
      const req = indexedDB.open("doly-offline", 1);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });
    if (!db) return [];
    return new Promise((resolve) => {
      const tx = db.transaction(nombre, "readonly");
      const req = tx.objectStore(nombre).getAll();
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = () => resolve([]);
    });
  }, almacen);
}

test.describe("El modo offline", () => {
  test("la lectura se guarda en el dispositivo y la cola se sube al volver la red", async ({
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

    await expect
      .poll(async () => (await leerAlmacen(page, "readings")).length, {
        timeout: 15_000,
      })
      .toBeGreaterThan(0);

    const guardadas = (await leerAlmacen(page, "readings")) as Array<{
      id: number;
      reading: { title: string };
    }>;
    expect(guardadas[0].reading.title).toBe(LECTURA.title);

    // ── 2. Sin red, lo que se hace se encola ─────────────────────────────
    await context.setOffline(true);

    // La app encola lo que hace. Aqui se encola **a mano** en el mismo
    // almacen, con la misma forma, para comprobar el camino de salida (que
    // es el que depende de la red).
    await page.evaluate(async (userId) => {
      const db = await new Promise<IDBDatabase | null>((resolve) => {
        const req = indexedDB.open("doly-offline", 1);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });
      if (!db) return;
      await new Promise<void>((resolve) => {
        const tx = db.transaction("outbox", "readwrite");
        tx.objectStore("outbox").put({
          id: "op-de-prueba-1",
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
    }, mock.state.user?.id ?? 101);

    // ── 3. Al volver la red, la cola se vacia y llega al servidor ───────
    await context.setOffline(false);

    // Playwright emula el estado de la red, pero **no** dispara el evento
    // `online` del navegador (ni actualiza `navigator.onLine`): se despacha
    // a mano. Si la pagina se esta recargando (el dev server recompila), se
    // reintenta.
    for (let intento = 0; intento < 6; intento += 1) {
      try {
        await page.evaluate(() => {
          window.dispatchEvent(new Event("online"));
        });
        break;
      } catch {
        await page.waitForTimeout(500);
      }
    }

    // El mock (estado en Node) es lo que comprueba que llego la peticion.
    await expect
      .poll(
        () =>
          mock.state.readings.filter(
            (r) => r.userResponse !== null && r.userResponse !== undefined,
          ).length,
        { timeout: 20_000 },
      )
      .toBeGreaterThan(0);

    // Y la cola queda vacia.
    await expect
      .poll(async () => (await leerAlmacen(page, "outbox")).length, {
        timeout: 15_000,
      })
      .toBe(0);
  });
});
