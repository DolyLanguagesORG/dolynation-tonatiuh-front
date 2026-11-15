import {
  type ApiRequestOptions,
  type QueryParams,
} from "@/lib/api-contracts";
import {
  ApiClientError,
  type ApiResponse,
  ErrorCode,
} from "@/lib/api-errors";

/**
 * Tiempo máximo de espera estándar para endpoints REST rápidos (15 s).
 */
export const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Tiempo máximo de espera para endpoints respaldados por IA generativa (110 s,
 * alineado con `MINIMAX_TIMEOUT_MS = 90 000` en `dolynation-atl-back`).
 */
export const AI_TIMEOUT_MS = 110_000;

/**
 * Comprueba si un objeto recibido responde al sobre canónico `{ message, data, error }`.
 */
export function isJsonEnvelope<T>(payload: unknown): payload is ApiResponse<T> {
  return (
    typeof payload === "object" &&
    payload !== null &&
    ("message" in payload || "data" in payload || "error" in payload)
  );
}

/**
 * Construye una URL completa concatenando ruta relativa y parámetros query definidos.
 */
export function appendQueryParams(url: string, query?: QueryParams): string {
  if (!query) {
    return url;
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  if (!queryString) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${queryString}`;
}

/**
 * Mapea códigos HTTP no envueltos al catálogo oficial `ErrorCode`.
 */
export function resolveFallbackErrorCode(status: number): ErrorCodeValue {
  if (status === 401) return ErrorCode.AUTH_UNAUTHORIZED;
  if (status === 403) return ErrorCode.RESOURCE_FORBIDDEN;
  if (status === 404) return ErrorCode.RESOURCE_NOT_FOUND;
  if (status === 429) return ErrorCode.READING_DAILY_LIMIT_REACHED;
  if (status >= 500) return ErrorCode.INTERNAL_ERROR;
  return ErrorCode.UNKNOWN_ERROR;
}

type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ExecuteFetchHooks {
  onUnauthorized?: () => Promise<boolean>;
}

/**
 * Ejecuta una petición HTTP con timeout, propagación de abortos y desempaquetado
 * uniforme del envelope `{ message, data, error }` de `dolynation-atl-back`.
 */
export async function executeEnvelopeFetch<T>(
  url: string,
  options: ApiRequestOptions & { method?: string } = {},
  hooks?: ExecuteFetchHooks,
): Promise<ApiResponse<T>> {
  const {
    body,
    accessToken,
    skipAuth = false,
    _isRetryAfterRefresh = false,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    headers: customHeaders,
    signal: externalSignal,
    next,
    cache,
    credentials,
    mode,
    redirect,
    referrer,
    referrerPolicy,
    integrity,
    keepalive,
    method,
  } = options;

  const headers = new Headers(customHeaders);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  if (body !== undefined && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!skipAuth && accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const onExternalAbort = (): void => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", onExternalAbort, { once: true });
    }
  }

  try {
    const serializedBody: BodyInit | undefined =
      body === undefined
        ? undefined
        : isFormData || typeof body === "string"
          ? (body as BodyInit)
          : JSON.stringify(body);

    const response = await fetch(url, {
      method,
      cache,
      credentials,
      mode,
      redirect,
      referrer,
      referrerPolicy,
      integrity,
      keepalive,
      ...(next !== undefined ? { next } : {}),
      headers,
      body: serializedBody,
      signal: controller.signal,
    });

    if (
      response.status === 401 &&
      !skipAuth &&
      !_isRetryAfterRefresh &&
      hooks?.onUnauthorized
    ) {
      const recovered = await hooks.onUnauthorized();
      if (recovered) {
        return executeEnvelopeFetch<T>(
          url,
          { ...options, _isRetryAfterRefresh: true },
          hooks,
        );
      }
    }

    if (
      response.status === 204 ||
      response.status === 205 ||
      response.status === 304
    ) {
      return {
        message: "OK",
        data: null as T,
      };
    }

    const contentType = response.headers.get("content-type") ?? "";
    let parsedBody: unknown = null;

    if (contentType.includes("application/json")) {
      parsedBody = await response.json();
    } else {
      const rawText = await response.text();
      parsedBody = rawText ? { message: rawText, data: null } : null;
    }

    if (isJsonEnvelope<T>(parsedBody)) {
      if (parsedBody.error || !response.ok) {
        const apiError = parsedBody.error;
        throw new ApiClientError({
          code: apiError?.code ?? resolveFallbackErrorCode(response.status),
          message: apiError?.message ?? parsedBody.message,
          status: response.status,
          details: apiError?.details,
        });
      }

      return parsedBody;
    }

    if (!response.ok) {
      throw new ApiClientError({
        code: resolveFallbackErrorCode(response.status),
        status: response.status,
      });
    }

    return {
      message: "OK",
      data: parsedBody as T,
    };
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    throw new ApiClientError({
      code: ErrorCode.NETWORK_ERROR,
      status: 0,
      details: error instanceof Error ? { cause: error.message } : undefined,
    });
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener("abort", onExternalAbort);
    }
  }
}
