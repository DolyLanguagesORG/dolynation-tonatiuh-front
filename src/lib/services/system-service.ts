import {
  type ApiRequestOptions,
  type ApiTransport,
  type AppVersionInfo,
  type HealthCheckResult,
} from "@/lib/api-contracts";
import { type ApiResponse } from "@/lib/api-errors";
import { httpClient } from "@/lib/http-client";

export type SystemRequestOptions = Omit<ApiRequestOptions, "method" | "body">;

/**
 * Crea el servicio público de observabilidad, salud y versión (`/health`, `/version`).
 */
export function createSystemService(transport: ApiTransport) {
  return {
    /** Sonda de vida (liveness) del proceso backend. */
    getHealthLive(
      options?: SystemRequestOptions,
    ): Promise<ApiResponse<HealthCheckResult>> {
      return transport.get<HealthCheckResult>("/health/live", {
        skipAuth: true,
        ...options,
      });
    },

    /** Sonda de disponibilidad (readiness) incluyendo conexión a base de datos. */
    getHealthReady(
      options?: SystemRequestOptions,
    ): Promise<ApiResponse<HealthCheckResult>> {
      return transport.get<HealthCheckResult>("/health/ready", {
        skipAuth: true,
        ...options,
      });
    },

    /** Devuelve versión de la aplicación, repositorio, commit y build del backend. */
    getVersion(
      options?: SystemRequestOptions,
    ): Promise<ApiResponse<AppVersionInfo>> {
      return transport.get<AppVersionInfo>("/version", {
        skipAuth: true,
        ...options,
      });
    },
  };
}

/** Instancia de cliente para consultar salud y versión del backend vía BFF. */
export const systemService = createSystemService(httpClient);
