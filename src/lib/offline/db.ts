/**
 * Un envoltorio **mínimo** de IndexedDB.
 *
 * Sin dependencias: la API de IndexedDB es pequena y esto es todo lo que
 * hace falta. Y sobre todo, **degrada con elegancia**: si IndexedDB no
 * existe (SSR, modo privado de algunos navegadores, permisos negados),
 * las funciones resuelven `null` o no hacen nada, en vez de romper la app.
 *
 * La base se llama `doly-offline` y tiene dos almacenes:
 *
 *   - `readings`: las lecturas guardadas para leer sin red.
 *   - `outbox`:   las operaciones pendientes de subir.
 *
 * Ambas se borran al cerrar sesion (ver `clearOfflineData`).
 */

export const DB_NAME = "doly-offline";
export const DB_VERSION = 1;

export const STORE_READINGS = "readings";
export const STORE_OUTBOX = "outbox";

let dbPromise: Promise<IDBDatabase | null> | null = null;

/**
 * El `IndexedDB` del entorno.
 *
 * Se busca en el ambito global y no en `window` a proposito: asi el mismo
 * modulo funciona en el navegador **y** en las pruebas (que corren en el
 * entorno de node con `fake-indexeddb`). En el navegador, `indexedDB` es
 * global igual que `window.indexedDB`.
 */
function getIndexedDb(): IDBFactory | null {
  if (typeof globalThis === "undefined") return null;
  const factory = (globalThis as { indexedDB?: IDBFactory }).indexedDB;
  return factory ?? null;
}

/** Abre (o crea) la base. `null` si el navegador no la tiene. */
function openDatabase(): Promise<IDBDatabase | null> {
  const factory = getIndexedDb();
  if (!factory) {
    return Promise.resolve(null);
  }
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase | null>((resolve) => {
      let request: IDBOpenDBRequest;
      try {
        request = factory.open(DB_NAME, DB_VERSION);
      } catch {
        resolve(null);
        return;
      }
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_READINGS)) {
          db.createObjectStore(STORE_READINGS, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
          db.createObjectStore(STORE_OUTBOX, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    });
  }
  return dbPromise;
}

/** Una peticion de IndexedDB envuelta en promesa. */
function toPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB: la peticion fallo"));
  });
}

/** Guarda (o replaces) un registro. */
export async function put<T>(storeName: string, value: T): Promise<boolean> {
  const db = await openDatabase();
  if (!db) return false;
  try {
    const tx = db.transaction(storeName, "readwrite");
    await toPromise(tx.objectStore(storeName).put(value));
    return true;
  } catch {
    return false;
  }
}

/** Lee un registro por clave. */
export async function get<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
  const db = await openDatabase();
  if (!db) return null;
  try {
    const tx = db.transaction(storeName, "readonly");
    return (await toPromise(tx.objectStore(storeName).get(key))) ?? null;
  } catch {
    return null;
  }
}

/** Lee todos los registros de un almacen. */
export async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase();
  if (!db) return [];
  try {
    const tx = db.transaction(storeName, "readonly");
    return (await toPromise(tx.objectStore(storeName).getAll())) as T[];
  } catch {
    return [];
  }
}

/** Borra un registro por clave. */
export async function remove(storeName: string, key: IDBValidKey): Promise<boolean> {
  const db = await openDatabase();
  if (!db) return false;
  try {
    const tx = db.transaction(storeName, "readwrite");
    await toPromise(tx.objectStore(storeName).delete(key));
    return true;
  } catch {
    return false;
  }
}

/** Vacia un almacen entero. */
export async function clearStore(storeName: string): Promise<boolean> {
  const db = await openDatabase();
  if (!db) return false;
  try {
    const tx = db.transaction(storeName, "readwrite");
    await toPromise(tx.objectStore(storeName).clear());
    return true;
  } catch {
    return false;
  }
}

/**
 * Cierra la base.
 *
 * Se llama al **cerrar sesion**: los datos de una persona no pueden quedar
 * en el dispositivo de otra (en un portatil compartido, el siguiente
 * usuario encontraria las historias del anterior).
 */
export async function closeDatabase(): Promise<void> {
  const pendiente = dbPromise;
  dbPromise = null;
  if (!pendiente) return;
  const db = await pendiente;
  db?.close();
}
