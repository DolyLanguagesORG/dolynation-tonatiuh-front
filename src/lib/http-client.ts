import {
  ApiClientError,
  type ApiResponse,
  ErrorCode,
} from "@/lib/api-errors";
import { buildApiUrl, env } from "@/lib/env";

export interface HttpRequestOptions extends Omit<RequestInit, "body"> {
  /**
   * Parámetros de consulta que se serializan en la URL.
   */
  query?: Record<string, string | number | boolean | undefined | null>;
  /**
   * Cuerpo de la petición; si es un objeto plano se serializa como JSON automáticamente.
   */
  body?: unknown;
  /**
   * Token JWT opcional para adjuntar en `Authorization: Bearer <token>`.
   */
  accessToken?: string | null;
  /**
   * Tiempo máximo de espera en milisegundos (por defecto 15 000 ms).
   */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;

function isJsonEnvelope<T>(payload: unknown): payload is ApiResponse<T> {
  return (
    typeof payload === "object" &&
    payload !== null &&
    ("message" in payload || "data" in payload || "error" in payload)
  );
}

/**
 * Ejecuta una petición HTTP hacia el backend de DolyNation (`NEXT_PUBLIC_API_BASE_URL`),
 * desempaquetando el envelope `ApiResponse<T>` y normalizando cualquier fallo en `ApiClientError`.
 */
export async function apiRequest<T>(
  path: string,
  options: HttpRequestOptions = {},
): Promise<ApiResponse<T>> {
  if (!env.isApiConfigured && !path.startsWith("http")) {
    throw new ApiClientError({
      code: ErrorCode.CONFIG_ERROR,
      status: 0,
    });
  }

  const {
    query,
    body,
    accessToken,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    headers: customHeaders,
    signal: externalSignal,
    ...restInit
  } = options;

  const url = path.startsWith("http") ? path : buildApiUrl(path, query);
  const headers = new Headers(customHeaders);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  if (body !== undefined && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
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
      ...restInit,
      headers,
      body: serializedBody,
      signal: controller.signal,
    });

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
          code:
            apiError?.code ??
            (response.status === 401
              ? ErrorCode.AUTH_UNAUTHORIZED
              : response.status === 404
                ? ErrorCode.RESOURCE_NOT_FOUND
                : ErrorCode.INTERNAL_ERROR),
          message: apiError?.message ?? parsedBody.message,
          status: response.status,
          details: apiError?.details,
        });
      }

      return parsedBody;
    }

    if (!response.ok) {
      throw new ApiClientError({
        code:
          response.status === 401
            ? ErrorCode.AUTH_UNAUTHORIZED
            : response.status === 403
              ? ErrorCode.RESOURCE_FORBIDDEN
              : response.status === 404
                ? ErrorCode.RESOURCE_NOT_FOUND
                : response.status >= 500
                  ? ErrorCode.INTERNAL_ERROR
                  : ErrorCode.UNKNOWN_ERROR,
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
      details:
        error instanceof Error ? { cause: error.message } : undefined,
    });
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener("abort", onExternalAbort);
    }
  }
}

/**
 * Cliente HTTP base para consumir `dolynation-atl-back`.
 */
export const httpClient = {
  request: apiRequest,

  get<T>(
    path: string,
    options?: Omit<HttpRequestOptions, "method" | "body">,
  ): Promise<ApiResponse<T>> {
    return apiRequest<T>(path, { ...options, method: "GET" });
  },

  post<T>(
    path: string,
    body?: unknown,
    options?: Omit<HttpRequestOptions, "method" | "body">,
  ): Promise<ApiResponse<T>> {
    return apiRequest<T>(path, { ...options, method: "POST", body });
  },

  put<T>(
    path: string,
    body?: unknown,
    options?: Omit<HttpRequestOptions, "method" | "body">,
  ): Promise<ApiResponse<T>> {
    return apiRequest<T>(path, { ...options, method: "PUT", body });
  },

  patch<T>(
    path: string,
    body?: unknown,
    options?: Omit<HttpRequestOptions, "method" | "body">,
  ): Promise<ApiResponse<T>> {
    return apiRequest<T>(path, { ...options, method: "PATCH", body });
  },

  delete<T>(
    path: string,
    options?: Omit<HttpRequestOptions, "method">,
  ): Promise<ApiResponse<T>> {
    return apiRequest<T>(path, { ...options, method: "DELETE" });
  },
} as const;
