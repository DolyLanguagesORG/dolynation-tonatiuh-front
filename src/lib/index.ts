export * from "@/lib/api-contracts";
export {
  ApiClientError,
  ErrorCode,
  extractValidationFields,
  isErrorCode,
  resolveErrorMessage,
  type ApiError,
  type ApiResponse,
  type KnownErrorCode,
  type ValidationFieldIssue,
} from "@/lib/api-errors";
export { authClient } from "@/lib/auth-client";
export {
  executeSingleFlightRefresh,
  notifySessionUnauthorized,
  registerAuthLifecycleHandlers,
} from "@/lib/auth-token-store";
export { buildApiUrl, env } from "@/lib/env";
export { apiRequest, httpClient } from "@/lib/http-client";
export { AI_TIMEOUT_MS, DEFAULT_TIMEOUT_MS } from "@/lib/http-core";
export {
  cleanLookupWord,
  countWords,
  estimateReadingMinutes,
  extractSalientVocabulary,
  formatReadingDate,
  formatReadingLanguageBadge,
  getDifficultyMeta,
  getSpeechLocale,
} from "@/lib/reading-utils";
export * from "@/lib/services";
export {
  DEFAULT_CATEGORIES,
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
