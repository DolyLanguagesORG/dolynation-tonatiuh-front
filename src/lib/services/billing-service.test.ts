import { describe, expect, it } from "@jest/globals";

import { type ApiTransport } from "@/lib/api-contracts";
import {
  createBillingIdempotencyKey,
  createBillingService,
} from "@/lib/services/billing-service";

function createMockTransport(): jest.Mocked<ApiTransport> {
  return {
    request: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<ApiTransport>;
}

describe("billingService", () => {
  it("generates compliant Idempotency-Key strings", () => {
    const key = createBillingIdempotencyKey("checkout");
    expect(key).toMatch(/^[A-Za-z0-9._:-]{1,128}$/);
    expect(key.startsWith("checkout:")).toBe(true);
  });

  it("calls GET /billing/config with skipAuth: true", async () => {
    const transport = createMockTransport();
    transport.get.mockResolvedValue({
      message: "OK",
      data: {
        provider: "stripe",
        publishableKey: "pk_test_123",
        currency: "mxn",
        uiMode: "custom",
        plans: [],
        languageUnlock: {
          checkoutRequired: true,
          amountCents: 4900,
          currency: "mxn",
        },
      },
    });

    const service = createBillingService(transport);
    const res = await service.getConfig();

    expect(transport.get).toHaveBeenCalledWith("/billing/config", {
      skipAuth: true,
    });
    expect(res.data.provider).toBe("stripe");
  });

  it("forwards Idempotency-Key header on createSubscriptionCheckout, createLanguageUnlockCheckout, changePlan, and createSetupIntent", async () => {
    const transport = createMockTransport();
    transport.post.mockResolvedValue({
      message: "OK",
      data: {} as never,
    });

    const service = createBillingService(transport);

    await service.createSubscriptionCheckout(
      { tier: "dolly_plus", uiMode: "custom" },
      "idem-sub-1",
    );
    const subCall = transport.post.mock.calls[0];
    expect(subCall?.[0]).toBe("/billing/checkout/subscription");
    expect(subCall?.[1]).toEqual({ tier: "dolly_plus", uiMode: "custom" });
    expect(new Headers(subCall?.[2]?.headers).get("Idempotency-Key")).toBe(
      "idem-sub-1",
    );

    await service.createLanguageUnlockCheckout(
      { uiMode: "custom" },
      "idem-unlock-1",
    );
    const unlockCall = transport.post.mock.calls[1];
    expect(unlockCall?.[0]).toBe("/billing/checkout/language-unlock");
    expect(new Headers(unlockCall?.[2]?.headers).get("Idempotency-Key")).toBe(
      "idem-unlock-1",
    );

    await service.changePlan({ tier: "dolly_pro" }, "idem-change-1");
    const changeCall = transport.post.mock.calls[2];
    expect(changeCall?.[0]).toBe("/billing/subscription/change-plan");
    expect(changeCall?.[1]).toEqual({ tier: "dolly_pro" });
    expect(new Headers(changeCall?.[2]?.headers).get("Idempotency-Key")).toBe(
      "idem-change-1",
    );

    await service.createSetupIntent("idem-setup-1");
    const setupCall = transport.post.mock.calls[3];
    expect(setupCall?.[0]).toBe("/billing/payment-method/setup-intent");
    expect(new Headers(setupCall?.[2]?.headers).get("Idempotency-Key")).toBe(
      "idem-setup-1",
    );
  });

  it("covers syncCheckoutSession, getStatus, cancel, resume, setDefaultPaymentMethod, listInvoices, and createPortal", async () => {
    const transport = createMockTransport();
    transport.get.mockResolvedValue({ message: "OK", data: {} as never });
    transport.post.mockResolvedValue({ message: "OK", data: {} as never });

    const service = createBillingService(transport);

    await service.syncCheckoutSession("cs_test_abc123");
    expect(transport.post).toHaveBeenCalledWith(
      "/billing/checkout/cs_test_abc123/sync",
      undefined,
      undefined,
    );

    await service.getStatus();
    expect(transport.get).toHaveBeenCalledWith("/billing/status", undefined);

    await service.cancelSubscription();
    expect(transport.post).toHaveBeenCalledWith(
      "/billing/subscription/cancel",
      undefined,
      undefined,
    );

    await service.resumeSubscription();
    expect(transport.post).toHaveBeenCalledWith(
      "/billing/subscription/resume",
      undefined,
      undefined,
    );

    await service.setDefaultPaymentMethod({ paymentMethodId: "pm_123" });
    expect(transport.post).toHaveBeenCalledWith(
      "/billing/payment-method/default",
      { paymentMethodId: "pm_123" },
      undefined,
    );

    await service.listInvoices();
    expect(transport.get).toHaveBeenCalledWith("/billing/invoices", undefined);

    await service.createPortal();
    expect(transport.post).toHaveBeenCalledWith(
      "/billing/portal",
      undefined,
      undefined,
    );
  });
});
