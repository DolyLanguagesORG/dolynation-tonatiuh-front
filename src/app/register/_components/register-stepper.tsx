"use client";

import { type RegisterStepNumber } from "@/app/register/_hooks/use-register-flow";
import { Stepper, type StepperItem } from "@/components/ui";
import { type OnboardingState } from "@/context";
import { type Dictionary } from "@/i18n";

export interface RegisterStepperProps {
  activeStep: RegisterStepNumber;
  isAuthenticated: boolean;
  onboarding: OnboardingState;
  stepsLabels: Dictionary["auth"]["stepper"]["steps"];
  onStepSelect?: (step: RegisterStepNumber) => void;
}

/**
 * Enlace de dominio del flujo de onboarding sobre el primitivo global `Stepper`.
 */
export function RegisterStepper({
  activeStep,
  isAuthenticated,
  onboarding,
  stepsLabels,
  onStepSelect,
}: RegisterStepperProps) {
  const rawSteps: readonly { step: RegisterStepNumber; label: string }[] = [
    { step: 1, label: stepsLabels.step1 },
    { step: 2, label: stepsLabels.step2 },
    { step: 3, label: stepsLabels.step3 },
    { step: 4, label: stepsLabels.step4 },
  ];

  const items: StepperItem[] = rawSteps.map((item) => ({
    step: item.step,
    label: item.label.replace(/^0?\d\s*/i, "").trim(),
    isCurrent: activeStep === item.step,
    isCompleted:
      item.step < activeStep ||
      (item.step === 1 && (isAuthenticated || onboarding.emailVerified)) ||
      (item.step === 2 && onboarding.emailVerified) ||
      (item.step === 3 && onboarding.hasSelectedPlan) ||
      (item.step === 4 && onboarding.isOnboardingComplete),
  }));

  return (
    <Stepper
      ariaLabel="Progreso de registro"
      items={items}
      onStepSelect={
        onStepSelect
          ? (step) => onStepSelect(step as RegisterStepNumber)
          : undefined
      }
    />
  );
}
