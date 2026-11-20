import { describe, expect, it, jest } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SubscriptionPlanCard } from "@/app/profile/_components/subscription-plan-card";
import { dictionaries } from "@/i18n/dictionaries";
import { type SubscriptionPlanItem } from "@/lib/api-contracts";

const PLANS: SubscriptionPlanItem[] = [
  {
    id: "dolly",
    name: "Dolly",
    description: "Plan básico",
    maxCategories: 5,
    maxLanguages: 1,
    allowedLanguages: ["en"],
    dailyReadingsLimit: 10,
    dailyQuestionsLimit: 15,
  },
  {
    id: "dolly_plus",
    name: "Dolly Plus",
    description: "Plan intermedio",
    maxCategories: 15,
    maxLanguages: 2,
    allowedLanguages: ["en", "fr"],
    dailyReadingsLimit: 20,
    dailyQuestionsLimit: 30,
  },
  {
    id: "dolly_pro",
    name: "Dolly Pro",
    description: "Acceso total",
    maxCategories: null,
    maxLanguages: 4,
    allowedLanguages: ["es", "en", "fr", "it"],
    dailyReadingsLimit: null,
    dailyQuestionsLimit: null,
  },
];

describe("SubscriptionPlanCard", () => {
  it("renders a compact pending request notice without refresh button and cancels on confirmation", async () => {
    const user = userEvent.setup();
    const onCancelAccessRequest = jest.fn<
      (requestId: number) => Promise<boolean>
    >(async () => true);

    render(
      <SubscriptionPlanCard
        t={dictionaries.es}
        locale="es"
        currentSubscription={null}
        plans={PLANS}
        isLoadingPlans={false}
        plansError={null}
        isSavingPlan={false}
        isLoggingOutAll={false}
        accessRequestsEnabled
        pendingSubscriptionRequest={{
          id: 42,
          userId: 7,
          requestType: "subscription",
          requestedTier: "dolly_plus",
          currentTier: "dolly_pro",
          userMessage: "Mensaje privado del usuario",
          status: "pending",
          rejectionReason: null,
          reviewedByUserId: null,
          reviewedAt: null,
          createdAt: "2026-11-19T00:00:00.000Z",
          updatedAt: "2026-11-19T00:00:00.000Z",
        }}
        onSelectPlan={jest.fn(async () => true)}
        onCancelAccessRequest={onCancelAccessRequest}
        onLogoutAll={jest.fn(async () => {})}
      />,
    );

    expect(
      screen.getByText("Hay una solicitud pendiente para cambiar a Dolly Plus."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Actualizar estado/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Mensaje privado del usuario/i),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Cancelar solicitud/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /Confirmar cancelación/i }),
    );

    await waitFor(() => {
      expect(onCancelAccessRequest).toHaveBeenCalledWith(42);
    });
  });
});
