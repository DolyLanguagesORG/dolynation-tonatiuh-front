"use client";

import Link from "next/link";

import { RegisterStepper } from "@/app/register/_components/register-stepper";
import { StepAccountForm } from "@/app/register/_components/step-account-form";
import { StepLanguageSelection } from "@/app/register/_components/step-language-selection";
import { StepPlanSelection } from "@/app/register/_components/step-plan-selection";
import { StepVerifyEmail } from "@/app/register/_components/step-verify-email";
import { useRegisterFlow } from "@/app/register/_hooks/use-register-flow";
import { AuthShell } from "@/components/auth";
import { Badge } from "@/components/ui";

/**
 * Flujo modular de registro y onboarding en 4 pasos (`/register`).
 */
export function RegisterFlow() {
  const flow = useRegisterFlow();
  const { t, activeStep, selectedPlan } = flow;

  const stepMeta: Record<
    1 | 2 | 3 | 4,
    { title: string; subtitle: string; badge: string; label: string }
  > = {
    1: {
      title: t.auth.register.title,
      subtitle: t.auth.register.subtitle,
      badge: "PASO 01 / 04",
      label: "Creación de Cuenta",
    },
    2: {
      title: t.auth.stepper.step2VerifyEmail.title,
      subtitle: t.auth.stepper.step2VerifyEmail.subtitle,
      badge: "PASO 02 / 04",
      label: flow.onboarding.emailVerified
        ? t.auth.stepper.step2VerifyEmail.verifiedBadge
        : t.auth.stepper.step2VerifyEmail.pendingBadge,
    },
    3: {
      title: t.auth.stepper.step3Plan.title,
      subtitle: t.auth.stepper.step3Plan.subtitle,
      badge: "PASO 03 / 04",
      label: "Suscripción Académica",
    },
    4: {
      title: t.auth.stepper.step4Languages.title,
      subtitle:
        selectedPlan === "dolly"
          ? t.auth.stepper.step4Languages.capacityDoly
          : selectedPlan === "dolly_plus"
            ? t.auth.stepper.step4Languages.capacityDolyPlus
            : t.auth.stepper.step4Languages.capacityDolyPro,
      badge: "PASO 04 / 04",
      label:
        selectedPlan === "dolly"
          ? "Plan: Dolly (1 idioma)"
          : selectedPlan === "dolly_plus"
            ? "Plan: Dolly Plus (hasta 2)"
            : "Plan: Dolly Pro (hasta 4)",
    },
  };

  const currentMeta = stepMeta[activeStep];

  return (
    <AuthShell
      title={currentMeta.title}
      subtitle={currentMeta.subtitle}
      maxWidthClass="max-w-3xl"
      topSlot={
        <div className="flex flex-col gap-3">
          <RegisterStepper
            activeStep={activeStep}
            isAuthenticated={flow.isAuthenticated}
            onboarding={flow.onboarding}
            stepsLabels={t.auth.stepper.steps}
            onStepSelect={flow.setActiveStep}
          />
          <div className="flex items-center justify-between gap-2 px-1">
            <Badge variant="outline">{currentMeta.badge}</Badge>
            <Badge
              variant={
                activeStep === 2 && flow.onboarding.emailVerified
                  ? "success"
                  : activeStep === 2
                    ? "warning"
                    : "secondary"
              }
            >
              {currentMeta.label}
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
      {activeStep === 1 && (
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
          infoNotice={flow.infoNotice}
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
          onShowOAuthNotice={() =>
            flow.setInfoNotice({
              title: t.auth.oauthUnavailableTitle,
              message: t.auth.oauthUnavailableMessage,
            })
          }
          onDismissInfo={() => flow.setInfoNotice(null)}
          onDismissError={() => flow.setApiError(null)}
          onSubmit={flow.handleStep1Submit}
        />
      )}

      {activeStep === 2 && (
        <StepVerifyEmail
          t={t}
          registeredEmail={flow.registeredEmail}
          emailVerified={flow.onboarding.emailVerified}
          emailVerificationNotice={flow.emailVerificationNotice}
          isVerifyingEmail={flow.isVerifyingEmail}
          isResendingEmail={flow.isResendingEmail}
          onDismissNotice={() => flow.setEmailVerificationNotice(null)}
          onConfirmEmail={flow.handleConfirmEmail}
          onResendEmail={flow.handleResendEmail}
          onNextStep={() => flow.setActiveStep(3)}
        />
      )}

      {activeStep === 3 && (
        <StepPlanSelection
          t={t}
          selectedPlan={flow.selectedPlan}
          planError={flow.planError}
          isSubmittingPlan={flow.isSubmittingPlan}
          onDismissError={() => flow.setPlanError(null)}
          onSelectPlan={flow.handleSelectPlan}
          onBack={() => flow.setActiveStep(2)}
          onSubmit={flow.handleStep3Submit}
        />
      )}

      {activeStep === 4 && (
        <StepLanguageSelection
          t={t}
          selectedPlan={flow.selectedPlan}
          activePlanLimit={flow.activePlanLimit}
          selectedLanguages={flow.selectedLanguages}
          targetLanguageOptions={flow.targetLanguageOptions}
          languagesError={flow.languagesError}
          isSubmittingLanguages={flow.isSubmittingLanguages}
          onDismissError={() => flow.setLanguagesError(null)}
          onToggleLanguage={flow.handleToggleLanguage}
          onSelectAll={flow.handleSelectAllLanguages}
          onBack={() => flow.setActiveStep(3)}
          onSubmit={flow.handleStep4Submit}
        />
      )}
    </AuthShell>
  );
}
