"use client";

import { useEffect, useState } from "react";

/**
 * Version de la aplicacion, visible en la interfaz.
 *
 * Permite que un usuario reporte un bug diciendo que version uso. El numero
 * sale de `NEXT_PUBLIC_APP_VERSION`, que el build inyecta: no esta
 * hardcodeado.
 *
 * Si la variable no esta (por ejemplo en desarrollo), se consulta la ruta
 * `/version`, que **siempre** responde (la sirve `src/app/version/route.ts`).
 *
 * Antes se consultaba `/version.json`, que es el archivo estatico que genera
 * el build (`scripts/generate-version-json.mjs`): en desarrollo no existe, y
 * el badge se quedaba sin mostrar con un 404 en la consola. Ese archivo se
 * sigue publicando para monitorizacion (`curl .../version.json`), que es su
 * proposito.
 *
 * Si tampoco hay respuesta, no se muestra nada: es preferible un pie limpio
 * a un "v0.0.0-dev" que confunde.
 */
export function VersionBadge() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    const fromEnv = process.env.NEXT_PUBLIC_APP_VERSION;

    if (fromEnv) {
      // El valor viene del build: se fija una vez, fuera del ciclo de render.
      const apply = () => setVersion(fromEnv);
      apply();
      return;
    }

    let cancelled = false;

    void fetch("/version", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { appVersion?: string } | null) => {
        if (!cancelled && data?.appVersion) {
          setVersion(data.appVersion);
        }
      })
      .catch(() => {
        // Sin version no se muestra el badge: no es un error.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!version) {
    return null;
  }

  return (
    <p
      className="text-[10px] font-medium text-body-subtle tabular-nums"
      data-testid="version-badge"
    >
      {`DolyNation v${version}`}
    </p>
  );
}
