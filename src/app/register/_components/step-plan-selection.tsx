"use client";

import { Alert, Button, ChoiceCard, Icon } from "@/components/ui";
import { type SubscriptionPlanId } from "@/context";
import { type Dictionary } from "@/i18n";

export interface StepPlanSelectionProps {
  t: Dictionary;
  selectedPlan: SubscriptionPlanId;
  planError: string | null;
  isSubmittingPlan: boolean;
  onDismissError: () => void;
  onSelectPlan: (plan: SubscriptionPlanId) => void;
  onBack: () => void;
  onSubmit: () => void;
}

interface PlanDefinition {
  id: SubscriptionPlanId;
  name: string;
  badge: string;
  price: string;
  period: string;
  description: string;
  features: readonly string[];
}

/**
 * Paso 3 del onboarding: selección paramétrica del plan de suscripción.
 */
export function StepPlanSelection({
  t,
  selectedPlan,
  planError,
  isSubmittingPlan,
  onDismissError,
  onSelectPlan,
  onBack,
  onSubmit,
}: StepPlanSelectionProps) {
  const s3 = t.auth.stepper.step3Plan;

  const planDefinitions: readonly PlanDefinition[] = [
    {
      id: "dolly",
      name: s3.planDolyName,
      badge: s3.planDolyBadge,
      price: s3.planDolyPrice,
      period: s3.planDolyPeriod,
      description: s3.planDolyDesc,
      features: [s3.planDolyFeature1, s3.planDolyFeature2, s3.planDolyFeature3],
    },
    {
      id: "dolly_plus",
      name: s3.planDolyPlusName,
      badge: s3.planDolyPlusBadge,
      price: s3.planDolyPlusPrice,
      period: s3.planDolyPlusPeriod,
      description: s3.planDolyPlusDesc,
      features: [
        s3.planDolyPlusFeature1,
        s3.planDolyPlusFeature2,
        s3.planDolyPlusFeature3,
        s3.planDolyPlusFeature4,
      ],
    },
    {
      id: "dolly_pro",
      name: s3.planDolyProName,
      badge: s3.planDolyProBadge,
      price: s3.planDolyProPrice,
      period: s3.planDolyProPeriod,
      description: s3.planDolyProDesc,
      features: [
        s3.planDolyProFeature1,
        s3.planDolyProFeature2,
        s3.planDolyProFeature3,
        s3.planDolyProFeature4,
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {planError && (
        <Alert
          variant="error"
          title="Plan requerido"
          onDismiss={onDismissError}
        >
          {planError}
        </Alert>
      )}

      <div role="radiogroup" aria-label={s3.title} className="flex flex-col gap-4">
        {planDefinitions.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          return (
            <ChoiceCard
              key={plan.id}
              selected={isSelected}
              badge={isSelected ? s3.currentSelection : plan.badge}
              title={
                <span className="font-serif text-lg font-bold text-heading sm:text-xl">
                  {plan.name}
                </span>
              }
              meta={`${plan.price} · ${plan.period}`}
              description={plan.description}
              onClick={() => onSelectPlan(plan.id)}
            >
              <ul className="flex flex-col gap-1.5 border-t border-default pt-3 text-xs text-heading">
                {plan.features.map((feature, index) => (
                  <li
                    key={feature}
                    className={`flex items-center gap-2 ${
                      index === 0 ? "font-semibold" : "text-muted"
                    }`}
                  >
                    <Icon name="check" size="xs" strokeWidth={2.4} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </ChoiceCard>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="md"
          leftIcon={<Icon name="arrow-left" size="xs" />}
          onClick={onBack}
        >
          Volver a correo
        </Button>

        <Button
          type="button"
          variant="primary"
          size="lg"
          isLoading={isSubmittingPlan}
          onClick={onSubmit}
          rightIcon={<Icon name="arrow-right" size="md" />}
          className="normal-case tracking-normal"
        >
          {s3.submitButton}
        </Button>
      </div>
    </div>
  );
}
