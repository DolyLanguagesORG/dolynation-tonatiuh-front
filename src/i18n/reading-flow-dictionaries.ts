"use client";

import { useEffect } from "react";

import {
  dictionaries,
  type Dictionary,
  type Locale,
} from "@/i18n/dictionaries";
import {
  SUPPORTED_LANGUAGE_IDS,
  type TargetLanguageCode,
} from "@/lib/api-contracts";

export type GlossaryCardDictionary = Pick<
  Dictionary["glossary"],
  | "entryTypeWord"
  | "entryTypePhrase"
  | "savedBadge"
  | "literalLabel"
  | "readingContextLabel"
  | "breakdownLabel"
  | "alternativesLabel"
  | "otherContextsLabel"
  | "sourceReadingLabel"
  | "openReadingButton"
  | "readingUnavailableBadge"
  | "readingUnavailableNotice"
  | "addToGlossaryButton"
  | "removeFromGlossaryButton"
  | "pronounceButton"
  | "showDetailsButton"
  | "hideDetailsButton"
  | "roleLabel"
>;

export type ReadingCardDictionary = Dictionary["readingCard"];

/**
 * Diccionario completo del flujo inmersivo de lectura, consulta léxica,
 * evaluación de comprensión, resultados y tarjetas de lectura/glosario,
 * proyectado directamente desde los JSON centralizados (`es`, `en`, `fr`, `it`).
 */
export interface ReadingFlowDictionary {
  readings: Dictionary["readings"];
  glossary: GlossaryCardDictionary;
  readingCard: ReadingCardDictionary;
  home: {
    feedbackButton: string;
  };
}

const SUPPORTED_SET = new Set<string>(SUPPORTED_LANGUAGE_IDS);

/**
 * Normaliza un código de idioma de lectura hacia un `TargetLanguageCode` válido,
 * usando el `Locale` global de interfaz como respaldo antes de cargar la lectura.
 */
export function resolveReadingLanguage(
  readingLanguage?: string | null,
  fallbackLocale: Locale = "es",
): TargetLanguageCode {
  if (readingLanguage && SUPPORTED_SET.has(readingLanguage)) {
    return readingLanguage as TargetLanguageCode;
  }
  return fallbackLocale;
}

function buildReadingFlowDictionary(
  language: TargetLanguageCode,
): ReadingFlowDictionary {
  const dict = dictionaries[language];
  return {
    readings: {
      ...dict.readings,
      result: {
        ...dict.readings.result,
        sessionFooterStandard:
          language === "fr" || language === "it"
            ? ""
            : dict.readings.result.sessionFooterStandard,
      },
    },
    glossary: {
      entryTypeWord: dict.glossary.entryTypeWord,
      entryTypePhrase: dict.glossary.entryTypePhrase,
      savedBadge: dict.glossary.savedBadge,
      literalLabel: dict.glossary.literalLabel,
      readingContextLabel: dict.glossary.readingContextLabel,
      breakdownLabel: dict.glossary.breakdownLabel,
      alternativesLabel: dict.glossary.alternativesLabel,
      otherContextsLabel: dict.glossary.otherContextsLabel,
      sourceReadingLabel: dict.glossary.sourceReadingLabel,
      openReadingButton: dict.glossary.openReadingButton,
      readingUnavailableBadge: dict.glossary.readingUnavailableBadge,
      readingUnavailableNotice: dict.glossary.readingUnavailableNotice,
      addToGlossaryButton: dict.glossary.addToGlossaryButton,
      removeFromGlossaryButton: dict.glossary.removeFromGlossaryButton,
      pronounceButton: dict.glossary.pronounceButton,
      showDetailsButton: dict.glossary.showDetailsButton,
      hideDetailsButton: dict.glossary.hideDetailsButton,
      roleLabel: dict.glossary.roleLabel,
    },
    readingCard: dict.readingCard,
    home: {
      feedbackButton: dict.home.feedbackButton,
    },
  };
}

export const readingFlowDictionaries: Record<
  TargetLanguageCode,
  ReadingFlowDictionary
> = {
  es: buildReadingFlowDictionary("es"),
  en: buildReadingFlowDictionary("en"),
  fr: buildReadingFlowDictionary("fr"),
  it: buildReadingFlowDictionary("it"),
};

/**
 * Devuelve el diccionario inmersivo completo correspondiente al idioma de la lectura.
 */
export function getReadingFlowDictionary(
  language: TargetLanguageCode,
): ReadingFlowDictionary {
  return readingFlowDictionaries[language] ?? readingFlowDictionaries.en;
}

/**
 * Sincroniza temporalmente `<html lang>` con el idioma de la lectura activa
 * y restaura el valor anterior al salir del flujo inmersivo.
 */
export function useImmersionDocumentLanguage(
  language?: TargetLanguageCode | null,
): void {
  useEffect(() => {
    if (!language || typeof document === "undefined") {
      return;
    }
    const previous = document.documentElement.lang;
    document.documentElement.lang = language;
    return () => {
      document.documentElement.lang = previous;
    };
  }, [language]);
}
