export {
  ApiClientError,
  type ApiError,
  type ApiResponse,
  ErrorCode,
  extractValidationFields,
  type KnownErrorCode,
  resolveErrorMessage,
  type ValidationFieldIssue,
} from "@/lib/api-errors";
export {
  authClient,
  type AuthSessionPayload,
  type AuthTokens,
  type AuthUser,
  type LoginInput,
  type RegisterInput,
} from "@/lib/auth-client";
export {
  clearAuthTokens,
  executeSingleFlightRefresh,
  getAccessToken,
  getRefreshToken,
  notifySessionUnauthorized,
  registerAuthLifecycleHandlers,
  setAuthTokens,
  type TokenPair,
} from "@/lib/auth-token-store";
export { buildApiUrl, env } from "@/lib/env";
export {
  apiRequest,
  httpClient,
  type HttpRequestOptions,
} from "@/lib/http-client";
export {
  DEFAULT_CATEGORIES,
  DEFAULT_DIFFICULTIES,
  DEFAULT_LANGUAGES,
  DEFAULT_SIZES,
  studyClient,
  type CatalogCategory,
  type DifficultyOption,
  type ReadingDifficulty,
  type ReadingDto,
  type ReadingSize,
  type ReadingSizeOption,
  type StudyParameters,
  type TargetLanguageCode,
} from "@/lib/study-client";
