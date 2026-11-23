import { describe, expect, it } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SubscriptionPlanCard } from "@/app/profile/_components/subscription-plan-card";
import { dictionaries } from "@/i18n/dictionaries";
import {
  type BillingConfigResponse,
  type BillingInvoice,
  type BillingStatusResponse,
  type SubscriptionPlanItem,
  type UserSubscriptionResponse,
} from "@/lib";

const PLANS: SubscriptionPlanItem[] = [
  {
    id: "dolly",
    name: "Dolly",
    description: "Plan básico gratuito.",
    maxCategories: 5,
    maxLanguages: 1,
    allowedLanguages: ["es", "en", "fr", "it"],
    dailyReadingsLimit: 10,
    dailyQuestionsLimit: 15,
  },
  {
    id: "dolly_plus",
    name: "Dolly Plus",
    description: "Plan intermedio bilingüe.",
    maxCategories: 15,
    maxLanguages: 2,
    allowedLanguages: ["es", "en", "fr", "it"],
    dailyReadingsLimit: 20,
    dailyQuestionsLimit: 30,
  },
  {
    id: "dolly_pro",
    name: "Dolly Pro",
    description: "Plan total ilimitado.",
    maxCategories: null,
    maxLanguages: 4,
    allowedLanguages: ["es", "en", "fr", "it"],
    dailyReadingsLimit: null,
    dailyQuestionsLimit: null,
  },
];

const STRIPE_CONFIG: BillingConfigResponse = {
  provider: "stripe",
  publishableKey: "pk_test_123",
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
      checkoutRequired: true,
      amountCents: 9900,
      currency: "mxn",
      interval: "month",
    },
    {
      tier: "dolly_pro",
      isFree: false,
      checkoutRequired: true,
      amountCents: 19900,
      currency: "mxn",
      interval: "month",
    },
  ],
  languageUnlock: {
    checkoutRequired: true,
    amountCents: 4900,
    currency: "mxn",
  },
};

const CURRENT_PLUS_SUB: UserSubscriptionResponse = {
  hasSubscription: true,
  tier: "dolly_plus",
  plan: PLANS[1]!,
  usage: {
    categoriesCount: 4,
    categoriesLimit: 15,
    languagesCount: 2,
    languagesLimit: 2,
    readingsCreatedToday: 3,
    readingsLimit: 20,
    readingsRemainingToday: 17,
    questionsAskedToday: 5,
    questionsLimit: 30,
    questionsRemainingToday: 25,
  },
};

describe("SubscriptionPlanCard with Stripe billing", () => {
  it("renders dynamic prices ($0, $99.00 MXN, $199.00 MXN), payment method, invoices, and handles upgrade/cancel flows", async () => {
    const user = userEvent.setup();
    const onSelectPlan = jest.fn(async () => true);
    const onChangePaidPlan = jest.fn(async () => true);
    const onCancelSubscription = jest.fn(async () => true);
    const onOpenUpdateCard = jest.fn();

    const billingStatus: BillingStatusResponse = {
      provider: "stripe",
      tier: "dolly_plus",
      subscription: {
        status: "active",
        tier: "dolly_plus",
        currentPeriodStart: "2026-11-01T00:00:00.000Z",
        currentPeriodEnd: "2026-12-01T00:00:00.000Z",
        cancelAtPeriodEnd: false,
        canceledAt: null,
        paymentMethod: {
          brand: "visa",
          last4: "4242",
          expMonth: 12,
          expYear: 2030,
        },
      },
      recentPayments: [],
    };

    const invoices: BillingInvoice[] = [
      {
        id: "in_1",
        number: "DOLY-0001",
        status: "paid",
        amountPaidCents: 9900,
        amountDueCents: 9900,
        currency: "mxn",
        createdAt: "2026-11-01T10:00:00.000Z",
        invoicePdfUrl: "https://pay.stripe.com/invoice/1/pdf",
        hostedInvoiceUrl: "https://invoice.stripe.com/i/1",
      },
    ];

    render(
      <SubscriptionPlanCard
        t={dictionaries.es}
        locale="es"
        currentSubscription={CURRENT_PLUS_SUB}
        billingConfig={STRIPE_CONFIG}
        billingStatus={billingStatus}
        invoices={invoices}
        plans={PLANS}
        isLoadingPlans={false}
        plansError={null}
        isSavingPlan={false}
        isLoggingOutAll={false}
        onSelectPlan={onSelectPlan}
        onChangePaidPlan={onChangePaidPlan}
        onCancelSubscription={onCancelSubscription}
        onOpenUpdateCard={onOpenUpdateCard}
        onLogoutAll={jest.fn(async () => {})}
      />,
    );

    expect(screen.getByText("Gratis ($0.00 MXN)")).toBeInTheDocument();
    expect(screen.getAllByText("$99.00 MXN / mes").length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.getByText("$199.00 MXN / mes")).toBeInTheDocument();
    expect(screen.getByText(/VISA •••• 4242/i)).toBeInTheDocument();
    expect(screen.getByText("DOLY-0001")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Descargar PDF" }),
    ).toHaveAttribute("href", "https://pay.stripe.com/invoice/1/pdf");

    // Upgrade to Dolly Pro opens change-plan modal instead of calling onSelectPlan directly
    await user.click(
      screen.getByRole("button", { name: "Cambiar a Dolly Pro" }),
    );
    expect(
      screen.getByRole("dialog", { name: /Confirmar cambio a Dolly Pro/i }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Confirmar cambio a Dolly Pro" }),
    );
    await waitFor(() => {
      expect(onChangePaidPlan).toHaveBeenCalledWith("dolly_pro");
    });
    expect(onSelectPlan).not.toHaveBeenCalled();

    // Switching to free Dolly opens end-of-cycle cancellation modal instead of POST /user/subscription
    const cancelButtons = screen.getAllByRole("button", {
      name: dictionaries.es.billing.subscriptionManage.cancelAtPeriodEndButton,
    });
    await user.click(cancelButtons[0]!);
    expect(
      screen.getByRole("dialog", {
        name: /Programar cancelación de Dolly Plus/i,
      }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: dictionaries.es.billing.subscriptionManage
          .confirmCancelSubscriptionButton,
      }),
    );
    await waitFor(() => {
      expect(onCancelSubscription).toHaveBeenCalledTimes(1);
    });
  });

  it("shows resume banner when cancelAtPeriodEnd is true and blocks plan changes when past_due", async () => {
    const user = userEvent.setup();
    const onResumeSubscription = jest.fn(async () => true);

    const billingStatus: BillingStatusResponse = {
      provider: "stripe",
      tier: "dolly_plus",
      subscription: {
        status: "past_due",
        tier: "dolly_plus",
        currentPeriodStart: "2026-11-01T00:00:00.000Z",
        currentPeriodEnd: "2026-12-01T00:00:00.000Z",
        cancelAtPeriodEnd: true,
        canceledAt: null,
        paymentMethod: null,
      },
      recentPayments: [],
    };

    render(
      <SubscriptionPlanCard
        t={dictionaries.es}
        locale="es"
        currentSubscription={CURRENT_PLUS_SUB}
        billingConfig={STRIPE_CONFIG}
        billingStatus={billingStatus}
        plans={PLANS}
        isLoadingPlans={false}
        plansError={null}
        isSavingPlan={false}
        isLoggingOutAll={false}
        onSelectPlan={jest.fn(async () => true)}
        onResumeSubscription={onResumeSubscription}
        onLogoutAll={jest.fn(async () => {})}
      />,
    );

    expect(
      screen.getByText(
        dictionaries.es.billing.subscriptionManage.pastDueBannerTitle,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        dictionaries.es.billing.subscriptionManage.cancelScheduledBannerTitle,
      ),
    ).toBeInTheDocument();

    // Upgrade to Dolly Pro is disabled while past_due
    expect(
      screen.getByRole("button", { name: "Cambiar a Dolly Pro" }),
    ).toBeDisabled();

    await user.click(
      screen.getByRole("button", {
        name: dictionaries.es.billing.subscriptionManage.resumeSubscriptionButton,
      }),
    );
    await waitFor(() => {
      expect(onResumeSubscription).toHaveBeenCalledTimes(1);
    });
  });
});
