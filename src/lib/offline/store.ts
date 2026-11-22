import type { ReadingDto } from "@/lib/api-contracts";
import {
  STORE_OUTBOX,
  STORE_READINGS,
  clearStore,
  closeDatabase,
  get,
  getAll,
  put,
  remove,
} from "@/lib/offline/db";
import type { OfflineReading, OutboxItem, OutboxOperationType } from "@/lib/offline/types";

/**
 * La capa de datos local: **guardar** lo que la persona lee y **encolar** lo
 * que hace sin conexion.
 *
 * El reparto es deliberado:
 *
 *   - Lo que se **lee** (el texto de la historia) se guarda en `readings`.
 *   - Lo que se **hace** (responder, guardar una palabra) se encola en
 *     `outbox` y se sube cuando vuelve la red.
 *
 * Los datos **no** van a la caché HTTP: ahí se cachearían las respuestas
 * del servidor de otra persona. Aquí son de cada quien.
 */

/** Guarda una lectura en el dispositivo (para poder leerla sin red). */
export async function saveOfflineReading(params: {
  reading: ReadingDto;
  explanations?: OfflineReading["explanations"];
  userId: number | string;
}): Promise<boolean> {
  const registro: OfflineReading = {
    id: params.reading.id,
    userId: params.userId,
    reading: params.reading,
    explanations: params.explanations ?? [],
    savedAt: new Date().toISOString(),
  };
  return put(STORE_READINGS, registro);
}

/** Lee una lectura guardada. `null` si no esta o no es de ese usuario. */
export async function getOfflineReading(
  readingId: number,
  userId: number | string,
): Promise<OfflineReading | null> {
  const registro = await get<OfflineReading>(STORE_READINGS, readingId);
  if (!registro) return null;
  // El filtro por usuario es lo que impide que una persona vea lo que otra
  // dejo en el mismo dispositivo.
  if (String(registro.userId) !== String(userId)) return null;
  return registro;
}

/** Todas las lecturas guardadas de una persona. */
export async function listOfflineReadings(
  userId: number | string,
): Promise<OfflineReading[]> {
  const todas = await getAll<OfflineReading>(STORE_READINGS);
  return todas.filter((r) => String(r.userId) === String(userId));
}

/**
 * Encola una operacion para subirla cuando vuelva la red.
 *
 * El `id` se genera aqui y **viaja al servidor** como clave de idempotencia:
 * si el envio se corta, al reintentar el servidor ve que ya la recibio.
 */
export async function enqueueOperation(params: {
  type: OutboxOperationType;
  readingId: number;
  userId: number | string;
  payload: Record<string, unknown>;
  /** El id de la operacion (para poder reencolar la misma). */
  id?: string;
}): Promise<OutboxItem> {
  // El numero de orden sale del ultimo de la cola: dos operaciones
  // encoladas en el mismo milisegundo tienen que quedar en orden
  // (primero la respuesta, despues el glosario).
  const existentes = await getAll<OutboxItem>(STORE_OUTBOX);
  const seq = existentes.reduce((max, i) => Math.max(max, i.seq ?? 0), 0) + 1;

  const item: OutboxItem = {
    id: params.id ?? createOperationId(),
    seq,
    type: params.type,
    readingId: params.readingId,
    userId: params.userId,
    payload: params.payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  await put(STORE_OUTBOX, item);
  return item;
}

/** Las operaciones pendientes, **en orden** (las primeras son las viejas). */
export async function listPendingOperations(
  userId?: number | string,
): Promise<OutboxItem[]> {
  const todas = await getAll<OutboxItem>(STORE_OUTBOX);
  const propias = userId === undefined
    ? todas
    : todas.filter((i) => String(i.userId) === String(userId));
  return propias.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
}

/** Marca un intento fallido (con su error). */
export async function markOperationAttempt(
  item: OutboxItem,
  error: string,
): Promise<OutboxItem> {
  const actualizado: OutboxItem = {
    ...item,
    attempts: item.attempts + 1,
    lastError: error,
  };
  await put(STORE_OUTBOX, actualizado);
  return actualizado;
}

/** Saca una operacion de la cola (ya se subio, o ya no vale). */
export async function removeOperation(id: string): Promise<boolean> {
  return remove(STORE_OUTBOX, id);
}

/**
 * Borra **todo** lo local de una persona.
 *
 * Se llama al **cerrar sesion**: en un dispositivo compartido, lo que deja
 * una persona no puede quedar para la siguiente.
 */
export async function clearOfflineData(userId: number | string): Promise<void> {
  const lecturas = await getAll<OfflineReading>(STORE_READINGS);
  for (const lectura of lecturas) {
    if (String(lectura.userId) === String(userId)) {
      await remove(STORE_READINGS, lectura.id);
    }
  }
  const operaciones = await getAll<OutboxItem>(STORE_OUTBOX);
  for (const operacion of operaciones) {
    if (String(operacion.userId) === String(userId)) {
      await remove(STORE_OUTBOX, operacion.id);
    }
  }
}

/** Borra la base entera (cambio de usuario, o "olvidar todo"). */
export async function clearAllOfflineData(): Promise<void> {
  await clearStore(STORE_READINGS);
  await clearStore(STORE_OUTBOX);
  await closeDatabase();
}

/**
 * Un identificador de operacion.
 *
 * Sirve de clave de idempotencia: el mismo `id` llega al servidor dos veces
 * si el envio se reintenta, y el servidor lo detecta.
 */
export function createOperationId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Respaldo para navegadores sin `randomUUID`.
  return `op-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
