"use client";

import { useCallback, useEffect, useState } from "react";

import { type Locale } from "@/i18n";
import {
  ApiClientError,
  ErrorCode,
  resolveErrorMessage,
  type SubscriptionPlanItem,
  subscriptionsService,
} from "@/lib";

export interface UseSubscriptionPlansResult {
  plans: SubscriptionPlanItem[];
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Carga el catálogo oficial de planes desde `GET /subscriptions/plans` para evitar
 * límites o descripciones hardcodeadas en onboarding y perfil.
 */
export function useSubscriptionPlans(
  locale: Locale,
): UseSubscriptionPlansResult {
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    subscriptionsService
      .getPlans({ signal: controller.signal })
      .then((res) => {
        if (!controller.signal.aborted) {
          setPlans(res.data ?? []);
          setError(null);
        }
      })
      .catch((err) => {
        if (
          controller.signal.aborted ||
          (err instanceof Error && err.name === "AbortError")
        ) {
          return;
        }
        setError(
          err instanceof ApiClientError
            ? err.getUserMessage(locale)
            : resolveErrorMessage(ErrorCode.UNKNOWN_ERROR, locale),
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [locale, reloadCounter]);

  const reload = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setReloadCounter((prev) => prev + 1);
  }, []);

  return {
    plans,
    isLoading,
    error,
    reload,
  };
}
