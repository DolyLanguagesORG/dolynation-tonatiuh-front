import {
  type ApiRequestOptions,
  type ApiTransport,
  type AuthSessionPayload,
  type AuthUser,
  type EmailSentResponse,
  type ForgotPasswordInput,
  type LoginInput,
  type RefreshSessionResponse,
  type RefreshTokenInput,
  type RegisterInput,
  type ResendVerificationInput,
  type ResetPasswordInput,
  type VerifyEmailInput,
  type VerifyEmailResponse,
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
    /** Devuelve el perfil público del usuario autenticado actual. */
    me(options?: AuthRequestOptions): Promise<ApiResponse<AuthUser>> {
      return transport.get<AuthUser>("/auth/me", options);
    },

    /** Confirma el correo mediante token firmado y emite cookies de sesión BFF. */
    verifyEmail(
      input: VerifyEmailInput,
      options?: AuthRequestOptions,
    ): Promise<ApiResponse<VerifyEmailResponse>> {
      return transport.post<VerifyEmailResponse>("/auth/verify-email", input, {
        skipAuth: true,
        ...options,
      });
    },

    /** Reenvía el enlace firmado de confirmación al correo pendiente. */
    resendVerification(
      input: ResendVerificationInput,
      options?: AuthRequestOptions,
    ): Promise<ApiResponse<EmailSentResponse>> {
      return transport.post<EmailSentResponse>(
        "/auth/resend-verification",
        input,
        {
          skipAuth: true,
          ...options,
        },
      );
    },

    /** Solicita correo de restablecimiento de contraseña. */
    forgotPassword(
      input: ForgotPasswordInput,
      options?: AuthRequestOptions,
    ): Promise<ApiResponse<EmailSentResponse>> {
      return transport.post<EmailSentResponse>("/auth/forgot-password", input, {
        skipAuth: true,
        ...options,
      });
    },

    /** Actualiza la contraseña utilizando un token de restablecimiento válido. */
    resetPassword(
      input: ResetPasswordInput,
      options?: AuthRequestOptions,
    ): Promise<ApiResponse<{ passwordUpdated: boolean }>> {
      return transport.post<{ passwordUpdated: boolean }>(
        "/auth/reset-password",
        input,
        {
          skipAuth: true,
          ...options,
        },
      );
    },
  };
}

/** Instancia de cliente para usar en Client Components vía proxy BFF (`/api/v1/auth/*`). */
export const authService = createAuthService(httpClient);
