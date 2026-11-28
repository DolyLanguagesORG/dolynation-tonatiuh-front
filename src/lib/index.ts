export * from "@/lib/api-contracts";
export {
  ApiClientError,
  ErrorCode,
  extractRejectedCategories,
  extractValidationFields,
  isErrorCode,
  resolveErrorMessage,
  type ApiError,
  type ApiResponse,
  type KnownErrorCode,
  type RejectedCategoryDetail,
  type ValidationFieldIssue,
} from "@/lib/api-errors";
export { authClient } from "@/lib/auth-client";
export {
  executeSingleFlightRefresh,
  notifySessionUnauthorized,
  registerAuthLifecycleHandlers,
} from "@/lib/auth-token-store";
export { buildApiUrl, env } from "@/lib/env";
export {
  canonicalCategoryKey,
  type CategoryValidationErrorReason,
  type CategoryValidationResult,
  cleanCategoryName,
  MAX_CATEGORY_LENGTH,
  MIN_CATEGORY_LENGTH,
  validateCategoryInput,
} from "@/lib/category-validation";
export { apiRequest, httpClient } from "@/lib/http-client";
export {
  AI_TIMEOUT_MS,
  DEFAULT_TIMEOUT_MS,
  isAbortError,
} from "@/lib/http-core";
export {
  cleanLookupSelection,
  cleanLookupWord,
  computeNextTokenSpan,
  countWords,
  estimateReadingMinutes,
  extractSalientVocabulary,
  findTokenSpanInParagraphs,
  formatReadingDate,
  formatReadingLanguageBadge,
  getDateLocale,
  getDifficultyMeta,
  getSpeechLocale,
  MAX_LOOKUP_SELECTION_CHARS,
  type ParagraphTokenSpan,
  resolveSpanSelectionText,
  tokenizeReadingParagraph,
} from "@/lib/reading-utils";
export * from "@/lib/services";
export {
  dolyStripeAppearance,
  formatBillingAmount,
  getStripePromise,
} from "@/lib/stripe-appearance";
export {
  DEFAULT_DIFFICULTIES,
  DEFAULT_LANGUAGES,
  DEFAULT_SIZES,
  DEFAULT_STUDY_PARAMETERS,
  studyClient,
  type CatalogCategory,
  type DifficultyOption,
  type LanguageOption,
  type StudyParameters,
} from "@/lib/study-client";
