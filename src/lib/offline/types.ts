import type { GlossaryEntryDto, ReadingDto } from "@/lib/api-contracts";

/**
 * Tipos de la capa de datos local (la parte "offline-first" de la app).
 *
 * La idea: los datos **del usuario** no viven en la caché HTTP (ahí se
 * cachearían las respuestas del servidor de otro), viven en **IndexedDB**,
 * que es una base de datos local del navegador: es de cada persona y de cada
 * dispositivo, y se borra al cerrar sesión.
 */

/** Una lectura guardada en el dispositivo, para poder leerla sin red. */
export interface OfflineReading {
  /** La IP de la lectura en la API (es la clave). */
  id: number;
  /** De quien es: al cerrar sesion se borra todo lo de ese usuario. */
  userId: number | string;
  /** El contenido de la lectura (texto, titulo, idioma, estado...). */
  reading: ReadingDto;
  /** Las explicaciones ya pedidas (si las hubo): no se vuelven a pedir. */
  explanations: GlossaryEntryDto[];
  /** Cuando se guardo (ISO). Para saber que copia es mas reciente. */
  savedAt: string;
}

/** Lo que se puede hacer sin conexion y subir despues. */
export type OutboxOperationType =
  /** Enviar la respuesta de la lectura (la evalua la IA en el servidor). */
  | "evaluate"
  /** Pedir la explicacion de una palabra. */
  | "explanation"
  /** Guardar una palabra en el glosario. */
  | "glossary";

/**
 * Una operacion pendiente de subir.
 *
 * El `id` lo genera el cliente y **viaja al servidor** como clave de
 * idempotencia: si el envio se corta a mitad (sin red, el servidor cae),
 * al reintentar el servidor ve que ya la recibio y no la duplica. Sin eso,
 * un reintento podria evaluar la respuesta dos veces (y la IA cobrar dos
 * veces).
 */
export interface OutboxItem {
  /** Identificador unico de la operacion (tambien la clave de idempotencia). */
  id: string;
  /**
   * Numero de orden.
   *
   * La marca de tiempo NO alcanza: dos operaciones encoladas en el mismo
   * milisegundo quedarían en orden aleatorio, y el orden importa (primero
   * se responde la lectura, despues se guarda en el glosario).
   */
  seq: number;
  /** De que tipo es. */
  type: OutboxOperationType;
  /** La lectura a la que pertenece. */
  readingId: number;
  /** De quien es (para borrar su cola al cerrar sesion). */
  userId: number | string;
  /** Los datos de la operacion (los que espera la API). */
  payload: Record<string, unknown>;
  /** Cuando se encolo (ISO). */
  createdAt: string;
  /** Cuantos intentos lleva. */
  attempts: number;
  /** El ultimo error (para poder explicarle al usuario que paso). */
  lastError?: string;
}
