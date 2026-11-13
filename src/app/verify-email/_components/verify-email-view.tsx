"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { RegisterStepper } from "@/app/register/_components/register-stepper";
import {
  StepVerifyEmail,
  type VerifyEmailTokenState,
} from "@/app/register/_components/step-verify-email";
import { AuthShell } from "@/components/auth";
import { Badge, Container, SkeletonCard } from "@/components/ui";
import { useAuth } from "@/context";
import { useLocale } from "@/i18n";
import { ApiClientError, type VerifyEmailResponse } from "@/lib";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface TokenVerificationOutcome {
  token: string;
  status: "verified" | "error";
  message: string;
  nextRoute: string;
}

/**
 * Vista interactiva para `/verify-email`:
 * - Con `?token=...`: consume el enlace firmado y autentica al usuario hacia `/select-plan`.
 * - Sin token: sala de espera bloqueada con reenvío real y opción de cambiar cuenta.
 */
export function VerifyEmailView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, t } = useLocale();
  const {
    isLoading,
    isAuthenticated,
    onboarding,
    pendingVerificationEmail,
    verifyEmailWithToken,
    resendVerificationEmail,
    clearPendingVerification,
  } = useAuth();

  const tokenParam = searchParams.get("token")?.trim() ?? "";
  const s2 = t.auth.stepper.step2VerifyEmail;

  const verificationAttemptsRef = useRef<
    Map<string, Promise<VerifyEmailResponse>>
  >(new Map());
  const [tokenOutcome, setTokenOutcome] =
    useState<TokenVerificationOutcome | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [resendNotice, setResendNotice] = useState<{
    variant: "info" | "success" | "error";
    message: string;
  } | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (!tokenParam) {
      return;
    }

    let active = true;
    // Compartimos la misma promesa en vuelo entre montajes de React StrictMode
    // para no consumir dos veces un token de un solo uso ni perder el redirect.
    let attempt = verificationAttemptsRef.current.get(tokenParam);
    if (!attempt) {
      attempt = verifyEmailWithToken(tokenParam);
      verificationAttemptsRef.current.set(tokenParam, attempt);
    }

    attempt
      .then((payload) => {
        if (!active) return;
        const nextRoute =
          payload.user.subscriptionTier !== null ? "/" : "/select-plan";
        setTokenOutcome({
          token: tokenParam,
          status: "verified",
          message: s2.confirmedSuccessAlert,
          nextRoute,
        });
        router.replace(nextRoute);
      })
      .catch((error) => {
        if (!active) return;
        const message =
          error instanceof ApiClientError
            ? error.getUserMessage(locale)
            : s2.tokenInvalidMessage;
        setTokenOutcome({
          token: tokenParam,
          status: "error",
          message,
          nextRoute: "/select-plan",
        });
      });

    return () => {
      active = false;
    };
  }, [
    locale,
    router,
    s2.confirmedSuccessAlert,
    s2.tokenInvalidMessage,
    tokenParam,
    verifyEmailWithToken,
  ]);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [cooldownSeconds]);

  if (isLoading && !tokenParam) {
    return (
      <Container size="md" className="w-full max-w-3xl">
        <SkeletonCard lines={5} label={s2.verifyingBadge} />
      </Container>
    );
  }

  const matchedOutcome =
    tokenParam && tokenOutcome?.token === tokenParam ? tokenOutcome : null;

  const tokenState: VerifyEmailTokenState = tokenParam
    ? matchedOutcome
      ? matchedOutcome.status === "verified"
        ? "verified"
        : "invalid_token"
      : "verifying"
    : "waiting";

  const resolvedEmail = emailInput || pendingVerificationEmail || "";

  const activeStatusNotice = resendNotice
    ? resendNotice
    : matchedOutcome
      ? {
          variant:
            matchedOutcome.status === "verified"
              ? ("success" as const)
              : ("error" as const),
          message: matchedOutcome.message,
        }
      : null;

  const handleResend = async (): Promise<void> => {
    if (isResending || cooldownSeconds > 0) return;

    const targetEmail = resolvedEmail.trim();
    if (!EMAIL_PATTERN.test(targetEmail)) {
      setResendNotice({
        variant: "error",
        message: s2.resendEmailRequired,
      });
      return;
    }

    setIsResending(true);
    setResendNotice(null);
    try {
      await resendVerificationEmail(targetEmail);
      setCooldownSeconds(30);
      setResendNotice({
        variant: "success",
        message: s2.resendSuccessAlert,
      });
    } catch (error) {
      setResendNotice({
        variant: "error",
        message:
          error instanceof ApiClientError
            ? error.getUserMessage(locale)
            : s2.tokenInvalidMessage,
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleUseAnotherAccount = (): void => {
    clearPendingVerification();
    router.replace("/login");
  };

  const stepBadgeText = locale === "es" ? "PASO 02 / 04" : "STEP 02 / 04";
  const statusBadgeText =
    tokenState === "verified"
      ? s2.verifiedBadge
      : tokenState === "verifying"
        ? s2.verifyingBadge
        : tokenState === "invalid_token"
          ? s2.errorBadge
          : s2.pendingBadge;

  const statusBadgeVariant =
    tokenState === "verified"
      ? "success"
      : tokenState === "invalid_token"
        ? "error"
        : "warning";

  return (
    <AuthShell
      title={s2.title}
      subtitle={s2.subtitle}
      maxWidthClass="max-w-3xl"
      topSlot={
        <div className="flex flex-col gap-3">
          <RegisterStepper
            activeStep={2}
            isAuthenticated={isAuthenticated}
            onboarding={onboarding}
            stepsLabels={t.auth.stepper.steps}
          />
          <div className="flex items-center justify-between gap-2 px-1">
            <Badge variant="outline">{stepBadgeText}</Badge>
            <Badge variant={statusBadgeVariant}>{statusBadgeText}</Badge>
          </div>
        </div>
      }
      copyrightText={t.auth.register.copyrightNotice}
    >
      <StepVerifyEmail
        t={t}
        locale={locale}
        registeredEmail={resolvedEmail}
        allowEmailInput={!pendingVerificationEmail}
        onEmailChange={(value) => {
          setEmailInput(value);
          setResendNotice(null);
        }}
        tokenState={tokenState}
        statusNotice={activeStatusNotice}
        isResendingEmail={isResending}
        resendCooldownSeconds={cooldownSeconds}
        onDismissNotice={() => setResendNotice(null)}
        onResendEmail={handleResend}
        onContinueToPlan={() =>
          router.replace(matchedOutcome?.nextRoute ?? "/select-plan")
        }
        onUseAnotherAccount={handleUseAnotherAccount}
      />
    </AuthShell>
  );
}
