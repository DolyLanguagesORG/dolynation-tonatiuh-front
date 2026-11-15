"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { RegisterStepper } from "@/app/register/_components/register-stepper";
import { StepPlanSelection } from "@/app/register/_components/step-plan-selection";
import { AuthShell } from "@/components/auth";
import { Badge, Container, SkeletonCard } from "@/components/ui";
import { type SubscriptionPlanId, useAuth } from "@/context";
import { useLocale } from "@/i18n";
import { ApiClientError, subscriptionsService } from "@/lib";

/**
 * Vista dedicada para `/select-plan`: selección obligatoria de suscripción
 * tras confirmar el correo electrónico.
 */
export function SelectPlanView() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const {
    isLoading,
    accessPhase,
    isAuthenticated,
    onboarding,
    user,
    selectPlan,
  } = useAuth();

  const [pickedPlan, setPickedPlan] = useState<SubscriptionPlanId | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);

  // Precargamos el catálogo público para comprobar disponibilidad en segundo plano.
  useEffect(() => {
    subscriptionsService.getPlans().catch(() => undefined);
  }, []);

  if (
    isLoading ||
    (accessPhase !== "plan_required" && accessPhase !== "ready")
  ) {
    return (
      <Container size="none" className="w-full max-w-5xl px-0">
        <SkeletonCard
          lines={6}
          label={
            locale === "es"
              ? "Cargando planes de suscripción"
              : "Loading subscription plans"
          }
        />
      </Container>
    );
  }

  const effectivePlan: SubscriptionPlanId =
    pickedPlan ?? user?.subscriptionTier ?? onboarding.subscriptionPlan ?? "dolly_plus";

  const handleSubmitPlan = async (): Promise<void> => {
    if (!effectivePlan) {
      setPlanError(t.auth.stepper.step3Plan.selectPlanRequired);
      return;
    }
    if (isSubmittingPlan) return;

    setPlanError(null);
    setIsSubmittingPlan(true);
    try {
      await selectPlan(effectivePlan);
      router.replace("/setup-preferences");
    } catch (error) {
      if (error instanceof ApiClientError) {
        setPlanError(error.getUserMessage(locale));
      } else {
        setPlanError(
          locale === "es"
            ? "No fue posible registrar tu plan de suscripción. Inténtalo de nuevo."
            : "Could not save your subscription plan. Please try again.",
        );
      }
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  const stepBadge = locale === "es" ? "PASO 03 / 04" : "STEP 03 / 04";
  const sectionLabel =
    locale === "es" ? "Suscripción Académica" : "Academic Subscription";

  return (
    <AuthShell
      title={t.auth.stepper.step3Plan.title}
      subtitle={t.auth.stepper.step3Plan.subtitle}
      maxWidthClass="max-w-5xl"
      topSlot={
        <div className="flex flex-col gap-3">
          <RegisterStepper
            activeStep={3}
            isAuthenticated={isAuthenticated}
            onboarding={onboarding}
            stepsLabels={t.auth.stepper.steps}
          />
          <div className="flex items-center justify-between gap-2 px-1">
            <Badge variant="outline">{stepBadge}</Badge>
            <Badge variant="secondary">{sectionLabel}</Badge>
          </div>
        </div>
      }
      copyrightText={t.auth.register.copyrightNotice}
    >
      <StepPlanSelection
        t={t}
        selectedPlan={effectivePlan}
        planError={planError}
        isSubmittingPlan={isSubmittingPlan}
        onDismissError={() => setPlanError(null)}
        onSelectPlan={(plan) => {
          setPickedPlan(plan);
          setPlanError(null);
        }}
        onSubmit={handleSubmitPlan}
      />
    </AuthShell>
  );
}
