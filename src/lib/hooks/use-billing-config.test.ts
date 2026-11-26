import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { type BillingConfigResponse, billingService } from "@/lib";
import {
  FALLBACK_MANUAL_BILLING_CONFIG,
  fetchBillingConfigCached,
  peekCachedBillingConfig,
  resetBillingConfigCacheForTests,
} from "@/lib/hooks/use-billing-config";

const STRIPE_CONFIG: BillingConfigResponse = {
  ...FALLBACK_MANUAL_BILLING_CONFIG,
  provider: "stripe",
  publishableKey: "pk_test_shared_cache",
};

describe("use-billing-config shared cache helpers", () => {
  beforeEach(() => {
    resetBillingConfigCacheForTests();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    resetBillingConfigCacheForTests();
  });

  it("returns null before fetching, populates cache on fetch, and deduplicates in-flight requests", async () => {
    expect(peekCachedBillingConfig()).toBeNull();

    let resolveRequest!: (value: { message: string; data: BillingConfigResponse }) => void;
    const pending = new Promise<{ message: string; data: BillingConfigResponse }>(
      (resolve) => {
        resolveRequest = resolve;
      },
    );
    const getConfigSpy = jest
      .spyOn(billingService, "getConfig")
      .mockReturnValue(pending);

    const firstCall = fetchBillingConfigCached(false);
    const secondCall = fetchBillingConfigCached(false);

    expect(getConfigSpy).toHaveBeenCalledTimes(1);

    resolveRequest({ message: "OK", data: STRIPE_CONFIG });

    const [firstOutcome, secondOutcome] = await Promise.all([
      firstCall,
      secondCall,
    ]);
    expect(firstOutcome).toEqual({ config: STRIPE_CONFIG, available: true });
    expect(secondOutcome).toEqual({ config: STRIPE_CONFIG, available: true });
    expect(peekCachedBillingConfig()).toEqual(STRIPE_CONFIG);
  });

  it("expires peeked cache after the 5-minute TTL window", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-11-25T12:00:00.000Z"));

    jest.spyOn(billingService, "getConfig").mockResolvedValue({
      message: "OK",
      data: STRIPE_CONFIG,
    });

    await fetchBillingConfigCached(false);
    expect(peekCachedBillingConfig()).toEqual(STRIPE_CONFIG);

    jest.advanceTimersByTime(5 * 60 * 1000 + 1);
    expect(peekCachedBillingConfig()).toBeNull();
  });

  it("falls back to manual config with available=false when billingService.getConfig fails", async () => {
    jest
      .spyOn(billingService, "getConfig")
      .mockRejectedValue(new Error("Service unavailable"));

    const outcome = await fetchBillingConfigCached(false);

    expect(outcome).toEqual({
      config: FALLBACK_MANUAL_BILLING_CONFIG,
      available: false,
    });
    expect(peekCachedBillingConfig()).toBeNull();
  });
});
