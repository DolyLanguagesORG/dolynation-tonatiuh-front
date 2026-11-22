/**
 * @jest-environment node
 *
 * El entorno de node (y no el de jsdom) a proposito: `fake-indexeddb`
 * necesita `structuredClone`, que el sandbox de jsdom no expone. El modulo
 * busca `indexedDB` en el ambito global, asi que funciona igual en los dos.
 */
import "fake-indexeddb/auto";

import type { ReadingDto } from "@/lib/api-contracts";
import {
  clearAllOfflineData,
  clearOfflineData,
  createOperationId,
  enqueueOperation,
  getOfflineReading,
  listOfflineReadings,
  listPendingOperations,
  removeOperation,
  saveOfflineReading,
} from "@/lib/offline/store";
import { syncPendingOperations } from "@/lib/offline/sync";
import type { OutboxItem } from "@/lib/offline/types";

function lectura(id: number, title = `Lectura ${id}`): ReadingDto {
  return {
    id,
    userId: 7,
    title,
    description: "",
    content: "El texto de la historia",
    category: null,
    difficulty: null,
    language: "en",
    wordCount: 10,
    status: "pending",
    score: null,
    feedback: null,
    userResponse: null,
    passed: null,
  } as ReadingDto;
}

describe("la capa de datos local", () => {
  beforeEach(async () => {
    await clearAllOfflineData();
  });

  describe("las lecturas guardadas", () => {
    it("guarda una lectura y la devuelve", async () => {
      await saveOfflineReading({ reading: lectura(1), userId: 7 });

      const guardada = await getOfflineReading(1, 7);

      expect(guardada).not.toBeNull();
      expect(guardada?.reading.title).toBe("Lectura 1");
      expect(guardada?.savedAt).toEqual(expect.any(String));
    });

    it("NO devuelve la lectura de otra persona", async () => {
      await saveOfflineReading({ reading: lectura(1), userId: 7 });

      // El filtro por usuario es lo que impide que, en un portatil
      // compartido, una persona vea lo que dejo la anterior.
      expect(await getOfflineReading(1, 99)).toBeNull();
    });

    it("devuelve null si no hay copia local", async () => {
      expect(await getOfflineReading(404, 7)).toBeNull();
    });

    it("lista solo las lecturas de esa persona", async () => {
      await saveOfflineReading({ reading: lectura(1), userId: 7 });
      await saveOfflineReading({ reading: lectura(2), userId: 7 });
      await saveOfflineReading({ reading: lectura(3), userId: 99 });

      const propias = await listOfflineReadings(7);

      expect(propias).toHaveLength(2);
      expect(propias.map((r) => r.id).sort()).toEqual([1, 2]);
    });

    it("al cerrar sesion se borra lo de esa persona y no lo de la otra", async () => {
      await saveOfflineReading({ reading: lectura(1), userId: 7 });
      await saveOfflineReading({ reading: lectura(2), userId: 99 });

      await clearOfflineData(7);

      expect(await getOfflineReading(1, 7)).toBeNull();
      expect(await getOfflineReading(2, 99)).not.toBeNull();
    });
  });

  describe("la cola de operaciones", () => {
    it("encola una operacion con su id", async () => {
      const item = await enqueueOperation({
        type: "evaluate",
        readingId: 1,
        userId: 7,
        payload: { userResponse: "mi respuesta" },
      });

      expect(item.id).toEqual(expect.any(String));
      expect(item.attempts).toBe(0);

      const pendientes = await listPendingOperations(7);
      expect(pendientes).toHaveLength(1);
      expect(pendientes[0].payload.userResponse).toBe("mi respuesta");
    });

    it("los ids de operacion son distintos", () => {
      expect(createOperationId()).not.toBe(createOperationId());
    });

    it("al cerrarsesion se borra la cola de esa persona", async () => {
      await enqueueOperation({
        type: "evaluate",
        readingId: 1,
        userId: 7,
        payload: {},
      });
      await enqueueOperation({
        type: "evaluate",
        readingId: 2,
        userId: 99,
        payload: {},
      });

      await clearOfflineData(7);

      expect(await listPendingOperations(7)).toHaveLength(0);
      expect(await listPendingOperations(99)).toHaveLength(1);
    });

    it("se puede quitar una operacion de la cola", async () => {
      const item = await enqueueOperation({
        type: "evaluate",
        readingId: 1,
        userId: 7,
        payload: {},
      });

      await removeOperation(item.id);

      expect(await listPendingOperations(7)).toHaveLength(0);
    });
  });

  describe("el sincronizador", () => {
    it("vacia la cola cuando todo va bien", async () => {
      await enqueueOperation({ type: "evaluate", readingId: 1, userId: 7, payload: {} });
      await enqueueOperation({ type: "evaluate", readingId: 2, userId: 7, payload: {} });

      const enviados: string[] = [];
      const resultado = await syncPendingOperations({
        userId: 7,
        send: async (item: OutboxItem) => {
          enviados.push(item.id);
        },
      });

      expect(resultado.synced).toBe(2);
      expect(resultado.pending).toBe(0);
      expect(enviados).toHaveLength(2);
      expect(await listPendingOperations(7)).toHaveLength(0);
    });

    it("se para en el primer fallo (el orden importa) y deja el resto en cola", async () => {
      await enqueueOperation({ type: "evaluate", readingId: 1, userId: 7, payload: {} });
      await enqueueOperation({ type: "evaluate", readingId: 2, userId: 7, payload: {} });
      await enqueueOperation({ type: "evaluate", readingId: 3, userId: 7, payload: {} });

      const enviados: number[] = [];
      const resultado = await syncPendingOperations({
        userId: 7,
        send: async (item: OutboxItem) => {
          enviados.push(item.readingId);
          if (item.readingId === 1) {
            throw new Error("sin red");
          }
        },
      });

      // Solo se intenta la primera: si esa falla, la cola espera.
      expect(enviados).toEqual([1]);
      expect(resultado.synced).toBe(0);
      expect(resultado.pending).toBe(3);
      expect(resultado.error).toContain("sin red");
    });

    it("manda la clave de idempotencia (el id de la operacion)", async () => {
      const item = await enqueueOperation({
        type: "evaluate",
        readingId: 1,
        userId: 7,
        payload: {},
      });

      const cabeceras: Record<string, string> = {};
      await syncPendingOperations({
        userId: 7,
        send: async (op: OutboxItem) => {
          cabeceras["idempotency-key"] = op.id;
        },
      });

      expect(cabeceras["idempotency-key"]).toBe(item.id);
    });

    it("no hace nada si no hay cola", async () => {
      const resultado = await syncPendingOperations({
        userId: 7,
        send: async () => {
          throw new Error("no deberia llamarse");
        },
      });

      expect(resultado.synced).toBe(0);
      expect(resultado.pending).toBe(0);
    });
  });
});
