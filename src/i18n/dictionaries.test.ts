import {
  dictionaries,
  formatCountMessage,
  formatMessage,
  getDictionary,
  getNextUiLocale,
  isUiLocale,
  resolveUiLocale,
  SUPPORTED_UI_LOCALES,
  UI_LOCALE_LIST,
} from "@/i18n";

function collectLeafEntries(
  obj: unknown,
  prefix = "",
): Array<[string, unknown]> {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return [[prefix, obj]];
  }
  const entries: Array<[string, unknown]> = [];
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const nextPath = prefix ? `${prefix}.${key}` : key;
    entries.push(...collectLeafEntries(value, nextPath));
  }
  return entries.sort((a, b) => a[0].localeCompare(b[0]));
}

function extractPlaceholders(template: string): string[] {
  return Array.from(template.matchAll(/\{([a-zA-Z0-9_]+)\}/g), (m) => m[1]).sort();
}

describe("Centralized JSON i18n dictionaries", () => {
  it("supports es, en, fr, and it UI locales with matching metadata", () => {
    expect(SUPPORTED_UI_LOCALES).toEqual(["es", "en", "fr", "it"]);
    expect(UI_LOCALE_LIST.map((item) => item.code)).toEqual([
      "es",
      "en",
      "fr",
      "it",
    ]);
    for (const code of SUPPORTED_UI_LOCALES) {
      expect(isUiLocale(code)).toBe(true);
      expect(dictionaries[code].meta.editionBadge).toBe(code.toUpperCase());
    }
    expect(isUiLocale("de")).toBe(false);
  });

  it("maintains identical keys and non-empty translations across all locales", () => {
    const baseEntries = collectLeafEntries(dictionaries.es);
    const baseKeys = baseEntries.map(([key]) => key);

    for (const locale of SUPPORTED_UI_LOCALES) {
      const entries = collectLeafEntries(dictionaries[locale]);
      const keys = entries.map(([key]) => key);
      expect(keys).toEqual(baseKeys);

      for (const [index, [key, value]] of entries.entries()) {
        const [, baseValue] = baseEntries[index] ?? [];
        if (typeof value === "string") {
          expect(value.trim().length).toBeGreaterThan(0);
          if (typeof baseValue === "string") {
            expect(extractPlaceholders(value)).toEqual(
              extractPlaceholders(baseValue),
            );
          }
        } else if (Array.isArray(value)) {
          expect(value.length).toBeGreaterThan(0);
          for (const item of value) {
            if (typeof item === "string") {
              expect(item.trim().length).toBeGreaterThan(0);
            } else if (item && typeof item === "object") {
              for (const nested of Object.values(item as Record<string, unknown>)) {
                expect(String(nested).trim().length).toBeGreaterThan(0);
              }
            }
          }
        }
        expect(key).toBeTruthy();
      }
    }
  });

  it("normalizes locales, cycles locales, and formats message templates", () => {
    expect(resolveUiLocale("FR-ca")).toBe("fr");
    expect(resolveUiLocale("it_IT")).toBe("it");
    expect(resolveUiLocale("unknown")).toBe("es");
    expect(getDictionary("fr").nav.home).toBe("Accueil");
    expect(getDictionary("it").nav.home).toBe("Home");

    expect(getNextUiLocale("es")).toBe("en");
    expect(getNextUiLocale("en")).toBe("fr");
    expect(getNextUiLocale("fr")).toBe("it");
    expect(getNextUiLocale("it")).toBe("es");

    expect(formatMessage("Mostrando {visible} de {total}", { visible: 3, total: 10 })).toBe(
      "Mostrando 3 de 10",
    );
    expect(formatCountMessage("1 día", "{count} días", 1)).toBe("1 día");
    expect(formatCountMessage("1 día", "{count} días", 4)).toBe("4 días");
  });
});
