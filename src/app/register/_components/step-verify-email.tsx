"use client";

import { Alert, Button, Eyebrow, Icon, Input, Text } from "@/components/ui";
import { type Dictionary, type Locale } from "@/i18n";

export type VerifyEmailTokenState =
  | "waiting"
  | "verifying"
  | "verified"
  | "invalid_token";

export interface StepVerifyEmailProps {
  t: Dictionary;
  locale: Locale;
  registeredEmail: string;
  allowEmailInput?: boolean;
  onEmailChange?: (value: string) => void;
  tokenState: VerifyEmailTokenState;
  statusNotice: { variant: "info" | "success" | "error"; message: string } | null;
  isResendingEmail: boolean;
  resendCooldownSeconds?: number;
  onDismissNotice: () => void;
  onResendEmail: () => void;
  onContinueToPlan?: () => void;
  onUseAnotherAccount?: () => void;
}

/**
 * Paso 2 del onboarding: sala de espera y validación de enlace firmado por correo.
 */
export function StepVerifyEmail({
  t,
  locale,
  registeredEmail,
  allowEmailInput = false,
  onEmailChange,
  tokenState,
  statusNotice,
  isResendingEmail,
  resendCooldownSeconds = 0,
  onDismissNotice,
  onResendEmail,
  onContinueToPlan,
  onUseAnotherAccount,
}: StepVerifyEmailProps) {
  const s2 = t.auth.stepper.step2VerifyEmail;
  const isResendDisabled =
    isResendingEmail ||
    resendCooldownSeconds > 0 ||
    tokenState === "verifying" ||
    tokenState === "verified";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 rounded-base border border-default-medium bg-neutral-secondary-medium p-4 text-center sm:p-5">
        <Eyebrow tone="muted" className="text-[10px]">
          {locale === "es" ? "EXPEDIENTE ASOCIADO" : "ASSOCIATED ACCOUNT"}
        </Eyebrow>
        {registeredEmail && !allowEmailInput ? (
          <span className="font-mono text-sm font-bold text-ink sm:text-base">
            {registeredEmail}
          </span>
        ) : (
          <div className="mx-auto w-full max-w-sm text-left">
            <Input
              type="email"
              label={s2.emailInputLabel}
              placeholder={s2.emailInputPlaceholder}
              value={registeredEmail}
              onChange={(event) => onEmailChange?.(event.target.value)}
            />
          </div>
        )}
        <Text variant="small" tone="muted">
          {s2.sentNotice}
        </Text>
      </div>

      {statusNotice && (
        <Alert
          variant={statusNotice.variant}
          title={
            statusNotice.variant === "error"
              ? locale === "es"
                ? "Error de verificación"
                : "Verification error"
              : locale === "es"
                ? "Estado de verificación"
                : "Verification status"
          }
          onDismiss={tokenState === "verifying" ? undefined : onDismissNotice}
        >
          {statusNotice.message}
        </Alert>
      )}

      {tokenState === "verifying" ? (
        <div className="flex items-center justify-center gap-3 rounded-base border border-default bg-neutral-primary-soft p-5 text-sm font-medium text-ink">
          <Icon name="clock" size="md" className="animate-spin text-brand" />
          <span>{s2.verifyingNotice}</span>
        </div>
      ) : (
        <Text variant="small" tone="muted">
          {s2.instruction}
        </Text>
      )}

      <div className="flex flex-col gap-3 pt-1">
        {tokenState === "verified" && onContinueToPlan ? (
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            rightIcon={<Icon name="arrow-right" size="md" />}
            onClick={onContinueToPlan}
            className="normal-case tracking-normal"
          >
            {s2.nextStepButton}
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isResendingEmail}
            disabled={isResendDisabled}
            onClick={onResendEmail}
            className="normal-case tracking-normal"
          >
            {isResendingEmail
              ? s2.resendingButton
              : resendCooldownSeconds > 0
                ? `${s2.resendCooldownPrefix} (${resendCooldownSeconds}s)`
                : s2.resendButton}
          </Button>
        )}

        {onUseAnotherAccount && tokenState !== "verified" && (
          <div className="flex justify-center pt-1">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              disabled={tokenState === "verifying"}
              onClick={onUseAnotherAccount}
              className="text-xs font-semibold normal-case tracking-normal text-muted underline underline-offset-4 hover:bg-transparent hover:text-ink"
            >
              {s2.useAnotherAccountButton}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
