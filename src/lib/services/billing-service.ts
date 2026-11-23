import {
  type ApiRequestOptions,
  type ApiTransport,
  type BillingConfigResponse,
  type BillingInvoice,
  type BillingPaymentMethodSummary,
  type BillingPortalResponse,
  type BillingStatusResponse,
  type ChangeSubscriptionPlanInput,
  type CheckoutSessionResponse,
  type CreateLanguageUnlockCheckoutInput,
  type CreateSubscriptionCheckoutInput,
  type SetDefaultPaymentMethodInput,
  type SetupIntentResponse,
} from "@/lib/api-contracts";
import { type ApiResponse } from "@/lib/api-errors";
import { httpClient } from "@/lib/http-client";

export type BillingRequestOptions = Omit<ApiRequestOptions, "method" | "body">;

function withIdempotencyKey(
  options: BillingRequestOptions | undefined,
  idempotencyKey?: string,
): BillingRequestOptions {
  const cleanKey = idempotencyKey?.trim();
  if (!cleanKey) {
    return options ?? {};
  }

  const headers = new Headers(options?.headers);
  headers.set("Idempotency-Key", cleanKey);
  return {
    ...options,
    headers,
  };
}

/**
 * Genera una llave de idempotencia segura para operaciones monetarias (`checkout`,
 * `change-plan` y `setup-intent`) compatible con el filtro `[A-Za-z0-9._:-]{1,128}` del backend.
 */
export function createBillingIdempotencyKey(prefix = "doly"): string {
  const cleanPrefix = prefix.replace(/[^A-Za-z0-9._:-]/g, "") || "doly";
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${cleanPrefix}:${crypto.randomUUID()}`.slice(0, 128);
  }
  const rand = Math.random().toString(36).slice(2, 12);
  return `${cleanPrefix}:${Date.now()}-${rand}`.slice(0, 128);
}

/**
 * Crea el servicio de facturación, checkout, método de pago y facturas (`/api/v1/billing/*`).
 */
export function createBillingService(transport: ApiTransport) {
  return {
    /** Consulta públicamente el proveedor (`manual` | `stripe`), `publishableKey`, `uiMode` y precios en centavos. */
    getConfig(
      options?: BillingRequestOptions,
    ): Promise<ApiResponse<BillingConfigResponse>> {
      return transport.get<BillingConfigResponse>("/billing/config", {
        skipAuth: true,
        ...options,
      });
    },

    /** Inicia una sesión de Checkout para adquirir una suscripción pagada (`dolly_plus` | `dolly_pro`). */
    createSubscriptionCheckout(
      input: CreateSubscriptionCheckoutInput,
      idempotencyKey?: string,
      options?: BillingRequestOptions,
    ): Promise<ApiResponse<CheckoutSessionResponse>> {
      return transport.post<CheckoutSessionResponse>(
        "/billing/checkout/subscription",
        input,
        withIdempotencyKey(options, idempotencyKey),
      );
    },

    /** Inicia una sesión de Checkout de pago único para adquirir `+1` crédito de cambio de idioma. */
    createLanguageUnlockCheckout(
      input: CreateLanguageUnlockCheckoutInput = {},
      idempotencyKey?: string,
      options?: BillingRequestOptions,
    ): Promise<ApiResponse<CheckoutSessionResponse>> {
      return transport.post<CheckoutSessionResponse>(
        "/billing/checkout/language-unlock",
        input,
        withIdempotencyKey(options, idempotencyKey),
      );
    },

    /** Reconcilia de forma síncrona e idempotente una sesión de Checkout al regresar del pago. */
    syncCheckoutSession(
      sessionId: string,
      options?: BillingRequestOptions,
    ): Promise<ApiResponse<BillingStatusResponse>> {
      return transport.post<BillingStatusResponse>(
        `/billing/checkout/${encodeURIComponent(sessionId.trim())}/sync`,
        undefined,
        options,
      );
    },

    /** Obtiene el estado de suscripción actual, tarjeta predeterminada y pagos recientes del usuario. */
    getStatus(
      options?: BillingRequestOptions,
    ): Promise<ApiResponse<BillingStatusResponse>> {
      return transport.get<BillingStatusResponse>("/billing/status", options);
    },

    /** Ejecuta upgrade o downgrade in-app entre planes pagados (`dolly_plus` ↔ `dolly_pro`) con prorrateo. */
    changePlan(
      input: ChangeSubscriptionPlanInput,
      idempotencyKey?: string,
      options?: BillingRequestOptions,
    ): Promise<ApiResponse<BillingStatusResponse>> {
      return transport.post<BillingStatusResponse>(
        "/billing/subscription/change-plan",
        input,
        withIdempotencyKey(options, idempotencyKey),
      );
    },

    /** Programa la cancelación de la suscripción activa al cierre del periodo (`cancelAtPeriodEnd = true`). */
    cancelSubscription(
      options?: BillingRequestOptions,
    ): Promise<ApiResponse<BillingStatusResponse>> {
      return transport.post<BillingStatusResponse>(
        "/billing/subscription/cancel",
        undefined,
        options,
      );
    },

    /** Revierte una cancelación programada antes del fin del periodo de facturación actual. */
    resumeSubscription(
      options?: BillingRequestOptions,
    ): Promise<ApiResponse<BillingStatusResponse>> {
      return transport.post<BillingStatusResponse>(
        "/billing/subscription/resume",
        undefined,
        options,
      );
    },

    /** Crea un `SetupIntent` para capturar o actualizar la tarjeta del usuario dentro de la app. */
    createSetupIntent(
      idempotencyKey?: string,
      options?: BillingRequestOptions,
    ): Promise<ApiResponse<SetupIntentResponse>> {
      return transport.post<SetupIntentResponse>(
        "/billing/payment-method/setup-intent",
        undefined,
        withIdempotencyKey(options, idempotencyKey),
      );
    },

    /** Fija un método de pago confirmado como tarjeta predeterminada de la suscripción. */
    setDefaultPaymentMethod(
      input: SetDefaultPaymentMethodInput,
      options?: BillingRequestOptions,
    ): Promise<ApiResponse<BillingPaymentMethodSummary>> {
      return transport.post<BillingPaymentMethodSummary>(
        "/billing/payment-method/default",
        input,
        options,
      );
    },

    /** Lista hasta 24 facturas recientes del usuario autenticado con enlaces PDF. */
    listInvoices(
      options?: BillingRequestOptions,
    ): Promise<ApiResponse<BillingInvoice[]>> {
      return transport.get<BillingInvoice[]>("/billing/invoices", options);
    },

    /** Crea una sesión de respaldo hacia el Customer Portal alojado en Stripe. */
    createPortal(
      options?: BillingRequestOptions,
    ): Promise<ApiResponse<BillingPortalResponse>> {
      return transport.post<BillingPortalResponse>(
        "/billing/portal",
        undefined,
        options,
      );
    },
  };
}

/** Instancia de cliente para facturación y pagos con Stripe en el navegador. */
export const billingService = createBillingService(httpClient);
