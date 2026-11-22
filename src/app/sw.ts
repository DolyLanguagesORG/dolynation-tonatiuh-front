/// <reference lib="esnext" />
/// <reference lib="webworker" />

import {
  CacheableResponsePlugin,
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
} from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

/**
 * El service worker de DolyNation.
 *
 * Se compila con **@serwist** (el sucesor de `next-pwa`, abandonada en 2022).
 * La parte critica —la estrategia de cache— esta escrita aqui, a mano y a la
 * vista, en vez de delegarse en la receta por defecto.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA REGLA QUE GOBIERNA ESTE FICHERO
 *
 *   **Lo que depende de quién eres, NUNCA se cachea.**
 *
 *   - La **API** (`/api/**`): `NetworkOnly`. Son los datos del usuario; si se
 *     cachearan, se le servirían a otra persona (y la app creería que tiene
 *     la sesión de otro).
 *   - Las **navegaciones**: `NetworkFirst` con la copia de respaldo, para
 *     poder leer sin red la página que ya se visitó.
 *   - Los **assets** (`/_next/static/**` y los estáticos): `CacheFirst`.
 *     Llevan hash en el nombre, así que nunca cambian.
 *
 * Los datos del usuario que la app necesita sin red (el texto de la lectura,
 * las respuestas pendientes) **no viven aquí**: viven en **IndexedDB** (la
 * capa de datos local) y se sincronizan con la cola.
 * ─────────────────────────────────────────────────────────────────────────────
 */

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    // Este atributo lo sustituye Serwist por el manifiesto de precache real.
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const unDia = 60 * 60 * 24;
const unAno = unDia * 365;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  // El precarga del navegador no ayuda aqui: las navegaciones son dinamicas.
  navigationPreload: false,

  runtimeCaching: [
    {
      // 1. La API: **nunca** se cachea.
      matcher: ({ url, sameOrigin }) =>
        sameOrigin && url.pathname.startsWith("/api/"),
      handler: new NetworkOnly(),
    },
    {
      // 2. Las navegaciones: red primero; si no hay red, la copia de la
      //    pagina (que es lo que permite leer la historia sin conexion).
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: "doly-pages",
        networkTimeoutSeconds: 4,
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({
            maxEntries: 32,
            // Al expirar, se borra la copia: el HTML lleva el estado de
            // sesion y no debe quedarse en el dispositivo indefinidamente.
            maxAgeSeconds: unDia,
            purgeOnQuotaError: true,
          }),
        ],
      }),
    },
    {
      // 3. Los assets de Next (llevan hash: no cambian nunca).
      matcher: ({ url, sameOrigin }) =>
        sameOrigin && url.pathname.startsWith("/_next/static/"),
      handler: new CacheFirst({
        cacheName: "doly-assets",
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({
            maxEntries: 160,
            maxAgeSeconds: unAno,
          }),
        ],
      }),
    },
    {
      // 4. Los demas assets publicos (iconos, fuentes, imagenes).
      matcher: ({ url, sameOrigin }) =>
        sameOrigin &&
        /\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|woff2?|ttf|otf)$/.test(
          url.pathname,
        ),
      handler: new CacheFirst({
        cacheName: "doly-static",
        plugins: [
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({
            maxEntries: 80,
            maxAgeSeconds: unAno,
          }),
        ],
      }),
    },
  ],

  // Si no hay red y la pagina no esta cacheada, se sirve la pagina offline
  // (una shell minima, sin datos de sesion).
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
