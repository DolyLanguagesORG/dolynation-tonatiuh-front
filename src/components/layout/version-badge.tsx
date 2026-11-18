"use client";

import { useEffect, useState } from "react";

/**
 * Version de la aplicacion, visible en la interfaz.
 *
 * Permite que un usuario reporte un bug diciendo que version uso. El numero
 * sale de `NEXT_PUBLIC_APP_VERSION`, que el build inyecta: no esta
 * hardcodeado.
 *
 * La version sale de la ruta `/version`, que **siempre** responde (la sirve
 * `src/app/version/route.ts`) y que el deploy mantiene al dia.
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
    // La fuente de verdad es `/version`: lo inyecta el **deploy** (la version
    // de la aplicacion, la que compone `versions.yml`), asi que es la misma
    // que responden el resto de servicios y no queda desfasada.
    //
    // `NEXT_PUBLIC_APP_VERSION` va horneada en el bundle (es una variable
    // `NEXT_PUBLIC_`) y es la version del **componente** en el momento del
    // build: sirve de respaldo si el fetch falla, no de fuente principal.
    let cancelled = false;

    void fetch("/version", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { appVersion?: string } | null) => {
        if (!cancelled && data?.appVersion) {
          setVersion(data.appVersion);
          return;
        }
        const horneada = process.env.NEXT_PUBLIC_APP_VERSION;
        if (!cancelled && horneada) {
          setVersion(horneada);
        }
      })
      .catch(() => {
        // Sin `/version` se usa la version horneada del build; si tampoco
        // hay, no se muestra el badge: no es un error.
        const horneada = process.env.NEXT_PUBLIC_APP_VERSION;
        if (!cancelled && horneada) {
          setVersion(horneada);
        }
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
