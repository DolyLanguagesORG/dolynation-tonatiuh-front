import { type ApiResponse } from "@/lib/api-errors";
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from "@/lib/auth-token-store";
import { httpClient } from "@/lib/http-client";

/**
 * Representación pública del estudiante autenticado (`PublicUser` en `dolynation-atl-back`).
 */
export interface AuthUser {
  id: number;
  email: string;
  fullName: string | null;
  currentStreak: number;
  lastStreakDate: string | null;
  createdAt: string;
}

/**
 * Par de tokens emitido por `dolynation-atl-back` (`AuthTokens`).
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Respuesta de `POST /auth/register` y `POST /auth/login`.
 */
export interface AuthSessionPayload {
  user: AuthUser;
  tokens: AuthTokens;
}

/**
 * Payload estricto de `POST /auth/register` (`RegisterDto`).
 * El backend valida con `forbidNonWhitelisted: true`, por lo que solo se envían
 * las propiedades declaradas en el contrato.
 */
export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
}

/**
 * Payload estricto de `POST /auth/login` (`LoginDto`).
 */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Cliente de autenticación conectado a `back#4` (`/api/v1/auth/*`).
 */
export const authClient = {
  /**
   * Registra una nueva cuenta de estudiante (`POST /api/v1/auth/register`)
   * y almacena el `accessToken` en memoria.
   */
  async register(
    input: RegisterInput,
  ): Promise<ApiResponse<AuthSessionPayload>> {
    const payload: RegisterInput = {
      email: input.email.trim().toLowerCase(),
      password: input.password,
      fullName: input.fullName.trim(),
    };

    const response = await httpClient.post<AuthSessionPayload>(
      "/auth/register",
      payload,
      { skipAuth: true },
    );

    if (response.data?.tokens?.accessToken) {
      setAuthTokens({
        accessToken: response.data.tokens.accessToken,
        refreshToken: response.data.tokens.refreshToken,
      });
    }

    return response;
  },

  /**
   * Inicia sesión con correo y contraseña (`POST /api/v1/auth/login`)
   * y almacena el `accessToken` en memoria.
   */
  async login(input: LoginInput): Promise<ApiResponse<AuthSessionPayload>> {
    const payload: LoginInput = {
      email: input.email.trim().toLowerCase(),
      password: input.password,
    };

    const response = await httpClient.post<AuthSessionPayload>(
      "/auth/login",
      payload,
      { skipAuth: true },
    );

    if (response.data?.tokens?.accessToken) {
      setAuthTokens({
        accessToken: response.data.tokens.accessToken,
        refreshToken: response.data.tokens.refreshToken,
      });
    }

    return response;
  },

  /**
   * Renueva el par de tokens (`POST /api/v1/auth/refresh`).
   * Si existe `refreshToken` en memoria lo envía en el body; de lo contrario
   * envía `{}` para que el proxy BFF de Next.js inyecte la cookie `HttpOnly`.
   */
  async refresh(
    explicitRefreshToken?: string | null,
  ): Promise<ApiResponse<AuthTokens>> {
    const tokenToSend = explicitRefreshToken ?? getRefreshToken();
    const body = tokenToSend ? { refreshToken: tokenToSend } : {};

    const response = await httpClient.post<AuthTokens>("/auth/refresh", body, {
      skipAuth: true,
    });

    if (response.data?.accessToken) {
      setAuthTokens({
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      });
    }

    return response;
  },

  /**
   * Cierra la sesión activa (`POST /api/v1/auth/logout`) e invalida los tokens
   * tanto en el backend/proxy como en la memoria local.
   */
  async logout(explicitAccessToken?: string | null): Promise<void> {
    const token = explicitAccessToken ?? getAccessToken();
    try {
      await httpClient.post<null>(
        "/auth/logout",
        undefined,
        {
          accessToken: token,
          _isRetryAfterRefresh: true,
        },
      );
    } finally {
      clearAuthTokens();
    }
  },

  /**
   * Obtiene el perfil del usuario autenticado (`GET /api/v1/auth/me`).
   */
  async me(
    explicitAccessToken?: string | null,
  ): Promise<ApiResponse<AuthUser>> {
    return httpClient.get<AuthUser>("/auth/me", {
      ...(explicitAccessToken !== undefined
        ? { accessToken: explicitAccessToken }
        : {}),
    });
  },
} as const;
