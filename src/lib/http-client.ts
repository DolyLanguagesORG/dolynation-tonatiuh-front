import {
  type ApiRequestOptions,
  type ApiTransport,
} from "@/lib/api-contracts";
import {
  ApiClientError,
  type ApiResponse,
  ErrorCode,
} from "@/lib/api-errors";
import {
  executeSingleFlightRefresh,
  notifySessionUnauthorized,
} from "@/lib/auth-token-store";
import { buildApiUrl, env } from "@/lib/env";
import { executeEnvelopeFetch } from "@/lib/http-core";

export type HttpRequestOptions = ApiRequestOptions;

/**
 * Ejecuta una petición HTTP hacia el backend de DolyNation **a través del
 * proxy BFF de Next.js** (`/api/v1/...`), desempaquetando el envelope
 * `ApiResponse<T>` y normalizando cualquier fallo en `ApiClientError`.
 *
 * Seguridad:
 * - El navegador nunca recibe `BACKEND_INTERNAL_URL` ni los JWTs en claro;
 *   el proxy `/api/v1/[...path]` lee e inyecta las cookies `HttpOnly` en el servidor.
 * - Incluye respaldo single-flight en cliente por si la sesión requiere limpieza
 *   y redirección a `/login` tras una respuesta `401` definitiva.
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponse<T>> {
  if (!env.isApiConfigured && !path.startsWith("http")) {
    throw new ApiClientError({
      code: ErrorCode.CONFIG_ERROR,
      status: 0,
    });
  }

  const url = path.startsWith("http")
    ? path
    : buildApiUrl(path, options.query);

  return executeEnvelopeFetch<T>(
    url,
    {
      credentials: "same-origin",
      ...options,
    },
    {
      onUnauthorized: async () => {
        const refreshed = await executeSingleFlightRefresh();
        if (!refreshed) {
          notifySessionUnauthorized();
          return false;
        }
        return true;
      },
    },
  );
}

/**
 * Cliente HTTP base para consumir `dolynation-atl-back` vía proxy BFF `/api/v1`.
 */
export const httpClient: ApiTransport = {
  request: apiRequest,

  get<T>(
    path: string,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ): Promise<ApiResponse<T>> {
    return apiRequest<T>(path, { ...options, method: "GET" });
  },

  post<T>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ): Promise<ApiResponse<T>> {
    return apiRequest<T>(path, { ...options, method: "POST", body });
  },

  put<T>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ): Promise<ApiResponse<T>> {
    return apiRequest<T>(path, { ...options, method: "PUT", body });
  },

  patch<T>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ): Promise<ApiResponse<T>> {
    return apiRequest<T>(path, { ...options, method: "PATCH", body });
  },

  delete<T>(
    path: string,
    options?: Omit<ApiRequestOptions, "method">,
  ): Promise<ApiResponse<T>> {
    return apiRequest<T>(path, { ...options, method: "DELETE" });
  },
};
