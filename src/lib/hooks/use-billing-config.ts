"use client";

import { useCallback, useEffect, useState } from "react";

import {
  type BillingConfigResponse,
  billingService,
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
let inFlightPromise: Promise<BillingConfigResponse> | null = null;

export function resetBillingConfigCacheForTests(): void {
  cachedConfig = null;
  inFlightPromise = null;
}

async function fetchBillingConfigCached(
  force = false,
): Promise<BillingConfigResponse> {
  const now = Date.now();
  if (
    !force &&
    cachedConfig &&
    now - cachedConfig.fetchedAt < BILLING_CONFIG_CACHE_TTL_MS
  ) {
    return cachedConfig.data;
  }

  if (!force && inFlightPromise) {
    return inFlightPromise;
  }

  inFlightPromise = billingService
    .getConfig()
    .then((res) => {
      const nextConfig = res.data ?? FALLBACK_MANUAL_BILLING_CONFIG;
      cachedConfig = {
        data: nextConfig,
        fetchedAt: Date.now(),
      };
      return nextConfig;
    })
    .catch(() => {
      return cachedConfig?.data ?? FALLBACK_MANUAL_BILLING_CONFIG;
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
  reload: () => Promise<BillingConfigResponse>;
}

/**
 * Consulta y cachea `GET /api/v1/billing/config` en el navegador (TTL 5 min).
 * Si el endpoint no está configurado o falla, degrada de forma segura a `provider: 'manual'`.
 */
export function useBillingConfig(): UseBillingConfigResult {
  const [config, setConfig] = useState<BillingConfigResponse>(
    () => cachedConfig?.data ?? FALLBACK_MANUAL_BILLING_CONFIG,
  );
  const [isLoading, setIsLoading] = useState<boolean>(() => !cachedConfig);

  useEffect(() => {
    let cancelled = false;

    fetchBillingConfigCached(false)
      .then((nextConfig) => {
        if (!cancelled) {
          setConfig(nextConfig);
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
      const nextConfig = await fetchBillingConfigCached(true);
      setConfig(nextConfig);
      return nextConfig;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    config,
    isStripeActive: config.provider === "stripe",
    isLoading,
    reload,
  };
}
