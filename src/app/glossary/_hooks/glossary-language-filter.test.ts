import { describe, expect, it } from "@jest/globals";

import { buildGlossaryLanguagePlanContext } from "@/app/glossary/_hooks/glossary-language-filter";
import {
  type GlossaryEntryDto,
  type LanguagesSettings,
  type TargetLanguageCode,
} from "@/lib";

function makeEntry(
  id: number,
  language: TargetLanguageCode,
  isSaved = true,
): GlossaryEntryDto {
  return {
    id,
    readingId: id + 100,
    readingTitle: `Reading ${id}`,
    readingAvailable: true,
    word: `term-${id}`,
    normalizedWord: `term-${id}`,
    entryType: "word",
    language,
    difficulty: "medium",
    context: "Sample context.",
    literalMeaning: "Sample literal meaning.",
    explanation: "Sample explanation.",
    wordBreakdown: [],
    otherWaysToSay: [],
    otherContexts: [],
    isSaved,
    savedAt: isSaved ? "2026-11-14T10:00:00.000Z" : null,
    createdAt: "2026-11-14T10:00:00.000Z",
    updatedAt: "2026-11-14T10:00:00.000Z",
  };
}

function makeLanguagesSettings(
  active: TargetLanguageCode[],
  maxLanguages: number,
  selected: TargetLanguageCode[] = active,
): LanguagesSettings {
  return {
    catalog: [
      { id: "es", name: "Español" },
      { id: "en", name: "Inglés" },
      { id: "fr", name: "Francés" },
      { id: "it", name: "Italiano" },
    ],
    selected,
    active,
    maxLanguages,
    canChangeFree: false,
    nextFreeChangeAt: null,
    lastLanguageChangeAt: "2026-11-01T00:00:00.000Z",
    languageChangeCredits: 0,
  };
}

describe("buildGlossaryLanguagePlanContext", () => {
  it("shows single-language badge without multi-language quick filter for Dolly plan with one language", () => {
    const entries = [makeEntry(1, "en", true), makeEntry(2, "en", true)];
    const ctx = buildGlossaryLanguagePlanContext({
      entries,
      scopedEntries: entries,
      tier: "dolly",
      planMaxLanguages: 1,
      languagesSettings: makeLanguagesSettings(["en"], 1),
    });

    expect(ctx.maxLanguages).toBe(1);
    expect(ctx.showQuickFilter).toBe(false);
    expect(ctx.hasHistoricalLanguages).toBe(false);
    expect(ctx.singlePlanLanguage).toEqual({
      language: "en",
      count: 2,
      isActiveInPlan: true,
      isHistorical: false,
    });
  });

  it("reveals historical consulted languages alongside active plan language after a downgrade", () => {
    const entries = [
      makeEntry(1, "en", true),
      makeEntry(2, "fr", true),
      makeEntry(3, "fr", false),
    ];
    const scopedEntries = entries.filter((e) => e.isSaved);

    const ctx = buildGlossaryLanguagePlanContext({
      entries,
      scopedEntries,
      tier: "dolly",
      planMaxLanguages: 1,
      languagesSettings: makeLanguagesSettings(["en"], 1, ["en", "fr"]),
    });

    expect(ctx.showQuickFilter).toBe(true);
    expect(ctx.hasHistoricalLanguages).toBe(true);
    expect(ctx.singlePlanLanguage).toBeNull();
    expect(ctx.options).toEqual([
      {
        language: "en",
        count: 1,
        isActiveInPlan: true,
        isHistorical: false,
      },
      {
        language: "fr",
        count: 1,
        isActiveInPlan: false,
        isHistorical: true,
      },
    ]);
  });

  it("shows up to 2 active languages cleanly for Dolly Plus without leaking unselected languages", () => {
    const entries = [makeEntry(1, "en", true)];
    const ctx = buildGlossaryLanguagePlanContext({
      entries,
      scopedEntries: entries,
      tier: "dolly_plus",
      planMaxLanguages: 2,
      languagesSettings: makeLanguagesSettings(["en", "it"], 2),
    });

    expect(ctx.maxLanguages).toBe(2);
    expect(ctx.showQuickFilter).toBe(true);
    expect(ctx.hasHistoricalLanguages).toBe(false);
    expect(ctx.options).toEqual([
      {
        language: "en",
        count: 1,
        isActiveInPlan: true,
        isHistorical: false,
      },
      {
        language: "it",
        count: 0,
        isActiveInPlan: true,
        isHistorical: false,
      },
    ]);
  });

  it("exposes all 4 languages for Dolly Pro even before entries exist in all of them", () => {
    const entries = [makeEntry(1, "es", true), makeEntry(2, "fr", true)];
    const ctx = buildGlossaryLanguagePlanContext({
      entries,
      scopedEntries: entries,
      tier: "dolly_pro",
      planMaxLanguages: 4,
      languagesSettings: makeLanguagesSettings(["es", "en", "fr", "it"], 4),
    });

    expect(ctx.maxLanguages).toBe(4);
    expect(ctx.showQuickFilter).toBe(true);
    expect(ctx.hasHistoricalLanguages).toBe(false);
    expect(ctx.options.map((o) => [o.language, o.count])).toEqual([
      ["es", 1],
      ["en", 0],
      ["fr", 1],
      ["it", 0],
    ]);
  });
});
