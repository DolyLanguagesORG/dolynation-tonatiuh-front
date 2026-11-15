import { cookies } from "next/headers";

import { type Locale, resolveUiLocale, UI_LOCALE_COOKIE_NAME } from "@/i18n/locales";

/**
 * Resuelve el idioma activo de la interfaz en Server Components leyendo la
 * cookie persistida del usuario.
 */
export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return resolveUiLocale(cookieStore.get(UI_LOCALE_COOKIE_NAME)?.value);
}
