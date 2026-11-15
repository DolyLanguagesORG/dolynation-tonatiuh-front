"use client";

import { Alert, Button, ChoiceChip, Icon } from "@/components/ui";
import { type SubscriptionPlanId } from "@/context";
import { type Dictionary } from "@/i18n";
import { type TargetLanguageCode } from "@/lib";

export interface StepLanguageSelectionProps {
  t: Dictionary;
  selectedPlan: SubscriptionPlanId;
  activePlanLimit: number;
  selectedLanguages: TargetLanguageCode[];
  targetLanguageOptions: readonly {
    code: TargetLanguageCode;
    label: string;
  }[];
  languagesError: string | null;
  isSubmittingLanguages: boolean;
  onDismissError: () => void;
  onToggleLanguage: (code: TargetLanguageCode) => void;
  onSelectAll: () => void;
  onBack: () => void;
  onSubmit: () => void;
}

/**
 * Paso 4 del onboarding: selección de idiomas objetivo según cuota del plan.
 */
export function StepLanguageSelection({
  t,
  selectedPlan,
  activePlanLimit,
  selectedLanguages,
  targetLanguageOptions,
  languagesError,
  isSubmittingLanguages,
  onDismissError,
  onToggleLanguage,
  onSelectAll,
  onBack,
  onSubmit,
}: StepLanguageSelectionProps) {
  return (
    <div className="flex flex-col gap-6">
      {languagesError && (
        <Alert
          variant="error"
          title="Aviso de Idiomas"
          onDismiss={onDismissError}
        >
          {languagesError}
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-default pb-3">
        <span className="font-mono text-xs font-semibold text-heading">
          {selectedLanguages.length} /{" "}
          {selectedPlan === "dolly_pro" ? "4" : activePlanLimit}{" "}
          {t.auth.stepper.step4Languages.selectedCountText}
        </span>

        {selectedPlan === "dolly_pro" && (
          <Button
            variant="ghost"
            size="xs"
            onClick={onSelectAll}
            className="h-auto min-h-0 px-0 py-0 text-xs font-semibold normal-case tracking-normal text-muted underline hover:bg-transparent hover:text-ink"
          >
            {t.auth.stepper.step4Languages.selectAllButton}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {targetLanguageOptions.map((option) => {
          const isSelected = selectedLanguages.includes(option.code);
          return (
            <ChoiceChip
              key={option.code}
              selected={isSelected}
              codePrefix={`[${option.code.toUpperCase()}]`}
              indicator="plus-check"
              onClick={() => onToggleLanguage(option.code)}
              className="min-h-12 justify-between px-3"
            >
              {option.label}
            </ChoiceChip>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4">
        <Button
          type="button"
          variant="outline"
          size="md"
          leftIcon={<Icon name="arrow-left" size="xs" />}
          onClick={onBack}
        >
          Cambiar plan
        </Button>

        <Button
          type="button"
          variant="primary"
          size="lg"
          isLoading={isSubmittingLanguages}
          onClick={onSubmit}
          rightIcon={<Icon name="arrow-right" size="md" />}
          className="normal-case tracking-normal"
        >
          {t.auth.stepper.step4Languages.submitButton}
        </Button>
      </div>
    </div>
  );
}
