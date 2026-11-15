/**
 * Barril público de internacionalización (universal/client-safe).
 *
 * Para utilidades server-only (`cookies()`, `fs`) importa directamente desde:
 * - `@/i18n/server-locale`
 * - `@/i18n/server-legal-docs`
 */

export {
  DEFAULT_UI_LOCALE,
  formatCountMessage,
  formatMessage,
  getNextUiLocale,
  isUiLocale,
  resolveBilingualText,
  resolveUiLocale,
  SUPPORTED_UI_LOCALES,
  UI_LOCALE_CATALOG,
  UI_LOCALE_COOKIE_NAME,
  UI_LOCALE_LIST,
  type Locale,
  type UiLocaleDescriptor,
} from "@/i18n/locales";

export {
  dictionaries,
  getDictionary,
  type Dictionary,
} from "@/i18n/dictionaries";

export {
  getReadingFlowDictionary,
  readingFlowDictionaries,
  resolveReadingLanguage,
  useImmersionDocumentLanguage,
  type GlossaryCardDictionary,
  type ReadingCardDictionary,
  type ReadingFlowDictionary,
} from "@/i18n/reading-flow-dictionaries";

export {
  LocaleProvider,
  useLocale,
  type LocaleProviderProps,
} from "@/i18n/locale-context";

export {
  parseLegalMarkdown,
  type LegalDocument,
  type LegalDocumentKind,
  type LegalDocumentSection,
} from "@/i18n/legal-types";
