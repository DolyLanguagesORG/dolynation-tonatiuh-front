"use client";

import { type RefObject } from "react";

import { TurnstileField } from "@/components/security";
import {
  Alert,
  Button,
  ChoiceCard,
  Icon,
  SkeletonCard,
  Textarea,
} from "@/components/ui";
import { type SubscriptionPlanId } from "@/context";
import { type Dictionary, useLocale } from "@/i18n";
import {
  type BillingConfigResponse,
  type SubscriptionPlanItem,
} from "@/lib";
import { useSubscriptionPlans } from "@/lib/hooks/use-subscription-plans";
import { formatPlanFromBackend } from "@/lib/plan-presentation";

export interface StepPlanSelectionProps {
  t: Dictionary;
  selectedPlan: SubscriptionPlanId;
  planError: string | null;
  isSubmittingPlan: boolean;
  plans?: readonly SubscriptionPlanItem[];
  billingConfig?: BillingConfigResponse | null;
  disabled?: boolean;
  submitLabel?: string;
  showMessageInput?: boolean;
  messageValue?: string;
  onMessageChange?: (value: string) => void;
  onDismissError: () => void;
  onSelectPlan: (plan: SubscriptionPlanId) => void;
  onBack?: () => void;
  backLabel?: string;
  isBackLoading?: boolean;
  onSubmit: () => void;
  captchaContainerRef?: RefObject<HTMLDivElement | null>;
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
  billingConfig,
  disabled = false,
  submitLabel,
  showMessageInput = false,
  messageValue = "",
  onMessageChange,
  onDismissError,
  onSelectPlan,
  onBack,
  backLabel,
  isBackLoading = false,
  onSubmit,
  captchaContainerRef,
}: StepPlanSelectionProps) {
  const { locale } = useLocale();
  const s3 = t.auth.stepper.step3Plan;
  const loadedPlans = useSubscriptionPlans(locale);
  const rawPlans =
    providedPlans && providedPlans.length > 0 ? providedPlans : loadedPlans.plans;
  const isLoadingPlans = !providedPlans && loadedPlans.isLoading;
  const plansLoadError = !providedPlans ? loadedPlans.error : null;

  const planDefinitions = rawPlans.map((plan) =>
    formatPlanFromBackend(plan, locale, billingConfig),
  );

  return (
    <div className="flex flex-col gap-6">
      {planError && (
        <Alert
          variant="error"
          title={t.plans.ui.requiredTitle}
          onDismiss={onDismissError}
        >
          {planError}
        </Alert>
      )}

      {plansLoadError && (
        <Alert variant="error" title={t.plans.ui.loadErrorTitle}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{plansLoadError}</span>
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={() => void loadedPlans.reload()}
            >
              {t.plans.ui.retryButton}
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
                label={t.plans.ui.loadingPlans}
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
                    <div className="flex flex-col gap-1">
                      <span className="font-serif text-lg font-bold text-heading sm:text-xl">
                        {plan.name}
                      </span>
                      {plan.priceLabel && (
                        <span className="font-mono text-xs font-bold tracking-wide text-heading">
                          {plan.priceLabel}
                        </span>
                      )}
                    </div>
                  }
                  meta={plan.quotaHeadline}
                  description={plan.description}
                  disabled={disabled}
                  onClick={() => {
                    if (!disabled) {
                      onSelectPlan(plan.id);
                    }
                  }}
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

      {showMessageInput && !disabled && (
        <Textarea
          label={s3.messageLabel}
          placeholder={s3.messagePlaceholder}
          hint={s3.messageHint}
          maxLength={1000}
          rows={3}
          value={messageValue}
          onChange={(event) => onMessageChange?.(event.target.value)}
        />
      )}

      {captchaContainerRef && (
        <TurnstileField containerRef={captchaContainerRef} />
      )}

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
            disabled={isSubmittingPlan || isBackLoading}
            isLoading={isBackLoading}
            leftIcon={<Icon name="arrow-left" size="xs" />}
            onClick={onBack}
          >
            {backLabel ?? t.plans.ui.backToEmailButton}
          </Button>
        )}

        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={disabled || isSubmittingPlan || isBackLoading}
          isLoading={isSubmittingPlan}
          onClick={onSubmit}
          rightIcon={<Icon name="arrow-right" size="md" />}
          className="normal-case tracking-normal"
        >
          {submitLabel ?? s3.submitButton}
        </Button>
      </div>
    </div>
  );
}
