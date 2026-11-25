"use client";

import { useCallback, useEffect, useState } from "react";

import {
  ApiClientError,
  type BillingConfigResponse,
  billingService,
  ErrorCode,
} from "@/lib";

export const FALLBACK_MANUAL_BILLING_CONFIG: BillingConfigResponse = {
  provider: "manual",
  publishableKey: null,
  currency: "mxn",
  uiMode: "custom",
  plans: [
    {
      tier: "dolly",
      isFree: true,
      checkoutRequired: false,
      amountCents: 0,
      currency: "mxn",
      interval: null,
    },
    {
      tier: "dolly_plus",
      isFree: false,
      checkoutRequired: false,
      amountCents: null,
      currency: "mxn",
      interval: "month",
    },
    {
      tier: "dolly_pro",
      isFree: false,
      checkoutRequired: false,
      amountCents: null,
      currency: "mxn",
      interval: "month",
    },
  ],
  languageUnlock: {
    checkoutRequired: false,
    amountCents: null,
    currency: "mxn",
  },
};

const BILLING_CONFIG_CACHE_TTL_MS = 5 * 60 * 1000;

let cachedConfig: {
  data: BillingConfigResponse;
  fetchedAt: number;
} | null = null;
/**
 * `available` es `false` cuando no se pudo leer la configuración real del backend y
 * `config` es solo un valor de respaldo para pintar la UI.
 */
export interface BillingConfigFetchOutcome {
  config: BillingConfigResponse;
  available: boolean;
}

let inFlightPromise: Promise<BillingConfigFetchOutcome> | null = null;

export function resetBillingConfigCacheForTests(): void {
  cachedConfig = null;
  inFlightPromise = null;
}

/**
 * Devuelve la configuración de facturación cacheada si aún está vigente (TTL 5 min),
 * sin iniciar ninguna petición de red.
 */
export function peekCachedBillingConfig(): BillingConfigResponse | null {
  if (
    cachedConfig &&
    Date.now() - cachedConfig.fetchedAt < BILLING_CONFIG_CACHE_TTL_MS
  ) {
    return cachedConfig.data;
  }
  return null;
}

export async function fetchBillingConfigCached(
  force = false,
): Promise<BillingConfigFetchOutcome> {
  const now = Date.now();
  if (
    !force &&
    cachedConfig &&
    now - cachedConfig.fetchedAt < BILLING_CONFIG_CACHE_TTL_MS
  ) {
    return { config: cachedConfig.data, available: true };
  }

  if (!force && inFlightPromise) {
    return inFlightPromise;
  }

  inFlightPromise = billingService
    .getConfig()
    .then((res): BillingConfigFetchOutcome => {
      const nextConfig = res.data ?? FALLBACK_MANUAL_BILLING_CONFIG;
      cachedConfig = {
        data: nextConfig,
        fetchedAt: Date.now(),
      };
      return { config: nextConfig, available: true };
    })
    .catch((): BillingConfigFetchOutcome => {
      return cachedConfig
        ? { config: cachedConfig.data, available: true }
        : { config: FALLBACK_MANUAL_BILLING_CONFIG, available: false };
    })
    .finally(() => {
      inFlightPromise = null;
    });

  return inFlightPromise;
}

export interface UseBillingConfigResult {
  config: BillingConfigResponse;
  isStripeActive: boolean;
  isLoading: boolean;
  /** `true` si no se pudo cargar la configuración: `config` es solo un respaldo visual. */
  isUnavailable: boolean;
  reload: () => Promise<BillingConfigResponse>;
  /**
   * Devuelve la configuración real del backend (usando la caché si está fresca) para
   * decidir un cobro. Lanza `SERVICE_UNAVAILABLE` si no se puede cargar, en lugar de
   * suponer el modo manual.
   */
  ensureConfig: () => Promise<BillingConfigResponse>;
}

/**
 * Consulta y cachea `GET /api/v1/billing/config` en el navegador (TTL 5 min).
 * Si el endpoint falla, `config` muestra un respaldo `manual` solo para pintar la UI y
 * `isUnavailable` queda en `true`; para decidir un cobro usa `ensureConfig()`.
 */
export function useBillingConfig(): UseBillingConfigResult {
  const [config, setConfig] = useState<BillingConfigResponse>(
    () => cachedConfig?.data ?? FALLBACK_MANUAL_BILLING_CONFIG,
  );
  const [isLoading, setIsLoading] = useState<boolean>(() => !cachedConfig);
  const [isUnavailable, setIsUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchBillingConfigCached(false)
      .then((outcome) => {
        if (!cancelled) {
          setConfig(outcome.config);
          setIsUnavailable(!outcome.available);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const reload = useCallback(async (): Promise<BillingConfigResponse> => {
    setIsLoading(true);
    try {
      const outcome = await fetchBillingConfigCached(true);
      setConfig(outcome.config);
      setIsUnavailable(!outcome.available);
      return outcome.config;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const ensureConfig = useCallback(async (): Promise<BillingConfigResponse> => {
    const outcome = await fetchBillingConfigCached(false);
    setConfig(outcome.config);
    setIsUnavailable(!outcome.available);
    setIsLoading(false);
    if (!outcome.available) {
      throw new ApiClientError({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        status: 503,
      });
    }
    return outcome.config;
  }, []);

  return {
    config,
    isStripeActive: config.provider === "stripe",
    isLoading,
    isUnavailable,
    reload,
    ensureConfig,
  };
}
