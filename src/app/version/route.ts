import { NextResponse } from "next/server";

/**
 * `public/version.json` — la versión del frontend desplegado.
 *
 * Es la forma estándar en frontends: cualquiera puede pedirla con `curl` y
 * saber al instante qué build está sirviendo. El backend tiene su equivalente
 * en `GET /api/v1/version`.
 *
 * El archivo se **genera en el build** (ver `scripts/generate-version-json.mjs`),
 * no se versiona: sus valores cambian en cada build y no tiene sentido
 * guardarlos en el repositorio.
 *
 * Sin cache: un cambio de versión tiene que verse de inmediato.
 */
export function GET(): NextResponse {
  return NextResponse.json(
    {
      // Sin APP_VERSION (desarrollo, sin deploy) se usa la version del
      // paquete: mejor `0.7.1` que un `0.0.0-dev` que no dice nada.
      appVersion:
        process.env.APP_VERSION ??
        process.env.npm_package_version ??
        "0.0.0-dev",
      component: process.env.COMPONENT ?? "dolynation-tonatiuh-front",
      version: process.env.npm_package_version ?? "0.0.0-dev",
      commit: process.env.GIT_COMMIT ?? "unknown",
      builtAt: process.env.BUILT_AT ?? "unknown",
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
