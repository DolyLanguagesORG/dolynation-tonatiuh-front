"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { sanitizeRedirectPath, type SubscriptionPlanId, useAuth } from "@/context";
import { useLocale } from "@/i18n";
import {
  ApiClientError,
  ErrorCode,
  subscriptionsService,
  type SubscriptionPlanItem,
  type TargetLanguageCode,
} from "@/lib";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RegisterStepNumber = 1 | 2 | 3 | 4;

export function evaluatePasswordStrength(password: string): {
  activeSegments: 0 | 1 | 2 | 3;
  hasMinLength: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
} {
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9\s]/.test(password);

  if (!password) {
    return { activeSegments: 0, hasMinLength, hasNumber, hasSymbol };
  }

  let score = 0;
  if (hasMinLength) score += 1;
  if (hasNumber) score += 1;
  if (hasSymbol) score += 1;

  return {
    activeSegments: (score === 0 ? 1 : score) as 0 | 1 | 2 | 3,
    hasMinLength,
    hasNumber,
    hasSymbol,
  };
}

/**
 * Hook de orquestación del registro y onboarding en 4 pasos (`/register`).
 */
export function useRegisterFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, t } = useLocale();
  const {
    user,
    register,
    isAuthenticated,
    onboarding,
    confirmEmailVerification,
    selectPlan,
    selectLanguages,
  } = useAuth();

  const redirectTarget = sanitizeRedirectPath(
    searchParams.get("redirect"),
    "/",
  );

  const initialStepParam = Number.parseInt(
    searchParams.get("step") ?? "1",
    10,
  );

  const determineInitialStep = (): RegisterStepNumber => {
    if (initialStepParam >= 1 && initialStepParam <= 4) {
      return initialStepParam as RegisterStepNumber;
    }
    if (!isAuthenticated) return 1;
    if (!onboarding.emailVerified) return 2;
    if (!onboarding.hasSelectedPlan) return 3;
    if (!onboarding.isOnboardingComplete) return 4;
    return 1;
  };

  const [activeStep, setActiveStep] = useState<RegisterStepNumber>(
    determineInitialStep(),
  );

  // Paso 1: Datos de cuenta
  const firstNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const termsRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [touched, setTouched] = useState({
    firstName: false,
    email: false,
    password: false,
    acceptTerms: false,
  });

  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string;
    email?: string;
    password?: string;
    acceptTerms?: string;
  }>({});

  const [apiError, setApiError] = useState<{
    code: string;
    message: string;
  } | null>(null);

  const [infoNotice, setInfoNotice] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Paso 2: Confirmación de correo
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [emailVerificationNotice, setEmailVerificationNotice] = useState<
    string | null
  >(null);

  // Paso 3: Plan de suscripción
  const [plansCatalog, setPlansCatalog] = useState<SubscriptionPlanItem[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>(
    onboarding.subscriptionPlan ?? "dolly_plus",
  );
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  // Paso 4: Idiomas objetivo
  const [selectedLanguages, setSelectedLanguages] = useState<
    TargetLanguageCode[]
  >(
    onboarding.selectedLanguages.length > 0
      ? onboarding.selectedLanguages
      : ["en"],
  );
  const [isSubmittingLanguages, setIsSubmittingLanguages] = useState(false);
  const [languagesError, setLanguagesError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    subscriptionsService
      .getPlans()
      .then((res) => {
        if (!cancelled && Array.isArray(res.data)) {
          setPlansCatalog(res.data);
        }
      })
      .catch(() => {
        // Conservamos los textos localizados de respaldo si falla la precarga del catálogo público.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && onboarding.isOnboardingComplete) {
      router.replace(redirectTarget);
    }
  }, [isAuthenticated, onboarding.isOnboardingComplete, redirectTarget, router]);

  useEffect(() => {
    if (isAuthenticated) {
      if (!onboarding.emailVerified && activeStep < 2) {
        setActiveStep(2);
      } else if (
        onboarding.emailVerified &&
        !onboarding.hasSelectedPlan &&
        activeStep < 3
      ) {
        setActiveStep(3);
      } else if (
        onboarding.hasSelectedPlan &&
        !onboarding.isOnboardingComplete &&
        activeStep < 4
      ) {
        setActiveStep(4);
      }
    }
  }, [
    isAuthenticated,
    onboarding.emailVerified,
    onboarding.hasSelectedPlan,
    onboarding.isOnboardingComplete,
    activeStep,
  ]);

  const buildFullName = (first: string, last: string): string =>
    [first.trim(), last.trim()].filter(Boolean).join(" ");

  const validateFirstName = (
    first: string,
    last: string,
  ): string | undefined => {
    if (!first.trim()) {
      return t.auth.register.validationFirstNameRequired;
    }
    if (buildFullName(first, last).length > 255) {
      return t.auth.register.validationFirstNameMaxLength;
    }
    return undefined;
  };

  const validateEmail = (value: string): string | undefined => {
    const trimmed = value.trim();
    if (!trimmed) {
      return t.auth.register.validationEmailRequired;
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      return t.auth.register.validationEmailInvalid;
    }
    return undefined;
  };

  const validatePassword = (value: string): string | undefined => {
    if (value.length < 8) {
      return t.auth.register.validationPasswordMinLength;
    }
    return undefined;
  };

  const validateTerms = (checked: boolean): string | undefined => {
    if (!checked) {
      return t.auth.register.validationTermsRequired;
    }
    return undefined;
  };

  const strength = evaluatePasswordStrength(password);
  const strengthLabel =
    strength.hasMinLength && strength.hasNumber && strength.hasSymbol
      ? t.auth.register.passwordStrengthOptimal
      : strength.hasMinLength
        ? t.auth.register.passwordStrengthAcceptable
        : t.auth.register.passwordStrengthIncomplete;

  const strengthTone: "default" | "success" | "warning" =
    strength.activeSegments === 3
      ? "success"
      : strength.activeSegments === 2
        ? "warning"
        : "default";

  const handleStep1Submit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    if (isSubmitting) return;

    setApiError(null);
    setInfoNotice(null);

    const firstNameError = validateFirstName(firstName, lastName);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const termsError = validateTerms(acceptTerms);

    setTouched({
      firstName: true,
      email: true,
      password: true,
      acceptTerms: true,
    });
    setFieldErrors({
      firstName: firstNameError,
      email: emailError,
      password: passwordError,
      acceptTerms: termsError,
    });

    if (firstNameError) {
      firstNameRef.current?.focus();
      return;
    }
    if (emailError) {
      emailRef.current?.focus();
      return;
    }
    if (passwordError) {
      passwordRef.current?.focus();
      return;
    }
    if (termsError) {
      termsRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        email,
        password,
        fullName: buildFullName(firstName, lastName),
      });
      setActiveStep(2);
    } catch (error) {
      if (error instanceof ApiClientError) {
        const userMessage = error.getUserMessage(locale);
        setApiError({ code: error.code, message: userMessage });

        if (error.code === ErrorCode.AUTH_EMAIL_ALREADY_EXISTS) {
          setFieldErrors((prev) => ({ ...prev, email: userMessage }));
          emailRef.current?.focus();
        } else if (error.code === ErrorCode.AUTH_PASSWORD_TOO_WEAK) {
          setFieldErrors((prev) => ({ ...prev, password: userMessage }));
          passwordRef.current?.focus();
        } else if (
          error.code === ErrorCode.VALIDATION_ERROR &&
          Object.keys(error.fieldErrors).length > 0
        ) {
          setFieldErrors((prev) => ({
            ...prev,
            ...(error.fieldErrors.fullName
              ? { firstName: error.fieldErrors.fullName }
              : {}),
            ...(error.fieldErrors.email
              ? { email: error.fieldErrors.email }
              : {}),
            ...(error.fieldErrors.password
              ? { password: error.fieldErrors.password }
              : {}),
          }));
        }
      } else {
        setApiError({
          code: ErrorCode.UNKNOWN_ERROR,
          message:
            locale === "es"
              ? "Ocurrió un error inesperado al crear tu cuenta."
              : "An unexpected error occurred while creating your account.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmEmail = (): void => {
    setIsVerifyingEmail(true);
    setTimeout(() => {
      confirmEmailVerification();
      setIsVerifyingEmail(false);
      setEmailVerificationNotice(
        t.auth.stepper.step2VerifyEmail.confirmedSuccessAlert,
      );
      setTimeout(() => {
        setActiveStep(3);
      }, 1000);
    }, 600);
  };

  const handleResendEmail = (): void => {
    setIsResendingEmail(true);
    setTimeout(() => {
      setIsResendingEmail(false);
      setEmailVerificationNotice(
        t.auth.stepper.step2VerifyEmail.resendSuccessAlert,
      );
    }, 500);
  };

  const activePlanLimit =
    plansCatalog.find((plan) => plan.id === selectedPlan)?.maxLanguages ??
    (selectedPlan === "dolly" ? 1 : selectedPlan === "dolly_plus" ? 2 : 4);

  const handleSelectPlan = (plan: SubscriptionPlanId): void => {
    setSelectedPlan(plan);
    setPlanError(null);
  };

  const handleStep3Submit = async (): Promise<void> => {
    if (!selectedPlan) {
      setPlanError(t.auth.stepper.step3Plan.selectPlanRequired);
      return;
    }
    if (isSubmittingPlan) return;

    setPlanError(null);
    setIsSubmittingPlan(true);
    try {
      await selectPlan(selectedPlan);
      setSelectedLanguages((prev) => prev.slice(0, activePlanLimit));
      setActiveStep(4);
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

  const handleToggleLanguage = (code: TargetLanguageCode): void => {
    setLanguagesError(null);
    if (selectedLanguages.includes(code)) {
      if (selectedLanguages.length === 1) {
        setLanguagesError(t.auth.stepper.step4Languages.atLeastOneAlert);
        return;
      }
      setSelectedLanguages(selectedLanguages.filter((item) => item !== code));
    } else if (activePlanLimit === 1) {
      setSelectedLanguages([code]);
    } else {
      if (
        selectedPlan !== "dolly_pro" &&
        selectedLanguages.length >= activePlanLimit
      ) {
        setLanguagesError(t.auth.stepper.step4Languages.limitReachedAlert);
        return;
      }
      setSelectedLanguages([...selectedLanguages, code]);
    }
  };

  const handleSelectAllLanguages = (): void => {
    if (selectedPlan === "dolly_pro") {
      setSelectedLanguages(["en", "fr", "es", "it"]);
      setLanguagesError(null);
    }
  };

  const handleStep4Submit = async (): Promise<void> => {
    if (selectedLanguages.length === 0) {
      setLanguagesError(t.auth.stepper.step4Languages.atLeastOneAlert);
      return;
    }
    if (isSubmittingLanguages) return;

    setLanguagesError(null);
    setIsSubmittingLanguages(true);
    try {
      await selectLanguages(selectedLanguages);
      router.replace(redirectTarget);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setLanguagesError(error.getUserMessage(locale));
      } else {
        setLanguagesError(
          locale === "es"
            ? "No fue posible guardar tus idiomas de estudio. Inténtalo de nuevo."
            : "Could not save your study languages. Please try again.",
        );
      }
    } finally {
      setIsSubmittingLanguages(false);
    }
  };

  const targetLanguageOptions: readonly {
    code: TargetLanguageCode;
    label: string;
  }[] = [
    { code: "en", label: t.auth.register.targetLanguages.en },
    { code: "fr", label: t.auth.register.targetLanguages.fr },
    { code: "es", label: t.auth.register.targetLanguages.es },
    { code: "it", label: t.auth.register.targetLanguages.it },
  ];

  const registeredEmail = user?.email || email || "correo@universidad.edu";
  const loginHref =
    redirectTarget && redirectTarget !== "/"
      ? `/login?redirect=${encodeURIComponent(redirectTarget)}`
      : "/login";

  return {
    t,
    activeStep,
    setActiveStep,
    isAuthenticated,
    onboarding,
    firstNameRef,
    emailRef,
    passwordRef,
    termsRef,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    password,
    setPassword,
    acceptTerms,
    setAcceptTerms,
    touched,
    setTouched,
    fieldErrors,
    setFieldErrors,
    validateFirstName,
    validateEmail,
    validatePassword,
    validateTerms,
    apiError,
    setApiError,
    infoNotice,
    setInfoNotice,
    isSubmitting,
    strength,
    strengthLabel,
    strengthTone,
    handleStep1Submit,
    registeredEmail,
    isVerifyingEmail,
    isResendingEmail,
    emailVerificationNotice,
    setEmailVerificationNotice,
    handleConfirmEmail,
    handleResendEmail,
    selectedPlan,
    activePlanLimit,
    planError,
    setPlanError,
    isSubmittingPlan,
    handleSelectPlan,
    handleStep3Submit,
    selectedLanguages,
    languagesError,
    setLanguagesError,
    isSubmittingLanguages,
    targetLanguageOptions,
    handleToggleLanguage,
    handleSelectAllLanguages,
    handleStep4Submit,
    loginHref,
  };
}
