import { beforeEach, describe, expect, it } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockReplace = jest.fn();
const mockReloadAccountState = jest.fn(async () => {});
let mockSessionIdParam: string | null = "cs_test_12345";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
  useSearchParams: () => ({
    get: (key: string) => (key === "session_id" ? mockSessionIdParam : null),
  }),
}));

jest.mock("@/context", () => ({
  useAuth: () => ({
    onboarding: {
      hasSelectedPlan: true,
      subscriptionPlan: "dolly_plus",
      canGenerateReadings: false,
    },
    reloadAccountState: mockReloadAccountState,
  }),
}));

import { BillingReturnView } from "@/app/billing/return/_components/billing-return-view";
import { LocaleProvider } from "@/i18n";
import { ApiClientError, billingService, ErrorCode } from "@/lib";

describe("BillingReturnView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionIdParam = "cs_test_12345";
  });

  it("syncs checkout session on mount, reloads account state, and shows confirmed subscription message on 200 OK", async () => {
    const syncSpy = jest
      .spyOn(billingService, "syncCheckoutSession")
      .mockResolvedValueOnce({
        message: "Synced",
        data: {
          provider: "stripe",
          tier: "dolly_plus",
          subscription: {
            status: "active",
            tier: "dolly_plus",
            currentPeriodStart: "2026-11-22T00:00:00.000Z",
            currentPeriodEnd: "2026-12-22T00:00:00.000Z",
            cancelAtPeriodEnd: false,
            canceledAt: null,
            paymentMethod: null,
          },
          recentPayments: [
            {
              id: 1,
              kind: "subscription",
              tier: "dolly_plus",
              amountCents: 9900,
              currency: "mxn",
              status: "paid",
              fulfilledAt: "2026-11-22T00:00:00.000Z",
              createdAt: "2026-11-22T00:00:00.000Z",
            },
          ],
        },
      });

    render(
      <LocaleProvider initialLocale="es">
        <BillingReturnView />
      </LocaleProvider>,
    );

    await waitFor(() => {
      expect(syncSpy).toHaveBeenCalledWith("cs_test_12345");
      expect(mockReloadAccountState).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.getByText(/Tu suscripción al plan Dolly Plus ya se encuentra activa/i),
    ).toBeInTheDocument();
  });

  it("shows pending payment state and retry button when sync returns 402 BILLING_PAYMENT_REQUIRED (OXXO/SPEI)", async () => {
    const user = userEvent.setup();
    const syncSpy = jest
      .spyOn(billingService, "syncCheckoutSession")
      .mockRejectedValueOnce(
        new ApiClientError({
          code: ErrorCode.BILLING_PAYMENT_REQUIRED,
          status: 402,
        }),
      )
      .mockResolvedValueOnce({
        message: "Synced",
        data: {
          provider: "stripe",
          tier: "dolly_plus",
          subscription: null,
          recentPayments: [
            {
              id: 2,
              kind: "language_unlock",
              tier: null,
              amountCents: 4900,
              currency: "mxn",
              status: "paid",
              fulfilledAt: "2026-11-22T00:00:00.000Z",
              createdAt: "2026-11-22T00:00:00.000Z",
            },
          ],
        },
      });

    render(
      <LocaleProvider initialLocale="es">
        <BillingReturnView />
      </LocaleProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("PAGO PENDIENTE DE CONFIRMACIÓN"),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: /Verificar estado nuevamente/i }),
    );

    await waitFor(() => {
      expect(syncSpy).toHaveBeenCalledTimes(2);
      expect(
        screen.getByText(/Tu crédito de cambio de idioma \(\+1\) fue acreditado/i),
      ).toBeInTheDocument();
    });
  });

  it("shows error state when session_id is missing or invalid (400 BILLING_CHECKOUT_INVALID)", async () => {
    mockSessionIdParam = null;

    render(
      <LocaleProvider initialLocale="es">
        <BillingReturnView />
      </LocaleProvider>,
    );

    expect(screen.getByText("SESIÓN NO VÁLIDA")).toBeInTheDocument();
    expect(
      screen.getByText(
        /No se encontró un identificador de sesión de pago válido/i,
      ),
    ).toBeInTheDocument();
  });
});
