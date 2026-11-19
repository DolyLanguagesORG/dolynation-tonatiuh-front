import {
  type AdminAccessRequest,
  type AdminCategory,
  type AdminRequestsQuery,
  type AdminUserDetail,
  type AdminUserRow,
  type AdminUsersQuery,
  type ApiRequestOptions,
  type ApiTransport,
  type ApproveAccessRequestInput,
  type RejectAccessRequestInput,
  type ReviewAccessRequestResponse,
} from "@/lib/api-contracts";
import { type ApiResponse } from "@/lib/api-errors";
import { httpClient } from "@/lib/http-client";

export type AdminRequestOptions = Omit<ApiRequestOptions, "method" | "body">;

/**
 * Crea el servicio de supervisión administrativa (`/admin`).
 */
export function createAdminService(transport: ApiTransport) {
  return {
    /** Lista el catálogo global de categorías y subcategorías (solo administradores). */
    listCategories(
      options?: AdminRequestOptions,
    ): Promise<ApiResponse<AdminCategory[]>> {
      return transport.get<AdminCategory[]>("/admin/categories", options);
    },

    /** Lista los usuarios registrados para supervisión y revisión administrativa. */
    listUsers(
      query?: AdminUsersQuery,
      options?: AdminRequestOptions,
    ): Promise<ApiResponse<AdminUserRow[]>> {
      return transport.get<AdminUserRow[]>("/admin/users", {
        ...options,
        query,
      });
    },

    /** Obtiene el detalle de un usuario específico y su historial de solicitudes. */
    getUserDetail(
      id: number,
      options?: AdminRequestOptions,
    ): Promise<ApiResponse<AdminUserDetail>> {
      return transport.get<AdminUserDetail>(
        `/admin/users/${encodeURIComponent(String(id))}`,
        options,
      );
    },

    /** Lista las solicitudes de acceso (planes y desbloqueo de idioma) filtrables. */
    listRequests(
      query?: AdminRequestsQuery,
      options?: AdminRequestOptions,
    ): Promise<ApiResponse<AdminAccessRequest[]>> {
      return transport.get<AdminAccessRequest[]>("/admin/requests", {
        ...options,
        query,
      });
    },

    /** Aprueba una solicitud pendiente, activa su beneficio y envía correo al usuario. */
    approveRequest(
      id: number,
      input: ApproveAccessRequestInput = {},
      options?: AdminRequestOptions,
    ): Promise<ApiResponse<ReviewAccessRequestResponse>> {
      return transport.post<ReviewAccessRequestResponse>(
        `/admin/requests/${encodeURIComponent(String(id))}/approve`,
        input,
        options,
      );
    },

    /** Rechaza una solicitud pendiente indicando el motivo obligatorio por correo. */
    rejectRequest(
      id: number,
      input: RejectAccessRequestInput,
      options?: AdminRequestOptions,
    ): Promise<ApiResponse<ReviewAccessRequestResponse>> {
      return transport.post<ReviewAccessRequestResponse>(
        `/admin/requests/${encodeURIComponent(String(id))}/reject`,
        input,
        options,
      );
    },
  };
}

/** Instancia de cliente para vistas de administración en el navegador. */
export const adminService = createAdminService(httpClient);
