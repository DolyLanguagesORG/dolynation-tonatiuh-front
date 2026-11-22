"use client";

import { useEffect, useState } from "react";

/**
 * Si el navegador tiene conexion **ahora**.
 *
 * Se usa para:
 *   - decidir si se intenta la API o se lee de la copia local;
 *   - avisar de que algo quedo pendiente de enviar;
 *   - vaciar la cola en cuanto vuelve la red.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return online;
}
