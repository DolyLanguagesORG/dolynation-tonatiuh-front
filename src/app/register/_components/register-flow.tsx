"use client";

import Link from "next/link";

import { RegisterStepper } from "@/app/register/_components/register-stepper";
import { StepAccountForm } from "@/app/register/_components/step-account-form";
import { useRegisterFlow } from "@/app/register/_hooks/use-register-flow";
import { AuthShell } from "@/components/auth";
import { Badge } from "@/components/ui";

/**
 * Vista de creación de cuenta (Paso 1 / 4) en `/register`.
 * Tras crear la cuenta redirige a `/verify-email` para confirmar el correo.
 */
export function RegisterFlow() {
  const flow = useRegisterFlow();
  const { t, locale } = flow;

  return (
    <AuthShell
      title={t.auth.register.title}
      subtitle={t.auth.register.subtitle}
      maxWidthClass="max-w-3xl"
      topSlot={
        <div className="flex flex-col gap-3">
          <RegisterStepper
            activeStep={1}
            isAuthenticated={flow.isAuthenticated}
            onboarding={flow.onboarding}
            stepsLabels={t.auth.stepper.steps}
          />
          <div className="flex items-center justify-between gap-2 px-1">
            <Badge variant="outline">
              {locale === "es" ? "PASO 01 / 04" : "STEP 01 / 04"}
            </Badge>
            <Badge variant="secondary">
              {locale === "es" ? "Creación de Cuenta" : "Account Creation"}
            </Badge>
          </div>
        </div>
      }
      footerPrompt={
        <>
          {t.auth.register.hasAccountPrompt}{" "}
          <Link
            href={flow.loginHref}
            className="font-bold text-ink underline underline-offset-4 transition-colors hover:text-muted"
          >
            {t.auth.register.loginLink}
          </Link>
        </>
      }
      copyrightText={t.auth.register.copyrightNotice}
    >
      <StepAccountForm
        t={t}
        firstNameRef={flow.firstNameRef}
        emailRef={flow.emailRef}
        passwordRef={flow.passwordRef}
        termsRef={flow.termsRef}
        firstName={flow.firstName}
        lastName={flow.lastName}
        email={flow.email}
        password={flow.password}
        acceptTerms={flow.acceptTerms}
        touched={flow.touched}
        fieldErrors={flow.fieldErrors}
        apiError={flow.apiError}
        isSubmitting={flow.isSubmitting}
        activeStrengthSegments={flow.strength.activeSegments}
        strengthLabel={flow.strengthLabel}
        strengthTone={flow.strengthTone}
        onFirstNameChange={(nextFirst) => {
          flow.setFirstName(nextFirst);
          if (flow.touched.firstName) {
            flow.setFieldErrors((prev) => ({
              ...prev,
              firstName: flow.validateFirstName(nextFirst, flow.lastName),
            }));
          }
        }}
        onFirstNameBlur={() => {
          flow.setTouched((prev) => ({ ...prev, firstName: true }));
          flow.setFieldErrors((prev) => ({
            ...prev,
            firstName: flow.validateFirstName(flow.firstName, flow.lastName),
          }));
        }}
        onLastNameChange={(nextLast) => {
          flow.setLastName(nextLast);
          if (flow.touched.firstName) {
            flow.setFieldErrors((prev) => ({
              ...prev,
              firstName: flow.validateFirstName(flow.firstName, nextLast),
            }));
          }
        }}
        onEmailChange={(nextEmail) => {
          flow.setEmail(nextEmail);
          if (flow.touched.email) {
            flow.setFieldErrors((prev) => ({
              ...prev,
              email: flow.validateEmail(nextEmail),
            }));
          }
        }}
        onEmailBlur={() => {
          flow.setTouched((prev) => ({ ...prev, email: true }));
          flow.setFieldErrors((prev) => ({
            ...prev,
            email: flow.validateEmail(flow.email),
          }));
        }}
        onPasswordChange={(nextPassword) => {
          flow.setPassword(nextPassword);
          if (flow.touched.password) {
            flow.setFieldErrors((prev) => ({
              ...prev,
              password: flow.validatePassword(nextPassword),
            }));
          }
        }}
        onPasswordBlur={() => {
          flow.setTouched((prev) => ({ ...prev, password: true }));
          flow.setFieldErrors((prev) => ({
            ...prev,
            password: flow.validatePassword(flow.password),
          }));
        }}
        onAcceptTermsChange={(nextChecked) => {
          flow.setAcceptTerms(nextChecked);
          flow.setTouched((prev) => ({ ...prev, acceptTerms: true }));
          flow.setFieldErrors((prev) => ({
            ...prev,
            acceptTerms: flow.validateTerms(nextChecked),
          }));
        }}
        onDismissError={() => flow.setApiError(null)}
        onSubmit={flow.handleStep1Submit}
      />
    </AuthShell>
  );
}
