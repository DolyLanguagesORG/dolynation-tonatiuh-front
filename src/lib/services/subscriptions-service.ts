import {
  type ApiRequestOptions,
  type ApiTransport,
  type SelectSubscriptionInput,
  type SubscriptionPlanItem,
  type UserSubscriptionResponse,
} from "@/lib/api-contracts";
import { type ApiResponse } from "@/lib/api-errors";
import { httpClient } from "@/lib/http-client";

export type SubscriptionsRequestOptions = Omit<
  ApiRequestOptions,
  "method" | "body"
>;

/**
 * Crea el servicio de planes y suscripción del usuario sobre un transporte dado.
 */
export function createSubscriptionsService(transport: ApiTransport) {
  return {
    /** Lista públicamente los planes disponibles (`dolly`, `dolly_plus`, `dolly_pro`). */
    getPlans(
      options?: SubscriptionsRequestOptions,
    ): Promise<ApiResponse<SubscriptionPlanItem[]>> {
      return transport.get<SubscriptionPlanItem[]>("/subscriptions/plans", {
        skipAuth: true,
        ...options,
      });
    },

    /** Obtiene el plan activo y contadores de consumo diario del usuario autenticado. */
    getCurrentSubscription(
      options?: SubscriptionsRequestOptions,
    ): Promise<ApiResponse<UserSubscriptionResponse>> {
      return transport.get<UserSubscriptionResponse>(
        "/user/subscription",
        options,
      );
    },

    /** Selecciona o actualiza el plan de suscripción del usuario autenticado. */
    selectSubscription(
      input: SelectSubscriptionInput,
      options?: SubscriptionsRequestOptions,
    ): Promise<ApiResponse<UserSubscriptionResponse>> {
      return transport.post<UserSubscriptionResponse>(
        "/user/subscription",
        input,
        options,
      );
    },
  };
}

/** Instancia de cliente para suscripciones y cuotas en el navegador. */
export const subscriptionsService = createSubscriptionsService(httpClient);
