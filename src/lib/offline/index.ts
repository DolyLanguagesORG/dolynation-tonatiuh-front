/**
 * La capa de datos local (la parte "offline-first" de la app).
 *
 * Lo que se **lee** se guarda en `readings`; lo que se **hace** sin conexion
 * se encola en `outbox` y se sube cuando vuelve la red.
 *
 * Nada de esto va a la caché HTTP: ahí se cachearían las respuestas del
 * servidor de otra persona.
 */

export {
  DB_NAME,
  DB_VERSION,
  STORE_OUTBOX,
  STORE_READINGS,
  clearStore,
  closeDatabase,
  get,
  getAll,
  put,
  remove,
} from "@/lib/offline/db";
export { sendOfflineOperation } from "@/lib/offline/send-operation";
export {
  clearAllOfflineData,
  clearOfflineData,
  createOperationId,
  enqueueOperation,
  getOfflineReading,
  listOfflineReadings,
  listPendingOperations,
  markOperationAttempt,
  removeOperation,
  saveOfflineReading,
} from "@/lib/offline/store";
export { syncPendingOperations, type SyncResult } from "@/lib/offline/sync";
export type {
  OfflineReading,
  OutboxItem,
  OutboxOperationType,
} from "@/lib/offline/types";
export { useOnlineStatus } from "@/lib/offline/use-online-status";
