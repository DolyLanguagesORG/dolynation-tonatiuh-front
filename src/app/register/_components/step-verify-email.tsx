"use client";

import { Alert, Button, Eyebrow, Icon, Text } from "@/components/ui";
import { type Dictionary } from "@/i18n";

export interface StepVerifyEmailProps {
  t: Dictionary;
  registeredEmail: string;
  emailVerified: boolean;
  emailVerificationNotice: string | null;
  isVerifyingEmail: boolean;
  isResendingEmail: boolean;
  onDismissNotice: () => void;
  onConfirmEmail: () => void;
  onResendEmail: () => void;
  onNextStep: () => void;
}

/**
 * Paso 2 del onboarding: verificación de dirección de correo académico.
 */
export function StepVerifyEmail({
  t,
  registeredEmail,
  emailVerified,
  emailVerificationNotice,
  isVerifyingEmail,
  isResendingEmail,
  onDismissNotice,
  onConfirmEmail,
  onResendEmail,
  onNextStep,
}: StepVerifyEmailProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 rounded-base border border-default-medium bg-neutral-secondary-medium p-4 text-center sm:p-5">
        <Eyebrow tone="muted" className="text-[10px]">
          EXPEDIENTE ASOCIADO
        </Eyebrow>
        <span className="font-mono text-sm font-bold text-ink sm:text-base">
          {registeredEmail}
        </span>
        <Text variant="small" tone="muted">
          {t.auth.stepper.step2VerifyEmail.sentNotice}
        </Text>
      </div>

      {emailVerificationNotice && (
        <Alert
          variant={emailVerified ? "success" : "info"}
          title="Estado de Verificación"
          onDismiss={onDismissNotice}
        >
          {emailVerificationNotice}
        </Alert>
      )}

      <Text variant="small" tone="muted">
        {t.auth.stepper.step2VerifyEmail.instruction}
      </Text>

      <div className="flex flex-col gap-3 pt-2">
        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isVerifyingEmail}
          disabled={emailVerified}
          onClick={onConfirmEmail}
          rightIcon={<Icon name="check" size="md" />}
          className="normal-case tracking-normal"
        >
          {isVerifyingEmail
            ? t.auth.stepper.step2VerifyEmail.confirmingButton
            : emailVerified
              ? t.auth.stepper.step2VerifyEmail.verifiedBadge
              : t.auth.stepper.step2VerifyEmail.confirmButton}
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            isLoading={isResendingEmail}
            onClick={onResendEmail}
          >
            {isResendingEmail
              ? t.auth.stepper.step2VerifyEmail.resendingButton
              : t.auth.stepper.step2VerifyEmail.resendButton}
          </Button>

          {emailVerified && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              rightIcon={<Icon name="arrow-right" size="xs" />}
              onClick={onNextStep}
            >
              {t.auth.stepper.step2VerifyEmail.nextStepButton}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
