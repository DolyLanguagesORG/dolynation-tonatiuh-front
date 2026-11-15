import "server-only";

import { cookies } from "next/headers";

import { type AuthUser } from "@/lib/api-contracts";
import { ApiClientError, ErrorCode } from "@/lib/api-errors";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  SESSION_FLAG_COOKIE_NAME,
} from "@/lib/server/auth-cookies";
import { serverHttpClient } from "@/lib/server/server-http-client";
import { createAdminService } from "@/lib/services/admin-service";
import { createAuthService } from "@/lib/services/auth-service";
import { createContentService } from "@/lib/services/content-service";
import { createEvaluationService } from "@/lib/services/evaluation-service";
import { createHistoryService } from "@/lib/services/history-service";
import { createIaService } from "@/lib/services/ia-service";
import { createReadingsService } from "@/lib/services/readings-service";
import { createSettingsService } from "@/lib/services/settings-service";
import { createSubscriptionsService } from "@/lib/services/subscriptions-service";
import { createSystemService } from "@/lib/services/system-service";
import { createUsersService } from "@/lib/services/users-service";

/**
 * Servicios listos para invocarse exclusivamente desde Next.js Server Components,
 * Server Actions o Route Handlers. Apuntan directo a `BACKEND_INTERNAL_URL` sin
 * pasar por el navegador ni exponer la URL interna del backend.
 */
export const serverAuthService = createAuthService(serverHttpClient);
export const serverUsersService = createUsersService(serverHttpClient);
export const serverSubscriptionsService =
  createSubscriptionsService(serverHttpClient);
export const serverSettingsService = createSettingsService(serverHttpClient);
export const serverReadingsService = createReadingsService(serverHttpClient);
export const serverContentService = createContentService(serverHttpClient);
export const serverEvaluationService =
  createEvaluationService(serverHttpClient);
export const serverHistoryService = createHistoryService(serverHttpClient);
export const serverIaService = createIaService(serverHttpClient);
export const serverAdminService = createAdminService(serverHttpClient);
export const serverSystemService = createSystemService(serverHttpClient);

export const serverApi = {
  auth: serverAuthService,
  users: serverUsersService,
  subscriptions: serverSubscriptionsService,
  settings: serverSettingsService,
  readings: serverReadingsService,
  content: serverContentService,
  evaluation: serverEvaluationService,
  history: serverHistoryService,
  ia: serverIaService,
  admin: serverAdminService,
  system: serverSystemService,
} as const;

export interface ServerSessionSnapshot {
  authenticated: boolean;
  needsRefresh: boolean;
  subscriptionRequired: boolean;
  user: AuthUser | null;
}

/**
 * Obtiene el estado de sesión en Server Components usando `doly_access_token`
 * de forma segura y de solo lectura.
 *
 * Nota: No rota `doly_refresh_token` dentro de un Server Component porque Next.js
 * prohíbe escribir cookies `Set-Cookie` durante el render; si el access token expiró,
 * marca `needsRefresh: true` para que la hidratación del navegador renueve vía proxy BFF.
 */
export async function getServerSessionSnapshot(): Promise<ServerSessionSnapshot> {
  let hasAccessToken = false;
  let hasRefreshToken = false;
  let hasSessionFlag = false;

  try {
    const cookieStore = await cookies();
    hasAccessToken = Boolean(cookieStore.get(ACCESS_COOKIE_NAME)?.value);
    hasRefreshToken = Boolean(cookieStore.get(REFRESH_COOKIE_NAME)?.value);
    hasSessionFlag = cookieStore.get(SESSION_FLAG_COOKIE_NAME)?.value === "1";
  } catch {
    return {
      authenticated: false,
      needsRefresh: false,
      subscriptionRequired: false,
      user: null,
    };
  }

  if (!hasAccessToken) {
    return {
      authenticated: false,
      needsRefresh: hasRefreshToken || hasSessionFlag,
      subscriptionRequired: false,
      user: null,
    };
  }

  try {
    const response = await serverAuthService.me();
    return {
      authenticated: true,
      needsRefresh: false,
      subscriptionRequired: false,
      user: response.data ?? null,
    };
  } catch (error) {
    if (error instanceof ApiClientError) {
      if (error.code === ErrorCode.SUBSCRIPTION_REQUIRED) {
        return {
          authenticated: true,
          needsRefresh: false,
          subscriptionRequired: true,
          user: null,
        };
      }

      if (error.isUnauthorized) {
        return {
          authenticated: false,
          needsRefresh: hasRefreshToken,
          subscriptionRequired: false,
          user: null,
        };
      }
    }

    return {
      authenticated: false,
      needsRefresh: false,
      subscriptionRequired: false,
      user: null,
    };
  }
}

export {
  serverApiRequest,
  serverHttpClient,
} from "@/lib/server/server-http-client";
