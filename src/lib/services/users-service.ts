import {
  type ApiRequestOptions,
  type ApiTransport,
  type StreakQuery,
  type StreakResponse,
  type UpdateProfileInput,
  type UserProfile,
} from "@/lib/api-contracts";
import { type ApiResponse } from "@/lib/api-errors";
import { httpClient } from "@/lib/http-client";

export type UsersRequestOptions = Omit<ApiRequestOptions, "method" | "body">;

/**
 * Crea el servicio de perfil y racha del usuario sobre un transporte dado.
 */
export function createUsersService(transport: ApiTransport) {
  return {
    /** Obtiene el perfil completo del usuario autenticado incluyendo idiomas seleccionados. */
    getProfile(options?: UsersRequestOptions): Promise<ApiResponse<UserProfile>> {
      return transport.get<UserProfile>("/user/profile", options);
    },

    /** Actualiza los campos editables del perfil del usuario autenticado. */
    updateProfile(
      input: UpdateProfileInput,
      options?: UsersRequestOptions,
    ): Promise<ApiResponse<UserProfile>> {
      return transport.patch<UserProfile>("/user/profile", input, options);
    },

    /** Devuelve los días recientes de racha activa dentro de la ventana solicitada. */
    getStreak(
      query: StreakQuery,
      options?: UsersRequestOptions,
    ): Promise<ApiResponse<StreakResponse>> {
      return transport.get<StreakResponse>("/user/streak", {
        ...options,
        query: { days: query.days, ...options?.query },
      });
    },
  };
}

/** Instancia de cliente para usar en Client Components vía proxy BFF (`/api/v1/user/*`). */
export const usersService = createUsersService(httpClient);
