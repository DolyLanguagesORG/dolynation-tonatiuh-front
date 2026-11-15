import {
  type GlossaryEntryDto,
  type LanguagesSettings,
  SUPPORTED_LANGUAGE_IDS,
  type SubscriptionTier,
  type TargetLanguageCode,
} from "@/lib";

const SUPPORTED_LANGUAGE_SET = new Set<string>(SUPPORTED_LANGUAGE_IDS);

export interface GlossaryLanguageOption {
  language: TargetLanguageCode;
  count: number;
  isActiveInPlan: boolean;
  isHistorical: boolean;
}

export interface GlossaryLanguagePlanContext {
  tier: SubscriptionTier | null;
  maxLanguages: number;
  options: GlossaryLanguageOption[];
  hasHistoricalLanguages: boolean;
  showQuickFilter: boolean;
  singlePlanLanguage: GlossaryLanguageOption | null;
}

function normalizeLanguageCodes(
  candidates: readonly string[] | null | undefined,
): TargetLanguageCode[] {
  if (!candidates) return [];
  const seen = new Set<TargetLanguageCode>();
  const resolved: TargetLanguageCode[] = [];
  for (const code of candidates) {
    if (!SUPPORTED_LANGUAGE_SET.has(code)) continue;
    const typed = code as TargetLanguageCode;
    if (seen.has(typed)) continue;
    seen.add(typed);
    resolved.push(typed);
  }
  return resolved;
}

/**
 * Resuelve los idiomas permitidos por el plan actual y construye las opciones del
 * filtro rápido del glosario, incluyendo idiomas históricos solo si existen consultas
 * previas fuera de la selección activa (p. ej. tras un downgrade o cambio anual).
 */
export function buildGlossaryLanguagePlanContext(params: {
  entries: readonly GlossaryEntryDto[];
  scopedEntries: readonly GlossaryEntryDto[];
  tier: SubscriptionTier | null | undefined;
  planMaxLanguages?: number | null;
  languagesSettings?: LanguagesSettings | null;
}): GlossaryLanguagePlanContext {
  const tier = params.tier ?? null;
  const maxLanguages =
    params.planMaxLanguages ??
    params.languagesSettings?.maxLanguages ??
    (tier === "dolly_pro" ? 4 : tier === "dolly_plus" ? 2 : 1);

  const configuredActive = normalizeLanguageCodes(
    params.languagesSettings?.active,
  );
  const configuredSelected = normalizeLanguageCodes(
    params.languagesSettings?.selected,
  );

  const baseActive =
    configuredActive.length > 0
      ? configuredActive.slice(0, maxLanguages)
      : configuredSelected.length > 0
        ? configuredSelected.slice(0, maxLanguages)
        : tier === "dolly_pro"
          ? [...SUPPORTED_LANGUAGE_IDS]
          : [];

  const activeSet = new Set<TargetLanguageCode>(baseActive);

  const scopedCounts = new Map<TargetLanguageCode, number>();
  for (const entry of params.scopedEntries) {
    if (!SUPPORTED_LANGUAGE_SET.has(entry.language)) continue;
    scopedCounts.set(entry.language, (scopedCounts.get(entry.language) ?? 0) + 1);
  }

  const allEntryLanguages = new Set<TargetLanguageCode>();
  for (const entry of params.entries) {
    if (SUPPORTED_LANGUAGE_SET.has(entry.language)) {
      allEntryLanguages.add(entry.language);
    }
  }

  const historicalLanguages = SUPPORTED_LANGUAGE_IDS.filter(
    (code) => allEntryLanguages.has(code) && !activeSet.has(code),
  );

  const options: GlossaryLanguageOption[] = [
    ...baseActive.map((language) => ({
      language,
      count: scopedCounts.get(language) ?? 0,
      isActiveInPlan: true,
      isHistorical: false,
    })),
    ...historicalLanguages.map((language) => ({
      language,
      count: scopedCounts.get(language) ?? 0,
      isActiveInPlan: false,
      isHistorical: true,
    })),
  ];

  const showQuickFilter = options.length > 1;
  const singlePlanLanguage = options.length === 1 ? options[0] : null;

  return {
    tier,
    maxLanguages,
    options,
    hasHistoricalLanguages: historicalLanguages.length > 0,
    showQuickFilter,
    singlePlanLanguage,
  };
}
