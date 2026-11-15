import {
  type AuthSessionPayload,
  type AuthUser,
  type EmailSentResponse,
  type LoginInput,
  type RefreshSessionResponse,
  type RefreshTokenInput,
  type RegisterInput,
  type ResendVerificationInput,
  type VerifyEmailInput,
  type VerifyEmailResponse,
} from "@/lib/api-contracts";
import { type ApiResponse } from "@/lib/api-errors";
import { authService, type AuthRequestOptions } from "@/lib/services/auth-service";

export type {
  AuthSessionPayload,
  AuthUser,
  LoginInput,
  RefreshSessionResponse,
  RefreshTokenInput,
  RegisterInput,
};

/**
 * Fachada de compatibilidad para flujos de autenticación en el navegador.
 * Toda comunicación pasa por `/api/v1/auth/*` con cookies `HttpOnly` gestionadas
 * por el servidor BFF; nunca se almacenan tokens JWT en `localStorage`.
 */
export const authClient = {
  register(
    input: RegisterInput,
    options?: AuthRequestOptions,
  ): Promise<ApiResponse<AuthSessionPayload>> {
    return authService.register(input, options);
  },

  login(
    input: LoginInput,
    options?: AuthRequestOptions,
  ): Promise<ApiResponse<AuthSessionPayload>> {
    return authService.login(input, options);
  },

  refresh(
    input?: RefreshTokenInput,
    options?: AuthRequestOptions,
  ): Promise<ApiResponse<RefreshSessionResponse>> {
    return authService.refresh(input, options);
  },

  logout(
    input?: RefreshTokenInput,
    options?: AuthRequestOptions,
  ): Promise<ApiResponse<null>> {
    return authService.logout(input, options);
  },

  logoutAll(options?: AuthRequestOptions): Promise<ApiResponse<null>> {
    return authService.logoutAll(options);
  },

  me(options?: AuthRequestOptions): Promise<ApiResponse<AuthUser>> {
    return authService.me(options);
  },

  verifyEmail(
    input: VerifyEmailInput,
    options?: AuthRequestOptions,
  ): Promise<ApiResponse<VerifyEmailResponse>> {
    return authService.verifyEmail(input, options);
  },

  resendVerification(
    input: ResendVerificationInput,
    options?: AuthRequestOptions,
  ): Promise<ApiResponse<EmailSentResponse>> {
    return authService.resendVerification(input, options);
  },
};
