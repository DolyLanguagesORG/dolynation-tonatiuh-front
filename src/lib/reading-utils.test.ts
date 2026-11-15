import { describe, expect, it } from "@jest/globals";

import { evaluatePasswordStrength } from "@/lib/password-strength";
import {
  cleanLookupSelection,
  cleanLookupWord,
  computeNextTokenSpan,
  countWords,
  extractSalientVocabulary,
  findTokenSpanInParagraphs,
  formatReadingLanguageBadge,
  getDifficultyMeta,
  getSpeechLocale,
  resolveSpanSelectionText,
  tokenizeReadingParagraph,
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
    expect(formatReadingLanguageBadge("fr", "fr")).toBe("[FR] FRANÇAIS");
    expect(formatReadingLanguageBadge("it", "en")).toBe("[IT] ITALIAN");
    expect(formatReadingLanguageBadge("it", "it")).toBe("[IT] ITALIANO");

    expect(getDifficultyMeta("easy", "en").cefrBadge).toBe("A1–A2");
    expect(getDifficultyMeta("easy", "fr").label).toBe("DÉBUTANT");
    expect(getDifficultyMeta("medium", "es").cefrBadge).toBe("B1–B2");
    expect(getDifficultyMeta("medium", "fr").label).toBe("INTERMÉDIAIRE");
    expect(getDifficultyMeta("hard", "es").cefrBadge).toBe("C1–C2");
    expect(getDifficultyMeta("hard", "it").label).toBe("AVANZATO");

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

  it("computes contiguous click ranges within a paragraph and resets across paragraphs", () => {
    const paragraphs = [
      "En el exilio de mil novecientos treinta y nueve. Lejos de concebir la melancolía.",
      "Esta perspectiva innovadora desafió el pensamiento.",
    ];
    const p0Tokens = tokenizeReadingParagraph(paragraphs[0]);
    const idxExilio = p0Tokens.findIndex((t) => cleanLookupWord(t) === "exilio");
    const idxNueve = p0Tokens.findIndex((t) => cleanLookupWord(t) === "nueve");
    const idxMelancolia = p0Tokens.findIndex(
      (t) => cleanLookupWord(t) === "melancolía",
    );
    const idxEn = 0;

    // 1. Primer clic selecciona una sola palabra
    const first = computeNextTokenSpan(null, 0, idxExilio);
    expect(first).toEqual({
      paragraphIndex: 0,
      startTokenIndex: idxExilio,
      endTokenIndex: idxExilio,
    });
    expect(resolveSpanSelectionText(paragraphs, first!)).toBe("exilio");

    // 2. Clic en el mismo token único deselecciona
    expect(computeNextTokenSpan(first, 0, idxExilio)).toBeNull();

    // 3. Clic más adelante (saltando palabras o cruzando oraciones del mismo párrafo) extiende el rango
    const crossSentence = computeNextTokenSpan(first, 0, idxMelancolia);
    expect(crossSentence).toEqual({
      paragraphIndex: 0,
      startTokenIndex: idxExilio,
      endTokenIndex: idxMelancolia,
    });
    expect(resolveSpanSelectionText(paragraphs, crossSentence!)).toBe(
      "exilio de mil novecientos treinta y nueve. Lejos de concebir la melancolía",
    );

    // 4. Clic anterior al rango actual extiende hacia atrás
    const backward = computeNextTokenSpan(crossSentence, 0, idxEn);
    expect(backward).toEqual({
      paragraphIndex: 0,
      startTokenIndex: idxEn,
      endTokenIndex: idxMelancolia,
    });

    // 5. Clic dentro de un rango multipalabra enfoca solo ese token
    const inner = computeNextTokenSpan(backward, 0, idxNueve);
    expect(inner).toEqual({
      paragraphIndex: 0,
      startTokenIndex: idxNueve,
      endTokenIndex: idxNueve,
    });

    // 6. Clic en un párrafo diferente reinicia el rango en el nuevo párrafo
    const nextPara = computeNextTokenSpan(backward, 1, 2);
    expect(nextPara).toEqual({
      paragraphIndex: 1,
      startTokenIndex: 2,
      endTokenIndex: 2,
    });
  });

  it("finds single-word and multi-word spans in paragraphs", () => {
    const paragraphs = [
      "En el exilio de mil novecientos treinta y nueve, marcado por la ruptura.",
      "La razón poética rescató la experiencia humana.",
    ];

    const phraseSpan = findTokenSpanInParagraphs(paragraphs, "razón poética");
    expect(phraseSpan).not.toBeNull();
    expect(phraseSpan!.paragraphIndex).toBe(1);
    expect(resolveSpanSelectionText(paragraphs, phraseSpan!)).toBe(
      "razón poética",
    );

    const wordSpan = findTokenSpanInParagraphs(paragraphs, "ruptura");
    expect(wordSpan).not.toBeNull();
    expect(wordSpan!.paragraphIndex).toBe(0);
    expect(resolveSpanSelectionText(paragraphs, wordSpan!)).toBe("ruptura");
  });
});
