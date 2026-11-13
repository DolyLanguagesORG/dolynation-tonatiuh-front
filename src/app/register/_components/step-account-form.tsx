"use client";

import Link from "next/link";
import { type FormEvent, type RefObject } from "react";

import {
  Alert,
  Button,
  Checkbox,
  Icon,
  Input,
  PasswordInput,
  SegmentedMeter,
} from "@/components/ui";
import { type Dictionary } from "@/i18n";

export interface StepAccountFormProps {
  t: Dictionary;
  firstNameRef: RefObject<HTMLInputElement | null>;
  emailRef: RefObject<HTMLInputElement | null>;
  passwordRef: RefObject<HTMLInputElement | null>;
  termsRef: RefObject<HTMLInputElement | null>;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  acceptTerms: boolean;
  touched: {
    firstName: boolean;
    email: boolean;
    password: boolean;
    acceptTerms: boolean;
  };
  fieldErrors: {
    firstName?: string;
    email?: string;
    password?: string;
    acceptTerms?: string;
  };
  apiError: { code: string; message: string } | null;
  isSubmitting: boolean;
  activeStrengthSegments: number;
  strengthLabel: string;
  strengthTone: "default" | "success" | "warning";
  onFirstNameChange: (value: string) => void;
  onFirstNameBlur: () => void;
  onLastNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onEmailBlur: () => void;
  onPasswordChange: (value: string) => void;
  onPasswordBlur: () => void;
  onAcceptTermsChange: (checked: boolean) => void;
  onDismissError: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

/**
 * Paso 1 del registro: datos personales, contraseña segura y términos éticos.
 */
export function StepAccountForm({
  t,
  firstNameRef,
  emailRef,
  passwordRef,
  termsRef,
  firstName,
  lastName,
  email,
  password,
  acceptTerms,
  touched,
  fieldErrors,
  apiError,
  isSubmitting,
  activeStrengthSegments,
  strengthLabel,
  strengthTone,
  onFirstNameChange,
  onFirstNameBlur,
  onLastNameChange,
  onEmailChange,
  onEmailBlur,
  onPasswordChange,
  onPasswordBlur,
  onAcceptTermsChange,
  onDismissError,
  onSubmit,
}: StepAccountFormProps) {
  return (
    <div className="flex flex-col gap-6">
      {apiError && (
        <Alert
          variant="error"
          title={t.auth.register.errorBannerTitle}
          code={apiError.code}
          onDismiss={onDismissError}
        >
          {apiError.message}
        </Alert>
      )}

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            ref={firstNameRef}
            id="register-first-name"
            name="givenName"
            type="text"
            autoComplete="given-name"
            label={t.auth.register.firstNameLabel}
            placeholder={t.auth.register.firstNamePlaceholder}
            value={firstName}
            disabled={isSubmitting}
            required
            error={touched.firstName ? fieldErrors.firstName : undefined}
            onChange={(event) => onFirstNameChange(event.target.value)}
            onBlur={onFirstNameBlur}
          />

          <Input
            id="register-last-name"
            name="familyName"
            type="text"
            autoComplete="family-name"
            label={t.auth.register.lastNameLabel}
            placeholder={t.auth.register.lastNamePlaceholder}
            value={lastName}
            disabled={isSubmitting}
            onChange={(event) => onLastNameChange(event.target.value)}
          />
        </div>

        <Input
          ref={emailRef}
          id="register-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          label={t.auth.register.emailLabel}
          placeholder={t.auth.register.emailPlaceholder}
          value={email}
          disabled={isSubmitting}
          required
          error={touched.email ? fieldErrors.email : undefined}
          onChange={(event) => onEmailChange(event.target.value)}
          onBlur={onEmailBlur}
        />

        <div className="flex flex-col gap-2">
          <PasswordInput
            ref={passwordRef}
            id="register-password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            label={t.auth.register.passwordLabel}
            placeholder="••••••••••••"
            value={password}
            disabled={isSubmitting}
            required
            toggleStyle="text"
            showLabel={t.auth.register.showPasswordText}
            hideLabel={t.auth.register.hidePasswordText}
            aria-describedby="register-password-requirements"
            error={touched.password ? fieldErrors.password : undefined}
            onChange={(event) => onPasswordChange(event.target.value)}
            onBlur={onPasswordBlur}
          />

          <div id="register-password-requirements">
            <SegmentedMeter
              activeCount={activeStrengthSegments}
              total={3}
              caption={t.auth.register.passwordRequirementHint}
              statusLabel={strengthLabel}
              tone={strengthTone}
            />
          </div>
        </div>

        <div className="pt-1">
          <Checkbox
            ref={termsRef}
            id="register-accept-terms"
            name="acceptTerms"
            checked={acceptTerms}
            disabled={isSubmitting}
            required
            error={touched.acceptTerms ? fieldErrors.acceptTerms : undefined}
            onChange={(event) => onAcceptTermsChange(event.target.checked)}
            label={
              <span>
                {t.auth.register.termsPrefix}
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-ink underline underline-offset-2 hover:text-muted"
                >
                  {t.auth.register.termsServiceLink}
                </Link>
                {t.auth.register.termsMiddle}
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-ink underline underline-offset-2 hover:text-muted"
                >
                  {t.auth.register.termsEthicsLink}
                </Link>
                .
              </span>
            }
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            rightIcon={<Icon name="arrow-right" size="md" />}
            className="normal-case tracking-normal"
          >
            {isSubmitting
              ? t.auth.register.submittingButton
              : t.auth.register.submitButton}
          </Button>
        </div>
      </form>
    </div>
  );
}
