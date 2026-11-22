import { readFileSync } from "node:fs";
import { join } from "node:path";

import { buildManifest } from "@/app/manifest";

/**
 * Lo que el navegador (y el sistema operativo) exigen para que la app sea
 * **instalable**. Si algo de esto falla, la app no aparece en la pantalla de
 * inicio: no hay aviso, simplemente no se puede instalar.
 *
 * Por que esto es un test y no una comprobacion manual: los iconos se
 * pueden regenerar con el tamano equivocado (o borrarse) sin que se note en
 * el codigo, y el fallo aparece en el movil, ahi donde no se prueba.
 */

const RAIZ = join(__dirname, "..", "..");

/** El ancho y el alto de un PNG, leidos de su cabecera. */
function dimensionesPng(ruta: string): { ancho: number; alto: number } {
  const buffer = readFileSync(ruta);
  // La firma del PNG son 8 bytes; el IHDR empieza en el byte 8 y el ancho y
  // el alto estan en los bytes 16-24 (big endian).
  const firma = buffer.subarray(0, 8).toString("hex");
  if (firma !== "89504e470d0a1a0a") {
    throw new Error(`${ruta} no es un PNG`);
  }
  return {
    ancho: buffer.readUInt32BE(16),
    alto: buffer.readUInt32BE(20),
  };
}

describe("el manifest de la PWA", () => {
  const manifest = buildManifest({
    name: "DolyNation",
    shortName: "DolyNation",
    description: "Aprende idiomas leyendo",
    locale: "es",
  });

  it("declara el nombre, el nombre corto y la descripcion", () => {
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.description).toBeTruthy();
  });

  it("arranca en la raiz y cubre toda la app", () => {
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
  });

  it("se abre en standalone (sin barra de navegador)", () => {
    expect(manifest.display).toBe("standalone");
  });

  it("declara los colores y el idioma", () => {
    expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(manifest.lang).toBe("es");
  });

  it("tiene el icono de 192, el de 512 y el maskable de Android", () => {
    const tamanos = (manifest.icons ?? []).map((icon) => icon.sizes);
    expect(tamanos).toContain("192x192");
    expect(tamanos).toContain("512x512");

    const maskable = (manifest.icons ?? []).find(
      (icon) => icon.purpose === "maskable",
    );
    expect(maskable).toBeDefined();
  });

  it("los iconos existen y tienen el tamano que declaran", () => {
    for (const icon of manifest.icons ?? []) {
      const ruta = join(RAIZ, "public", icon.src.replace(/^\//, ""));
      const { ancho, alto } = dimensionesPng(ruta);
      const [esperado] = (icon.sizes ?? "").split("x");

      expect(`${ancho}x${alto}`).toBe(icon.sizes);
      expect(String(ancho)).toBe(esperado);
    }
  });

  it("el icono de iOS esta (iOS no lee el manifest)", () => {
    const { ancho, alto } = dimensionesPng(
      join(RAIZ, "public", "icons", "apple-touch-icon-180.png"),
    );
    expect(`${ancho}x${alto}`).toBe("180x180");
  });
});
