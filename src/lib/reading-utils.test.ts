import { describe, expect, it } from "@jest/globals";

import { evaluatePasswordStrength } from "@/lib/password-strength";
import {
  cleanLookupSelection,
  cleanLookupWord,
  countWords,
  extractSalientVocabulary,
  formatReadingLanguageBadge,
  getDifficultyMeta,
  getSpeechLocale,
} from "@/lib/reading-utils";

describe("reading-utils & password-strength", () => {
  it("normalizes single words and multi-word phrase selections", () => {
    expect(cleanLookupWord("«c'est-à-dire»,")).toBe("c'est-à-dire");
    expect(cleanLookupSelection('  "L\'apprentissage rapide."  ')).toBe(
      "L'apprentissage rapide",
    );
    expect(cleanLookupSelection("   ")).toBe("");
  });

  it("extracts distinct salient vocabulary excluding multilingual stopwords", () => {
    const terms = extractSalientVocabulary(
      "Aunque pendant architecture language comprehension comprehension synthesis",
      4,
    );
    expect(terms).toEqual(["architecture", "language", "comprehension", "synthesis"]);
    expect(countWords("one  two\nthree")).toBe(3);
  });

  it("maps language badges, difficulty CEFR labels, and speech locales across 4 languages", () => {
    expect(formatReadingLanguageBadge("es", "es")).toBe("[ES] ESPAÑOL");
    expect(formatReadingLanguageBadge("en", "en")).toBe("[EN] ENGLISH");
    expect(formatReadingLanguageBadge("fr", "es")).toBe("[FR] FRANCÉS");
    expect(formatReadingLanguageBadge("it", "en")).toBe("[IT] ITALIAN");

    expect(getDifficultyMeta("easy", "en").cefrBadge).toBe("A1–A2");
    expect(getDifficultyMeta("medium", "es").cefrBadge).toBe("B1–B2");
    expect(getDifficultyMeta("hard", "es").cefrBadge).toBe("C1–C2");

    expect(getSpeechLocale("es")).toBe("es-ES");
    expect(getSpeechLocale("en")).toBe("en-US");
    expect(getSpeechLocale("fr")).toBe("fr-FR");
    expect(getSpeechLocale("it")).toBe("it-IT");
  });

  it("assesses password strength segments and bilingual labels", () => {
    expect(evaluatePasswordStrength("", "es").activeSegments).toBe(0);
    expect(evaluatePasswordStrength("abc", "en")).toEqual({
      activeSegments: 1,
      label: "Strength: Weak",
      tone: "warning",
    });
    expect(evaluatePasswordStrength("abcdefgh", "es").activeSegments).toBe(1);
    expect(evaluatePasswordStrength("Abcdefgh", "en").activeSegments).toBe(2);
    expect(evaluatePasswordStrength("Abcdefg1!", "es")).toEqual({
      activeSegments: 3,
      label: "Seguridad: Segura",
      tone: "success",
    });
  });
});
