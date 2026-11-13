"use client";

import {
  Alert,
  Button,
  ChoiceCard,
  Icon,
  SkeletonCard,
} from "@/components/ui";
import { type SubscriptionPlanId } from "@/context";
import { type Dictionary, useLocale } from "@/i18n";
import { type SubscriptionPlanItem } from "@/lib";
import { useSubscriptionPlans } from "@/lib/hooks/use-subscription-plans";
import { formatPlanFromBackend } from "@/lib/plan-presentation";

export interface StepPlanSelectionProps {
  t: Dictionary;
  selectedPlan: SubscriptionPlanId;
  planError: string | null;
  isSubmittingPlan: boolean;
  plans?: readonly SubscriptionPlanItem[];
  onDismissError: () => void;
  onSelectPlan: (plan: SubscriptionPlanId) => void;
  onBack?: () => void;
  onSubmit: () => void;
}

/**
 * Paso 3 del onboarding: selección paramétrica del plan de suscripción
 * alimentada desde `GET /subscriptions/plans`.
 */
export function StepPlanSelection({
  t,
  selectedPlan,
  planError,
  isSubmittingPlan,
  plans: providedPlans,
  onDismissError,
  onSelectPlan,
  onBack,
  onSubmit,
}: StepPlanSelectionProps) {
  const { locale } = useLocale();
  const s3 = t.auth.stepper.step3Plan;
  const loadedPlans = useSubscriptionPlans(locale);
  const rawPlans =
    providedPlans && providedPlans.length > 0 ? providedPlans : loadedPlans.plans;
  const isLoadingPlans = !providedPlans && loadedPlans.isLoading;
  const plansLoadError = !providedPlans ? loadedPlans.error : null;

  const planDefinitions = rawPlans.map((plan) =>
    formatPlanFromBackend(plan, locale),
  );

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

      {plansLoadError && (
        <Alert
          variant="error"
          title={
            locale === "es"
              ? "No se pudieron cargar los planes"
              : "Could not load subscription plans"
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{plansLoadError}</span>
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={() => void loadedPlans.reload()}
            >
              {locale === "es" ? "Reintentar" : "Retry"}
            </Button>
          </div>
        </Alert>
      )}

      <div
        role="radiogroup"
        aria-label={s3.title}
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        {isLoadingPlans
          ? [1, 2, 3].map((slot) => (
              <SkeletonCard
                key={slot}
                lines={4}
                label={
                  locale === "es" ? "Cargando planes..." : "Loading plans..."
                }
              />
            ))
          : planDefinitions.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <ChoiceCard
                  key={plan.id}
                  selected={isSelected}
                  className="h-full"
                  badge={isSelected ? s3.currentSelection : plan.tierBadge}
                  title={
                    <span className="font-serif text-lg font-bold text-heading sm:text-xl">
                      {plan.name}
                    </span>
                  }
                  meta={plan.quotaHeadline}
                  description={plan.description}
                  onClick={() => onSelectPlan(plan.id)}
                >
                  <ul className="mt-auto flex w-full flex-col gap-1.5 border-t border-default pt-3 text-xs text-heading">
                    {plan.features.map((feature, index) => (
                      <li
                        key={feature}
                        className={`flex items-start gap-2 ${
                          index === 0 ? "font-semibold" : "text-muted"
                        }`}
                      >
                        <Icon
                          name="check"
                          size="xs"
                          strokeWidth={2.4}
                          className="mt-0.5 shrink-0"
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </ChoiceCard>
              );
            })}
      </div>

      <div
        className={`flex flex-wrap items-center gap-3 pt-2 ${
          onBack ? "justify-between" : "justify-end"
        }`}
      >
        {onBack && (
          <Button
            type="button"
            variant="outline"
            size="md"
            leftIcon={<Icon name="arrow-left" size="xs" />}
            onClick={onBack}
          >
            Volver a correo
          </Button>
        )}

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
