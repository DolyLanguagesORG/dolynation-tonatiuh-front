import {
  type AdminCategory,
  type AdminUserRow,
  type ApiRequestOptions,
  type ApiTransport,
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

    /** Lista los usuarios registrados recientes para supervisión administrativa. */
    listUsers(
      options?: AdminRequestOptions,
    ): Promise<ApiResponse<AdminUserRow[]>> {
      return transport.get<AdminUserRow[]>("/admin/users", options);
    },
  };
}

/** Instancia de cliente para vistas de administración en el navegador. */
export const adminService = createAdminService(httpClient);
