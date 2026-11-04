export { buildApiUrl, env } from "@/lib/env";
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
  apiRequest,
  httpClient,
  type HttpRequestOptions,
} from "@/lib/http-client";
