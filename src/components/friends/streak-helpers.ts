import {
  type CatalogItem,
  type LanguagesSettings,
  type CategoriesSettings,
  DEFAULT_LANGUAGES,
  type TargetLanguageCode,
} from "@/lib";
import { type Locale } from "@/i18n";

/**
 * Resuelve la lista de categorías aprobadas disponibles en la biblioteca del estudiante
 * (`selected` ∪ `catalog` de `GET /settings/categories`) para proponer o editar una racha diaria.
 */
export function resolveAvailableCategoriesForStreak(
  settings: CategoriesSettings | null | undefined,
  fallbackSelected: readonly string[] = [],
): CatalogItem[] {
  const catalog = settings?.catalog ?? [];
  const selected =
    settings?.selected && settings.selected.length > 0
      ? settings.selected
      : [...fallbackSelected];

  const byKey = new Map<string, CatalogItem>();
  for (const item of catalog) {
    byKey.set(item.name.toLowerCase(), item);
  }

  const seen = new Set<string>();
  const resolved: CatalogItem[] = [];

  const pushEntry = (rawName: string, id?: string) => {
    const clean = rawName.trim();
    if (!clean) {
      return;
    }
    const dedupeKey = clean.toLowerCase();
    if (seen.has(dedupeKey)) {
      return;
    }
    seen.add(dedupeKey);
    const matched = byKey.get(dedupeKey);
    resolved.push({
      id: id ?? matched?.id ?? clean,
      name: matched?.name ?? clean,
    });
  };

  for (const entry of selected) {
    pushEntry(entry);
  }
  for (const item of catalog) {
    pushEntry(item.name, item.id);
  }

  return resolved;
}

/**
 * Resuelve los idiomas permitidos por el plan actual del estudiante para iniciar rachas diarias.
 */
export function resolveLanguageOptionsForStreak(
  settings: LanguagesSettings | null | undefined,
  locale: Locale,
  fallbackActive: readonly TargetLanguageCode[] = [],
): { id: TargetLanguageCode; name: string }[] {
  const catalog = settings?.catalog ?? [];
  const allowedIds =
    settings?.active && settings.active.length > 0
      ? settings.active
      : settings?.selected && settings.selected.length > 0
        ? settings.selected
        : fallbackActive;

  const catalogById = new Map<TargetLanguageCode, string>();
  for (const item of catalog) {
    catalogById.set(item.id, item.name);
  }
  for (const fallback of DEFAULT_LANGUAGES) {
    if (!catalogById.has(fallback.id)) {
      catalogById.set(
        fallback.id,
        locale === "es" ? fallback.nameEs : fallback.nameEn,
      );
    }
  }

  const targetIds =
    allowedIds.length > 0
      ? allowedIds
      : catalog.length > 0
        ? catalog.map((item) => item.id)
        : (["en"] as TargetLanguageCode[]);

  return Array.from(new Set(targetIds)).map((id) => ({
    id,
    name: catalogById.get(id) ?? id.toUpperCase(),
  }));
}
