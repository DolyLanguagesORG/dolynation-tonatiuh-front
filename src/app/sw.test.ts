import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * La estrategia del service worker.
 *
 * Este fichero protege **la invariante** de la PWA:
 *
 *   **Lo que depende de quién eres, NUNCA se cachea.**
 *
 * Si alguien cambia la estrategia y la API pasa a cachearse, un usuario
 * vería los datos de otro (o la app creería que tiene la sesión de otro).
 * Ese fallo es invisible en el código y aparece en el móvil, con datos
 * reales de personas: por eso tiene su test.
 *
 * El service worker se compila con Serwist y se sirve en
 * `/serwist/sw.js`; aquí se comprueba **el fuente**, que es lo que decide
 * el comportamiento.
 */

const SW = readFileSync(join(__dirname, "..", "app", "sw.ts"), "utf8");

/** El bloque del service worker entre dos comentarios. */
function bloque(desde: string, hasta: string): string {
  const inicio = SW.indexOf(desde);
  const fin = SW.indexOf(hasta);
  if (inicio < 0) {
    throw new Error(`el bloque "${desde}" deberia existir en sw.ts`);
  }
  if (fin <= inicio) {
    throw new Error(`el bloque "${hasta}" deberia ir despues de "${desde}"`);
  }
  return SW.slice(inicio, fin);
}

describe("la estrategia del service worker", () => {
  it("la API NUNCA se cachea (es el dato de quien eres)", () => {
    const api = bloque("// 1. La API", "// 2. Las navegaciones");
    expect(api).toContain("NetworkOnly");
    expect(api).not.toContain("CacheFirst");
    expect(api).not.toContain("NetworkFirst");
    expect(api).not.toContain("StaleWhileRevalidate");
  });

  it("las navegaciones van red primero (para leer sin red lo ya visitado)", () => {
    const navegaciones = bloque("// 2. Las navegaciones", "// 3. Los assets");
    expect(navegaciones).toContain("NetworkFirst");
  });

  it("los assets van cache primero (llevan hash: no cambian)", () => {
    const assets = bloque("// 3. Los assets", "// 4. Los demas assets");
    expect(assets).toContain("CacheFirst");
  });

  it("si no hay red y no hay copia, se sirve la pagina offline", () => {
    expect(SW).toContain("fallbacks");
    expect(SW).toContain('url: "/offline"');
    expect(SW).toContain('request.destination === "document"');
  });

  it("las copias de las paginas expiran (el HTML lleva el estado de sesion)", () => {
    // Un dia: el HTML cacheado no puede quedarse indefinidamente en el
    // dispositivo (lleva el estado de sesion).
    expect(SW).toContain("maxAgeSeconds: unDia");
  });
});
