import { spawnSync } from "node:child_process";

import { createSerwistRoute } from "@serwist/turbopack";

/**
 * La ruta que sirve el service worker compilado.
 *
 * Serwist compila `src/app/sw.ts` y lo sirve aqui, en `/serwist/sw.js`.
 *
 * Con Turbopack (el bundler por defecto de Next 16) esta es la via
 * soportada: la integracion con webpack no se ejecuta.
 */

/**
 * La revision versiona la pagina offline precacheada: sin ella, el
 * navegador podria servir una copia vieja de esa pagina.
 */
const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout ??
  crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: [{ url: "/offline", revision }],
    swSrc: "src/app/sw.ts",
    // `esbuild` en nativo: sin wasm, compila mas rapido.
    useNativeEsbuild: true,
  });
