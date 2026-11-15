import "server-only";

import { cookies } from "next/headers";

import {
  type ApiRequestOptions,
  type ApiTransport,
} from "@/lib/api-contracts";
import { ApiClientError, type ApiResponse, ErrorCode } from "@/lib/api-errors";
import { appendQueryParams, executeEnvelopeFetch } from "@/lib/http-core";
import { ACCESS_COOKIE_NAME } from "@/lib/server/auth-cookies";
import { backendInternalUrl } from "@/lib/server/backend-url";

/**
 * Construye una URL interna hacia `BACKEND_INTERNAL_URL` sin exponerla nunca al navegador.
 */
function buildBackendTargetUrl(
  path: string,
  query?: ApiRequestOptions["query"],
): string {
  const base = backendInternalUrl.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return appendQueryParams(`${base}${cleanPath}`, query);
}

/**
 * Ejecuta una petición directa desde un Next.js Server Component / Server Action
 * hacia `BACKEND_INTERNAL_URL` leyendo automáticamente `doly_access_token` desde las
 * cookies `HttpOnly` de la petición entrante.
 *
 * Seguridad:
 * - Marcado con `import "server-only"` (falla el build si un Client Component lo importa).
 * - Sanitiza cualquier error de red para impedir fugas del host/puerto interno.
 */
export async function serverApiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponse<T>> {
  let targetUrl: string;
  try {
    targetUrl = buildBackendTargetUrl(path, options.query);
  } catch {
    throw new ApiClientError({
      code: ErrorCode.CONFIG_ERROR,
      status: 500,
    });
  }

  let resolvedToken = options.accessToken ?? null;
  if (options.accessToken === undefined && !options.skipAuth) {
    try {
      const cookieStore = await cookies();
      resolvedToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value ?? null;
    } catch {
      resolvedToken = null;
    }
  }

  const defaultCache =
    options.next || options.cache ? options.cache : "no-store";

  try {
    return await executeEnvelopeFetch<T>(targetUrl, {
      ...options,
      accessToken: resolvedToken,
      cache: defaultCache,
    });
  } catch (error) {
    if (error instanceof ApiClientError && error.code === ErrorCode.NETWORK_ERROR) {
      // Omitimos cualquier detalle técnico (host/puerto interno) en errores SSR.
      throw new ApiClientError({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        status: 503,
      });
    }
    throw error;
  }
}

/**
 * Transporte `server-only` para invocar servicios de negocio dentro de Server Components.
 */
export const serverHttpClient: ApiTransport = {
  request: serverApiRequest,

  get<T>(
    path: string,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ): Promise<ApiResponse<T>> {
    return serverApiRequest<T>(path, { ...options, method: "GET" });
  },

  post<T>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ): Promise<ApiResponse<T>> {
    return serverApiRequest<T>(path, { ...options, method: "POST", body });
  },

  put<T>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ): Promise<ApiResponse<T>> {
    return serverApiRequest<T>(path, { ...options, method: "PUT", body });
  },

  patch<T>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ): Promise<ApiResponse<T>> {
    return serverApiRequest<T>(path, { ...options, method: "PATCH", body });
  },

  delete<T>(
    path: string,
    options?: Omit<ApiRequestOptions, "method">,
  ): Promise<ApiResponse<T>> {
    return serverApiRequest<T>(path, { ...options, method: "DELETE" });
  },
};
