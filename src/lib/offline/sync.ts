/**
 * El sincronizador: vacia la cola de operaciones pendientes cuando vuelve
 * la red.
 *
 * Reglas:
 *
 *   - **En orden**: si una operacion falla, se para la cola. Encolar "responder"
 *     y "guardar en el glosario" y subirlos en desorden seria raro.
 *   - **Con la clave de idempotencia**: cada operacion lleva su `id`, que
 *     viaja al servidor como cabecera `idempotency-key`. Si el envio se corta
 *     a mitad, el reintento no duplica la operacion (la IA no evalua dos
 *     veces).
 *   - **Sin prisa**: si no hay red, no se intenta nada.
 */

import {
  listPendingOperations,
  markOperationAttempt,
  removeOperation,
} from "@/lib/offline/store";
import type { OutboxItem } from "@/lib/offline/types";

/** El resultado de un intento de sincronizacion. */
export interface SyncResult {
  /** Cuantas operaciones se{subieron}. */
  synced: number;
  /** Cuantas se quedaron pendientes. */
  pending: number;
  /** El primer error (si lo hubo). */
  error?: string;
}

/** Como se envia cada tipo de operacion. */
type Sender = (item: OutboxItem) => Promise<void>;

/**
 * Vacia la cola.
 *
 * `send` es la funcion que hace la peticion (la inyecta quien llama, para
 * que esta capa no dependa de la API ni de como se autentica).
 */
export async function syncPendingOperations(params: {
  send: Sender;
  userId?: number | string;
}): Promise<SyncResult> {
  const pendientes = await listPendingOperations(params.userId);
  if (pendientes.length === 0) {
    return { synced: 0, pending: 0 };
  }

  let synced = 0;
  let firstError: string | undefined;

  for (const item of pendientes) {
    try {
      await params.send(item);
      await removeOperation(item.id);
      synced += 1;
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      await markOperationAttempt(item, mensaje);
      firstError ??= mensaje;
      // Se para la cola: el orden importa.
      break;
    }
  }

  const restantes = (await listPendingOperations(params.userId)).length;
  return { synced, pending: restantes, error: firstError };
}
