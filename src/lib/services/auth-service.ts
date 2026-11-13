import {
  type ApiRequestOptions,
  type ApiTransport,
  type AuthSessionPayload,
  type AuthUser,
  type LoginInput,
  type RefreshSessionResponse,
  type RefreshTokenInput,
  type RegisterInput,
} from "@/lib/api-contracts";
import { type ApiResponse } from "@/lib/api-errors";
import { httpClient } from "@/lib/http-client";

export type AuthRequestOptions = Omit<ApiRequestOptions, "method" | "body">;

/**
 * Crea el servicio de autenticación sobre un transporte dado (cliente BFF o servidor SSR).
 */
export function createAuthService(transport: ApiTransport) {
  return {
    /** Registra una cuenta nueva; en modo BFF los tokens quedan en cookies `HttpOnly`. */
    register(
      input: RegisterInput,
      options?: AuthRequestOptions,
    ): Promise<ApiResponse<AuthSessionPayload>> {
      return transport.post<AuthSessionPayload>("/auth/register", input, {
        skipAuth: true,
        ...options,
      });
    },

    /** Inicia sesión con correo y contraseña y establece la sesión en cookies `HttpOnly`. */
    login(
      input: LoginInput,
      options?: AuthRequestOptions,
    ): Promise<ApiResponse<AuthSessionPayload>> {
      return transport.post<AuthSessionPayload>("/auth/login", input, {
        skipAuth: true,
        ...options,
      });
    },

    /** Rota los tokens de sesión usando la cookie `doly_refresh_token` o un token explícito. */
    refresh(
      input?: RefreshTokenInput,
      options?: AuthRequestOptions,
    ): Promise<ApiResponse<RefreshSessionResponse>> {
      return transport.post<RefreshSessionResponse>(
        "/auth/refresh",
        input ?? {},
        {
          skipAuth: true,
          ...options,
        },
      );
    },

    /** Cierra la sesión actual e invalida su refresh token en servidor y cookies. */
    logout(
      input?: RefreshTokenInput,
      options?: AuthRequestOptions,
    ): Promise<ApiResponse<null>> {
      return transport.post<null>("/auth/logout", input ?? {}, options);
    },

    /** Cierra todas las sesiones activas del usuario y limpia las cookies del navegador. */
    logoutAll(options?: AuthRequestOptions): Promise<ApiResponse<null>> {
      return transport.post<null>("/auth/logout-all", undefined, options);
    },

    /** Obtiene el perfil público básico del usuario autenticado actual. */
    me(options?: AuthRequestOptions): Promise<ApiResponse<AuthUser>> {
      return transport.get<AuthUser>("/auth/me", options);
    },
  };
}

/** Instancia de cliente para usar en Client Components vía proxy BFF (`/api/v1/auth/*`). */
export const authService = createAuthService(httpClient);
