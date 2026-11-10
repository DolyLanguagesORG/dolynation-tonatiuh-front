"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type FormEvent,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Container,
  Input,
} from "@/components/ui";
import {
  sanitizeRedirectPath,
  type SubscriptionPlanId,
  useAuth,
} from "@/context";
import { useLocale } from "@/i18n";
import { ApiClientError, ErrorCode } from "@/lib";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type TargetLanguageCode = "en" | "fr" | "es" | "it";

function evaluatePasswordStrength(password: string): {
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

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, t } = useLocale();
  const {
    user,
    register,
    isAuthenticated,
    onboarding,
    verifyEmailMock,
    selectPlanMock,
    selectLanguagesMock,
  } = useAuth();

  const redirectTarget = sanitizeRedirectPath(
    searchParams.get("redirect"),
    "/",
  );

  const initialStepParam = Number.parseInt(
    searchParams.get("step") ?? "1",
    10,
  );

  // Determinar paso inicial según el estado de la sesión
  const determineInitialStep = (): 1 | 2 | 3 | 4 => {
    if (initialStepParam >= 1 && initialStepParam <= 4) {
      return initialStepParam as 1 | 2 | 3 | 4;
    }
    if (!isAuthenticated) return 1;
    if (!onboarding.emailVerified) return 2;
    if (!onboarding.hasSelectedPlan) return 3;
    if (!onboarding.isOnboardingComplete) return 4;
    return 1;
  };

  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(
    determineInitialStep(),
  );

  // Paso 1: Datos de la cuenta
  const firstNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const termsRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [touched, setTouched] = useState<{
    firstName: boolean;
    email: boolean;
    password: boolean;
    acceptTerms: boolean;
  }>({
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

  // Paso 3: Selección de plan
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>(
    onboarding.subscriptionPlan ?? "doly_plus",
  );
  const [planError, setPlanError] = useState<string | null>(null);

  // Paso 4: Selección de idiomas
  const [selectedLanguages, setSelectedLanguages] = useState<
    TargetLanguageCode[]
  >(
    onboarding.selectedLanguages.length > 0
      ? (onboarding.selectedLanguages as TargetLanguageCode[])
      : ["en"],
  );
  const [languagesError, setLanguagesError] = useState<string | null>(null);

  // Si el usuario ya está autenticado y ha completado todo el onboarding, redirige a la app
  useEffect(() => {
    if (isAuthenticated && onboarding.isOnboardingComplete) {
      router.replace(redirectTarget);
    }
  }, [isAuthenticated, onboarding.isOnboardingComplete, redirectTarget, router]);

  // Si el usuario se autentica o cambia de estado, ajusta el paso correspondiente
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

  // Manejo de envío del Paso 1 (Creación de cuenta y generación de token)
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
      const fullName = buildFullName(firstName, lastName);
      await register({
        email,
        password,
        fullName,
      });
      // La cuenta se crea y el token de sesión queda generado en memoria
      setActiveStep(2);
    } catch (error) {
      if (error instanceof ApiClientError) {
        const userMessage = error.getUserMessage(locale);
        setApiError({
          code: error.code,
          message: userMessage,
        });

        if (error.code === ErrorCode.AUTH_EMAIL_ALREADY_EXISTS) {
          setFieldErrors((prev) => ({
            ...prev,
            email: userMessage,
          }));
          emailRef.current?.focus();
        } else if (error.code === ErrorCode.AUTH_PASSWORD_TOO_WEAK) {
          setFieldErrors((prev) => ({
            ...prev,
            password: userMessage,
          }));
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

  // Manejo del Paso 2 (Confirmación de correo hardcodeada)
  const handleConfirmEmail = (): void => {
    setIsVerifyingEmail(true);
    setTimeout(() => {
      verifyEmailMock();
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

  // Manejo del Paso 3 (Selección de plan de suscripción)
  const handleSelectPlan = (plan: SubscriptionPlanId): void => {
    setSelectedPlan(plan);
    setPlanError(null);
  };

  const handleStep3Submit = (): void => {
    if (!selectedPlan) {
      setPlanError(t.auth.stepper.step3Plan.selectPlanRequired);
      return;
    }
    selectPlanMock(selectedPlan);
    setActiveStep(4);
  };

  // Manejo del Paso 4 (Selección de idiomas según el plan)
  const activePlanLimit =
    selectedPlan === "doly" ? 1 : selectedPlan === "doly_plus" ? 2 : 4;

  const handleToggleLanguage = (code: TargetLanguageCode): void => {
    setLanguagesError(null);
    if (selectedLanguages.includes(code)) {
      if (selectedLanguages.length === 1) {
        setLanguagesError(t.auth.stepper.step4Languages.atLeastOneAlert);
        return;
      }
      setSelectedLanguages(selectedLanguages.filter((item) => item !== code));
    } else {
      if (
        selectedPlan !== "doly_vip" &&
        selectedLanguages.length >= activePlanLimit
      ) {
        setLanguagesError(
          t.auth.stepper.step4Languages.limitReachedAlert,
        );
        return;
      }
      setSelectedLanguages([...selectedLanguages, code]);
    }
  };

  const handleSelectAllLanguages = (): void => {
    if (selectedPlan === "doly_vip") {
      setSelectedLanguages(["en", "fr", "es", "it"]);
      setLanguagesError(null);
    }
  };

  const handleStep4Submit = (): void => {
    if (selectedLanguages.length === 0) {
      setLanguagesError(t.auth.stepper.step4Languages.atLeastOneAlert);
      return;
    }
    selectLanguagesMock(selectedLanguages);
    router.replace(redirectTarget);
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

  return (
    <Container
      size="md"
      className="flex w-full max-w-3xl flex-col items-center gap-6"
    >
      {/* Barra de progreso / Stepper de 4 pasos */}
      <nav
        aria-label="Progreso de registro"
        className="w-full rounded-base border border-default bg-neutral-primary-soft p-3 sm:p-4"
      >
        <ol className="flex items-center justify-between gap-1 sm:gap-2">
          {(
            [
              { step: 1, label: t.auth.stepper.steps.step1 },
              { step: 2, label: t.auth.stepper.steps.step2 },
              { step: 3, label: t.auth.stepper.steps.step3 },
              { step: 4, label: t.auth.stepper.steps.step4 },
            ] as const
          ).map((item, idx) => {
            const isCompleted =
              item.step < activeStep ||
              (item.step === 1 && isAuthenticated) ||
              (item.step === 2 && onboarding.emailVerified) ||
              (item.step === 3 && onboarding.hasSelectedPlan);

            const isCurrent = activeStep === item.step;
            // Elimina números prefijados redundantes para evitar duplicados tipo '01 01 Datos'
            const cleanLabel = item.label.replace(/^0?\d\s*/i, "").trim();

            return (
              <li
                key={item.step}
                className="flex flex-1 items-center gap-1 sm:gap-2"
              >
                <button
                  type="button"
                  disabled={!isCompleted && !isCurrent}
                  onClick={() => {
                    if (isCompleted) {
                      setActiveStep(item.step as 1 | 2 | 3 | 4);
                    }
                  }}
                  aria-current={isCurrent ? "step" : undefined}
                  className={[
                    "flex flex-1 items-center justify-center gap-1.5 rounded-xs px-2 py-2 text-[10px] font-bold tracking-wider uppercase transition-colors sm:gap-2 sm:px-3 sm:py-2.5 sm:text-xs",
                    isCurrent
                      ? "border border-brand bg-brand text-white shadow-xs"
                      : isCompleted
                        ? "border border-default-medium bg-surface text-ink font-semibold hover:bg-neutral-secondary-medium cursor-pointer"
                        : "border border-transparent bg-neutral-primary-soft text-muted cursor-default",
                  ].join(" ")}
                >
                  <span
                    aria-hidden="true"
                    className="font-mono font-bold shrink-0"
                  >
                    {isCompleted ? "✓" : `0${item.step}`}
                  </span>
                  <span className="whitespace-nowrap font-bold tracking-wider">
                    {cleanLabel}
                  </span>
                </button>
                {idx < 3 && (
                  <span
                    aria-hidden="true"
                    className="h-px w-2 bg-default sm:w-4 shrink-0"
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <Card padding="lg" className="w-full border-default bg-surface sm:p-8">
        <div className="flex flex-col gap-6">
          {/* ======================================================== */}
          {/* PASO 1: DATOS DE LA CUENTA */}
          {/* ======================================================== */}
          {activeStep === 1 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline">PASO 01 / 04</Badge>
                  <span className="text-[11px] font-semibold text-muted">
                    Creación de Cuenta
                  </span>
                </div>
                <h1
                  id="main-heading"
                  tabIndex={-1}
                  className="font-serif text-2xl font-normal tracking-tight text-ink sm:text-3xl"
                >
                  {t.auth.register.title}
                </h1>
                <p className="text-xs leading-relaxed text-muted">
                  {t.auth.register.subtitle}
                </p>
              </div>

              {/* Botón monocromático de Google */}
              <Button
                type="button"
                variant="secondary"
                size="md"
                fullWidth
                disabled={isSubmitting}
                onClick={() =>
                  setInfoNotice({
                    title: t.auth.oauthUnavailableTitle,
                    message: t.auth.oauthUnavailableMessage,
                  })
                }
                leftIcon={
                  <span
                    aria-hidden="true"
                    className="font-sans text-sm font-bold text-ink"
                  >
                    G
                  </span>
                }
                className="normal-case tracking-normal"
              >
                {t.auth.register.googleButton}
              </Button>

              {/* Separador */}
              <div className="flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[10px] font-bold tracking-widest text-subtle uppercase">
                  {t.auth.register.divider}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

              {infoNotice && (
                <Alert
                  variant="info"
                  title={infoNotice.title}
                  code="AUTH_NOTICE"
                  onDismiss={() => setInfoNotice(null)}
                >
                  {infoNotice.message}
                </Alert>
              )}

              {apiError && (
                <Alert
                  variant="error"
                  title={t.auth.register.errorBannerTitle}
                  code={apiError.code}
                  onDismiss={() => setApiError(null)}
                >
                  {apiError.message}
                </Alert>
              )}

              <form
                onSubmit={handleStep1Submit}
                noValidate
                className="flex flex-col gap-4"
              >
                {/* Fila Nombre + Apellidos */}
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
                    onChange={(event) => {
                      const nextFirst = event.target.value;
                      setFirstName(nextFirst);
                      if (touched.firstName) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          firstName: validateFirstName(nextFirst, lastName),
                        }));
                      }
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, firstName: true }));
                      setFieldErrors((prev) => ({
                        ...prev,
                        firstName: validateFirstName(firstName, lastName),
                      }));
                    }}
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
                    onChange={(event) => {
                      const nextLast = event.target.value;
                      setLastName(nextLast);
                      if (touched.firstName) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          firstName: validateFirstName(firstName, nextLast),
                        }));
                      }
                    }}
                  />
                </div>

                {/* Correo electrónico */}
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
                  onChange={(event) => {
                    const nextEmail = event.target.value;
                    setEmail(nextEmail);
                    if (touched.email) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        email: validateEmail(nextEmail),
                      }));
                    }
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, email: true }));
                    setFieldErrors((prev) => ({
                      ...prev,
                      email: validateEmail(email),
                    }));
                  }}
                />

                {/* Contraseña de acceso */}
                <div className="flex flex-col gap-2">
                  <Input
                    ref={passwordRef}
                    id="register-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    label={t.auth.register.passwordLabel}
                    placeholder="••••••••••••"
                    value={password}
                    disabled={isSubmitting}
                    required
                    aria-describedby="register-password-requirements"
                    error={touched.password ? fieldErrors.password : undefined}
                    labelAction={
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-pressed={showPassword}
                        className="text-[10px] font-bold tracking-wider text-muted uppercase transition-colors hover:text-ink"
                      >
                        {showPassword
                          ? t.auth.register.hidePasswordText
                          : t.auth.register.showPasswordText}
                      </button>
                    }
                    onChange={(event) => {
                      const nextPassword = event.target.value;
                      setPassword(nextPassword);
                      if (touched.password) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          password: validatePassword(nextPassword),
                        }));
                      }
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, password: true }));
                      setFieldErrors((prev) => ({
                        ...prev,
                        password: validatePassword(password),
                      }));
                    }}
                  />

                  {/* Indicador visual de 3 segmentos */}
                  <div
                    aria-hidden="true"
                    className="grid grid-cols-3 gap-1.5 pt-0.5"
                  >
                    {[1, 2, 3].map((segment) => (
                      <span
                        key={segment}
                        className={`h-1 rounded-xxs transition-colors ${
                          strength.activeSegments >= segment
                            ? "bg-brand"
                            : "bg-surface-muted"
                        }`}
                      />
                    ))}
                  </div>

                  <div
                    id="register-password-requirements"
                    className="flex items-center justify-between gap-2 text-[11px]"
                  >
                    <span className="text-muted">
                      {t.auth.register.passwordRequirementHint}
                    </span>
                    <span className="shrink-0 text-[10px] font-bold tracking-wider text-muted uppercase">
                      {strengthLabel}
                    </span>
                  </div>
                </div>

                {/* Casilla de aceptación de términos */}
                <div className="pt-1">
                  <Checkbox
                    ref={termsRef}
                    id="register-accept-terms"
                    name="acceptTerms"
                    checked={acceptTerms}
                    disabled={isSubmitting}
                    required
                    error={
                      touched.acceptTerms ? fieldErrors.acceptTerms : undefined
                    }
                    onChange={(event) => {
                      const nextChecked = event.target.checked;
                      setAcceptTerms(nextChecked);
                      setTouched((prev) => ({ ...prev, acceptTerms: true }));
                      setFieldErrors((prev) => ({
                        ...prev,
                        acceptTerms: validateTerms(nextChecked),
                      }));
                    }}
                    label={
                      <span>
                        {t.auth.register.termsPrefix}
                        <Link
                          href="/register#terminos"
                          className="font-semibold text-ink underline underline-offset-2 hover:text-muted"
                        >
                          {t.auth.register.termsServiceLink}
                        </Link>
                        {t.auth.register.termsMiddle}
                        <Link
                          href="/register#etica-datos"
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
                    rightIcon={<span aria-hidden="true">→</span>}
                    className="normal-case tracking-normal"
                  >
                    {isSubmitting
                      ? t.auth.register.submittingButton
                      : t.auth.register.submitButton}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 2: CONFIRMAR CORREO ELECTRÓNICO */}
          {/* ======================================================== */}
          {activeStep === 2 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline">PASO 02 / 04</Badge>
                  <Badge
                    variant={onboarding.emailVerified ? "success" : "warning"}
                  >
                    {onboarding.emailVerified
                      ? t.auth.stepper.step2VerifyEmail.verifiedBadge
                      : t.auth.stepper.step2VerifyEmail.pendingBadge}
                  </Badge>
                </div>
                <h1
                  id="main-heading"
                  tabIndex={-1}
                  className="font-serif text-2xl font-normal tracking-tight text-ink sm:text-3xl"
                >
                  {t.auth.stepper.step2VerifyEmail.title}
                </h1>
                <p className="text-xs leading-relaxed text-muted">
                  {t.auth.stepper.step2VerifyEmail.subtitle}
                </p>
              </div>

              {/* Caja destacada con la dirección de correo */}
              <div className="flex flex-col gap-2 rounded-xs border border-border-strong bg-neutral-secondary-medium p-4 text-center sm:p-5">
                <span className="text-[10px] font-bold tracking-widest text-muted uppercase">
                  EXPEDIENTE ASOCIADO
                </span>
                <span className="font-mono text-sm font-bold text-ink sm:text-base">
                  {registeredEmail}
                </span>
                <span className="text-xs text-muted">
                  {t.auth.stepper.step2VerifyEmail.sentNotice}
                </span>
              </div>

              {emailVerificationNotice && (
                <Alert
                  variant={onboarding.emailVerified ? "success" : "info"}
                  title="Estado de Verificación"
                  onDismiss={() => setEmailVerificationNotice(null)}
                >
                  {emailVerificationNotice}
                </Alert>
              )}

              <p className="text-xs leading-relaxed text-muted">
                {t.auth.stepper.step2VerifyEmail.instruction}
              </p>

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isVerifyingEmail}
                  disabled={onboarding.emailVerified}
                  onClick={handleConfirmEmail}
                  rightIcon={<span aria-hidden="true">✓</span>}
                  className="normal-case tracking-normal"
                >
                  {isVerifyingEmail
                    ? t.auth.stepper.step2VerifyEmail.confirmingButton
                    : onboarding.emailVerified
                      ? t.auth.stepper.step2VerifyEmail.verifiedBadge
                      : t.auth.stepper.step2VerifyEmail.confirmButton}
                </Button>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    isLoading={isResendingEmail}
                    onClick={handleResendEmail}
                  >
                    {isResendingEmail
                      ? t.auth.stepper.step2VerifyEmail.resendingButton
                      : t.auth.stepper.step2VerifyEmail.resendButton}
                  </Button>

                  {onboarding.emailVerified && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setActiveStep(3)}
                    >
                      {t.auth.stepper.step2VerifyEmail.nextStepButton}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 3: SELECCIÓN DE PLAN (DOLY, DOLY PLUS, DOLY VIP) */}
          {/* ======================================================== */}
          {activeStep === 3 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline">PASO 03 / 04</Badge>
                  <span className="text-[11px] font-semibold text-muted">
                    Suscripción Académica
                  </span>
                </div>
                <h1
                  id="main-heading"
                  tabIndex={-1}
                  className="font-serif text-2xl font-normal tracking-tight text-ink sm:text-3xl"
                >
                  {t.auth.stepper.step3Plan.title}
                </h1>
                <p className="text-xs leading-relaxed text-muted">
                  {t.auth.stepper.step3Plan.subtitle}
                </p>
              </div>

              {planError && (
                <Alert
                  variant="error"
                  title="Plan requerido"
                  onDismiss={() => setPlanError(null)}
                >
                  {planError}
                </Alert>
              )}

              {/* Grid de las 3 suscripciones (Doly, Doly Plus, Doly VIP) */}
              <div className="flex flex-col gap-4">
                {/* 1. Doly (Básica) */}
                <button
                  type="button"
                  onClick={() => handleSelectPlan("doly")}
                  aria-pressed={selectedPlan === "doly"}
                  className={[
                    "flex flex-col gap-3 rounded-xs border p-4 text-left transition-all sm:p-5",
                    selectedPlan === "doly"
                      ? "border-brand bg-neutral-secondary-medium shadow-sm ring-1 ring-brand"
                      : "border-border-strong bg-neutral-primary-soft hover:border-brand",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-lg font-bold text-ink sm:text-xl">
                        {t.auth.stepper.step3Plan.planDolyName}
                      </span>
                      <Badge variant="outline">
                        {t.auth.stepper.step3Plan.planDolyBadge}
                      </Badge>
                    </div>
                    {selectedPlan === "doly" && (
                      <Badge variant="primary">
                        {t.auth.stepper.step3Plan.currentSelection}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-2xl font-bold text-ink sm:text-3xl">
                      {t.auth.stepper.step3Plan.planDolyPrice}
                    </span>
                    <span className="text-xs text-muted">
                      {t.auth.stepper.step3Plan.planDolyPeriod}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-muted">
                    {t.auth.stepper.step3Plan.planDolyDesc}
                  </p>

                  <ul className="flex flex-col gap-1.5 border-t border-border pt-3 text-xs text-ink">
                    <li className="flex items-center gap-2 font-semibold">
                      <span aria-hidden="true" className="font-bold">✓</span>
                      <span>{t.auth.stepper.step3Plan.planDolyFeature1}</span>
                    </li>
                    <li className="flex items-center gap-2 text-muted">
                      <span aria-hidden="true">✓</span>
                      <span>{t.auth.stepper.step3Plan.planDolyFeature2}</span>
                    </li>
                    <li className="flex items-center gap-2 text-muted">
                      <span aria-hidden="true">✓</span>
                      <span>{t.auth.stepper.step3Plan.planDolyFeature3}</span>
                    </li>
                  </ul>
                </button>

                {/* 2. Doly Plus (Media) */}
                <button
                  type="button"
                  onClick={() => handleSelectPlan("doly_plus")}
                  aria-pressed={selectedPlan === "doly_plus"}
                  className={[
                    "flex flex-col gap-3 rounded-xs border p-4 text-left transition-all sm:p-5",
                    selectedPlan === "doly_plus"
                      ? "border-brand bg-neutral-secondary-medium shadow-sm ring-1 ring-brand"
                      : "border-border-strong bg-neutral-primary-soft hover:border-brand",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-lg font-bold text-ink sm:text-xl">
                        {t.auth.stepper.step3Plan.planDolyPlusName}
                      </span>
                      <Badge variant="primary">
                        {t.auth.stepper.step3Plan.planDolyPlusBadge}
                      </Badge>
                    </div>
                    {selectedPlan === "doly_plus" && (
                      <Badge variant="primary">
                        {t.auth.stepper.step3Plan.currentSelection}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-2xl font-bold text-ink sm:text-3xl">
                      {t.auth.stepper.step3Plan.planDolyPlusPrice}
                    </span>
                    <span className="text-xs text-muted">
                      {t.auth.stepper.step3Plan.planDolyPlusPeriod}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-muted">
                    {t.auth.stepper.step3Plan.planDolyPlusDesc}
                  </p>

                  <ul className="flex flex-col gap-1.5 border-t border-border pt-3 text-xs text-ink">
                    <li className="flex items-center gap-2 font-semibold">
                      <span aria-hidden="true" className="font-bold">✓</span>
                      <span>{t.auth.stepper.step3Plan.planDolyPlusFeature1}</span>
                    </li>
                    <li className="flex items-center gap-2 text-muted">
                      <span aria-hidden="true">✓</span>
                      <span>{t.auth.stepper.step3Plan.planDolyPlusFeature2}</span>
                    </li>
                    <li className="flex items-center gap-2 text-muted">
                      <span aria-hidden="true">✓</span>
                      <span>{t.auth.stepper.step3Plan.planDolyPlusFeature3}</span>
                    </li>
                    <li className="flex items-center gap-2 text-muted">
                      <span aria-hidden="true">✓</span>
                      <span>{t.auth.stepper.step3Plan.planDolyPlusFeature4}</span>
                    </li>
                  </ul>
                </button>

                {/* 3. Doly VIP (Máxima) */}
                <button
                  type="button"
                  onClick={() => handleSelectPlan("doly_vip")}
                  aria-pressed={selectedPlan === "doly_vip"}
                  className={[
                    "flex flex-col gap-3 rounded-xs border p-4 text-left transition-all sm:p-5",
                    selectedPlan === "doly_vip"
                      ? "border-brand bg-neutral-secondary-medium shadow-sm ring-1 ring-brand"
                      : "border-border-strong bg-neutral-primary-soft hover:border-brand",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-lg font-bold text-ink sm:text-xl">
                        {t.auth.stepper.step3Plan.planDolyVipName}
                      </span>
                      <Badge variant="outline">
                        {t.auth.stepper.step3Plan.planDolyVipBadge}
                      </Badge>
                    </div>
                    {selectedPlan === "doly_vip" && (
                      <Badge variant="primary">
                        {t.auth.stepper.step3Plan.currentSelection}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-2xl font-bold text-ink sm:text-3xl">
                      {t.auth.stepper.step3Plan.planDolyVipPrice}
                    </span>
                    <span className="text-xs text-muted">
                      {t.auth.stepper.step3Plan.planDolyVipPeriod}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-muted">
                    {t.auth.stepper.step3Plan.planDolyVipDesc}
                  </p>

                  <ul className="flex flex-col gap-1.5 border-t border-border pt-3 text-xs text-ink">
                    <li className="flex items-center gap-2 font-semibold">
                      <span aria-hidden="true" className="font-bold">✓</span>
                      <span>{t.auth.stepper.step3Plan.planDolyVipFeature1}</span>
                    </li>
                    <li className="flex items-center gap-2 text-muted">
                      <span aria-hidden="true">✓</span>
                      <span>{t.auth.stepper.step3Plan.planDolyVipFeature2}</span>
                    </li>
                    <li className="flex items-center gap-2 text-muted">
                      <span aria-hidden="true">✓</span>
                      <span>{t.auth.stepper.step3Plan.planDolyVipFeature3}</span>
                    </li>
                    <li className="flex items-center gap-2 text-muted">
                      <span aria-hidden="true">✓</span>
                      <span>{t.auth.stepper.step3Plan.planDolyVipFeature4}</span>
                    </li>
                  </ul>
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setActiveStep(2)}
                >
                  ← Volver a correo
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={handleStep3Submit}
                  rightIcon={<span aria-hidden="true">→</span>}
                  className="normal-case tracking-normal"
                >
                  {t.auth.stepper.step3Plan.submitButton}
                </Button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 4: SELECCIÓN DE IDIOMAS SEGÚN EL PLAN */}
          {/* ======================================================== */}
          {activeStep === 4 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline">PASO 04 / 04</Badge>
                  <Badge variant="secondary">
                    Plan:{" "}
                    {selectedPlan === "doly"
                      ? "Doly (1 idioma)"
                      : selectedPlan === "doly_plus"
                        ? "Doly Plus (hasta 2)"
                        : "Doly VIP (ilimitado)"}
                  </Badge>
                </div>
                <h1
                  id="main-heading"
                  tabIndex={-1}
                  className="font-serif text-2xl font-normal tracking-tight text-ink sm:text-3xl"
                >
                  {t.auth.stepper.step4Languages.title}
                </h1>
                <p className="text-xs leading-relaxed text-muted">
                  {selectedPlan === "doly"
                    ? t.auth.stepper.step4Languages.capacityDoly
                    : selectedPlan === "doly_plus"
                      ? t.auth.stepper.step4Languages.capacityDolyPlus
                      : t.auth.stepper.step4Languages.capacityDolyVip}
                </p>
              </div>

              {languagesError && (
                <Alert
                  variant="error"
                  title="Aviso de Idiomas"
                  onDismiss={() => setLanguagesError(null)}
                >
                  {languagesError}
                </Alert>
              )}

              {/* Conteo de selección y opción rápida */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                  <span>
                    {selectedLanguages.length} /{" "}
                    {selectedPlan === "doly_vip" ? "4" : activePlanLimit}{" "}
                    {t.auth.stepper.step4Languages.selectedCountText}
                  </span>
                </div>

                {selectedPlan === "doly_vip" && (
                  <button
                    type="button"
                    onClick={handleSelectAllLanguages}
                    className="text-xs font-semibold text-muted underline hover:text-ink"
                  >
                    {t.auth.stepper.step4Languages.selectAllButton}
                  </button>
                )}
              </div>

              {/* Botones de selección de idiomas */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {targetLanguageOptions.map((option) => {
                  const isSelected = selectedLanguages.includes(option.code);
                  return (
                    <button
                      key={option.code}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => handleToggleLanguage(option.code)}
                      className={[
                        "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xs border p-3 text-center transition-all",
                        isSelected
                          ? "border-brand bg-brand text-white shadow-sm"
                          : "border-border-strong bg-surface text-heading hover:border-brand hover:bg-neutral-secondary-medium",
                      ].join(" ")}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {option.label}
                      </span>
                      <span
                        className={`text-[10px] ${
                          isSelected ? "text-white/80" : "text-muted"
                        }`}
                      >
                        {isSelected ? "✓ Activo" : "+ Elegir"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setActiveStep(3)}
                >
                  ← Cambiar plan
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={handleStep4Submit}
                  rightIcon={<span aria-hidden="true">→</span>}
                  className="normal-case tracking-normal"
                >
                  {t.auth.stepper.step4Languages.submitButton}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Enlaces inferiores fuera de la tarjeta según el wireframe */}
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-xs text-muted">
          {t.auth.register.hasAccountPrompt}{" "}
          <Link
            href={loginHref}
            className="font-bold text-ink underline underline-offset-4 transition-colors hover:text-muted"
          >
            {t.auth.register.loginLink}
          </Link>
        </p>

        <p className="text-[10px] font-semibold tracking-widest text-subtle uppercase">
          {t.auth.register.copyrightNotice}
        </p>
      </div>
    </Container>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <Container
          size="md"
          role="status"
          aria-live="polite"
          className="flex w-full max-w-3xl flex-col gap-4"
        >
          <div className="h-[620px] w-full animate-pulse rounded-xs border border-border bg-surface" />
        </Container>
      }
    >
      <RegisterFormContent />
    </Suspense>
  );
}
