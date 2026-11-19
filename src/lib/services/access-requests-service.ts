import {
  type AccessRequestItem,
  type ApiRequestOptions,
  type ApiTransport,
  type CreateAccessRequestInput,
  type MyAccessRequestsResponse,
} from "@/lib/api-contracts";
import { type ApiResponse } from "@/lib/api-errors";
import { httpClient } from "@/lib/http-client";

export type AccessRequestsOptions = Omit<ApiRequestOptions, "method" | "body">;

/**
 * Crea el servicio de solicitudes manuales de acceso (`/access-requests`).
 */
export function createAccessRequestsService(transport: ApiTransport) {
  return {
    /** Obtiene las solicitudes del usuario autenticado y si el modo lista de espera está activo. */
    getMyRequests(
      options?: AccessRequestsOptions,
    ): Promise<ApiResponse<MyAccessRequestsResponse>> {
      return transport.get<MyAccessRequestsResponse>(
        "/access-requests/me",
        options,
      );
    },

    /** Crea una solicitud de suscripción o desbloqueo de cambio de idioma. */
    createRequest(
      input: CreateAccessRequestInput,
      options?: AccessRequestsOptions,
    ): Promise<ApiResponse<AccessRequestItem>> {
      return transport.post<AccessRequestItem>(
        "/access-requests",
        input,
        options,
      );
    },

    /** Cancela una solicitud pendiente perteneciente al usuario autenticado. */
    cancelRequest(
      id: number,
      options?: AccessRequestsOptions,
    ): Promise<ApiResponse<AccessRequestItem>> {
      return transport.delete<AccessRequestItem>(
        `/access-requests/${encodeURIComponent(String(id))}`,
        options,
      );
    },
  };
}

/** Instancia de cliente para gestionar solicitudes manuales de acceso en el navegador. */
export const accessRequestsService = createAccessRequestsService(httpClient);
