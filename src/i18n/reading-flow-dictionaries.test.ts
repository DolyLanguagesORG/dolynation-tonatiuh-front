import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import {
  getReadingFlowDictionary,
  resolveReadingLanguage,
  useImmersionDocumentLanguage,
} from "@/i18n/reading-flow-dictionaries";
import { type TargetLanguageCode } from "@/lib/api-contracts";

describe("readingFlowDictionaries", () => {
  const originalLang = document.documentElement.lang;

  beforeEach(() => {
    document.documentElement.lang = "es";
  });

  afterEach(() => {
    document.documentElement.lang = originalLang;
  });

  it("resolves reading languages directly and falls back to the active UI locale", () => {
    expect(resolveReadingLanguage("fr", "es")).toBe("fr");
    expect(resolveReadingLanguage("it", "es")).toBe("it");
    expect(resolveReadingLanguage("en", "es")).toBe("en");
    expect(resolveReadingLanguage("es", "en")).toBe("es");
    expect(resolveReadingLanguage(undefined, "es")).toBe("es");
    expect(resolveReadingLanguage(null, "en")).toBe("en");
    expect(resolveReadingLanguage("de", "en")).toBe("en");
  });

  it("provides full non-empty UI skeletons for all 4 supported reading languages without ES/EN leaks", () => {
    const languages: TargetLanguageCode[] = ["es", "en", "fr", "it"];

    for (const lang of languages) {
      const dict = getReadingFlowDictionary(lang);
      expect(dict.readings.backToReadings).toBeTruthy();
      expect(dict.readings.continueEvaluationButton).toBeTruthy();
      expect(dict.readings.backToConfigButton).toBeTruthy();
      expect(dict.readings.goToHomeButton).toBeTruthy();
      expect(dict.readings.goToReadingsButton).toBeTruthy();
      expect(dict.readings.literalMeaningLabel).toBeTruthy();
      expect(dict.readings.meaningInTextLabel).toBeTruthy();
      expect(dict.readings.wordBreakdownTitle).toBeTruthy();
      expect(dict.readings.otherWaysTitle).toBeTruthy();
      expect(dict.readings.otherContextsTitle).toBeTruthy();
      expect(dict.readings.selectionActionLabel).toBeTruthy();
      expect(dict.readings.eval.submitButton).toBeTruthy();
      expect(dict.readings.result.completedBadge).toBeTruthy();
      expect(dict.readings.errors.loadReadingFailed).toBeTruthy();
      expect(dict.glossary.entryTypeWord).toBeTruthy();
      expect(dict.glossary.entryTypePhrase).toBeTruthy();
      expect(dict.glossary.savedBadge).toBeTruthy();
      expect(dict.glossary.readingContextLabel).toBeTruthy();
      expect(dict.glossary.literalLabel).toBeTruthy();
      expect(dict.glossary.breakdownLabel).toBeTruthy();
      expect(dict.glossary.alternativesLabel).toBeTruthy();
      expect(dict.glossary.otherContextsLabel).toBeTruthy();
      expect(dict.glossary.openReadingButton).toBeTruthy();
      expect(dict.glossary.readingUnavailableBadge).toBeTruthy();
      expect(dict.glossary.readingUnavailableNotice).toBeTruthy();
      expect(dict.glossary.showDetailsButton).toBeTruthy();
      expect(dict.glossary.hideDetailsButton).toBeTruthy();
      expect(dict.glossary.roleLabel).toBeTruthy();
      expect(dict.readingCard.statusCompleted).toBeTruthy();
      expect(dict.readingCard.statusPendingEvaluation).toBeTruthy();
      expect(dict.readingCard.minReadUnit).toBeTruthy();
      expect(dict.readingCard.wordsUnit).toBeTruthy();
      expect(dict.readingCard.feedbackButton).toBeTruthy();
      expect(dict.readingCard.rereadButton).toBeTruthy();
      expect(dict.readingCard.deleteReadingLabel).toBeTruthy();
      expect(dict.readingCard.confirmDeleteButton).toBeTruthy();
      expect(dict.readingCard.cancelDeleteButton).toBeTruthy();
    }

    const fr = getReadingFlowDictionary("fr");
    expect(fr.readings.backToReadings).toBe("RETOUR AUX LECTURES");
    expect(fr.readings.literalMeaningLabel).toBe("Sens littéral");
    expect(fr.readings.wordBreakdownTitle).toBe("Analyse mot à mot");
    expect(fr.readings.otherWaysTitle).toBe("Autres façons de le dire");
    expect(fr.readings.continueEvaluationButton).toBe("CONTINUER L'ÉVALUATION");
    expect(fr.readings.backToConfigButton).toBe("Revenir à la configuration");
    expect(fr.readings.goToHomeButton).toBe("Aller à l'accueil");
    expect(fr.readings.goToReadingsButton).toBe("Aller aux lectures");
    expect(fr.readings.eval.submitButton).toMatch(/Envoyer le résumé/i);
    expect(fr.readings.result.sessionFooterStandard).toBe("");
    expect(fr.glossary.savedBadge).toBe("ENREGISTRÉ");
    expect(fr.glossary.openReadingButton).toBe("Ouvrir la lecture");
    expect(fr.glossary.readingUnavailableBadge).toBe("Lecture indisponible");

    const itDict = getReadingFlowDictionary("it");
    expect(itDict.readings.backToReadings).toBe("TORNA ALLE LETTURE");
    expect(itDict.readings.literalMeaningLabel).toBe("Senso letterale");
    expect(itDict.readings.wordBreakdownTitle).toBe("Analisi parola per parola");
    expect(itDict.readings.otherWaysTitle).toBe("Altri modi di dirlo");
    expect(itDict.readings.continueEvaluationButton).toBe(
      "CONTINUA CON LA VALUTAZIONE",
    );
    expect(itDict.readings.backToConfigButton).toBe("Torna alla configurazione");
    expect(itDict.readings.goToHomeButton).toBe("Vai alla home");
    expect(itDict.readings.goToReadingsButton).toBe("Vai alle letture");
    expect(itDict.readings.eval.submitButton).toMatch(/Invia riassunto/i);
    expect(itDict.readings.result.sessionFooterStandard).toBe("");
    expect(itDict.glossary.savedBadge).toBe("SALVATO");
    expect(itDict.glossary.openReadingButton).toBe("Apri lettura");
    expect(itDict.glossary.readingUnavailableBadge).toBe("Lettura non disponibile");
  });

  it("syncs documentElement.lang while active in immersion and restores the prior lang on unmount", () => {
    const { unmount } = renderHook(
      ({ lang }: { lang?: TargetLanguageCode | null }) =>
        useImmersionDocumentLanguage(lang),
      { initialProps: { lang: "fr" } },
    );

    expect(document.documentElement.lang).toBe("fr");
    unmount();
    expect(document.documentElement.lang).toBe("es");
  });
});
