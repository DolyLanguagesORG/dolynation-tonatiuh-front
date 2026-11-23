"use client";

import { useCallback, useEffect } from "react";

import { useAuth } from "@/context";
import { sendOfflineOperation, syncPendingOperations } from "@/lib/offline";

/**
 * Vacia la cola de operaciones pendientes **cuando vuelve la red**.
 *
 * Sin esto, lo que la persona hizo sin conexion (responder una lectura,
 * guardar una palabra en el glosario) se quedaria en el dispositivo: la
 * cola se llenaria y nadie veria el resultado.
 *
 * Se dispara:
 *   - al abrir la app (puede que la red ya haya vuelto);
 *   - en el evento \`online\` del navegador (la red vuelve).
 *
 * El envio lleva la **clave de idempotencia** (el \`id\` de la operacion),
 * asi que un reintento no repite la operacion en el servidor.
 */
export function useOfflineSync(): void {
  const { user } = useAuth();
  const userId = user?.id ?? "me";

  const sincronizar = useCallback(async () => {
    if (typeof window === "undefined") return;

    // **No** se consulta `navigator.onLine`: dice "hay una interfaz de red",
    // no "el servidor responde" (y hay navegadores que lo tienen en `true`
    // sin salida a internet). La unica prueba fiable es **intentar**: si
    // falla, la operacion se queda en la cola y se reintenta luego.
    try {
      await syncPendingOperations({ send: sendOfflineOperation, userId });
    } catch {
      // Si la sincronizacion falla, la cola sigue intacta: se reintentara
      // en la proxima vez que la app se abra o vuelva la red.
    }
  }, [userId]);

  useEffect(() => {
    void sincronizar();

    // En cuanto el service worker esta activo, se le pide que guarde la
    // pagina actual: la primera visita no pasa por el (el service worker se
    // registra despues), y sin esto, perder la red justo despues dejaria
    // al usuario en la pagina de "sin conexion" en vez de en su lectura.
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker.ready
      .then((registro) => {
        registro.active?.postMessage({
          type: "DOLY_CACHE_PAGE",
          url: window.location.href,
        });
      })
      .catch(() => {
        // Sin service worker: la app sigue funcionando (sin modo offline).
      });

    const alVolverLaRed = () => {
      void sincronizar();
    };
    window.addEventListener("online", alVolverLaRed);
    return () => {
      window.removeEventListener("online", alVolverLaRed);
    };
  }, [sincronizar]);
}

/**
 * El sincronizador, montado (no devuelve nada: solo dispara el vaciado de
 * la cola).
 */
export function OfflineSync(): null {
  useOfflineSync();
  return null;
}
