/**
 * Utilidades de feature flags evaluadas en servidor para controlar vistas opcionales
 * de desarrollo según el entorno de ejecución.
 */

/**
 * Indica si la biblioteca interactiva `/design-system` está habilitada.
 *
 * - Si `ENABLE_DESIGN_SYSTEM` es `"true"` o `"1"`, queda habilitada en cualquier entorno.
 * - Si `ENABLE_DESIGN_SYSTEM` es `"false"` o `"0"`, queda deshabilitada incluso en desarrollo.
 * - Si no está definida, queda habilitada en desarrollo/test y deshabilitada en producción (`NODE_ENV === "production"`).
 */
export function isDesignSystemEnabled(): boolean {
  const raw = process.env.ENABLE_DESIGN_SYSTEM?.trim().toLowerCase();
  if (raw === "true" || raw === "1") {
    return true;
  }
  if (raw === "false" || raw === "0") {
    return false;
  }
  return process.env.NODE_ENV !== "production";
}
