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
  Button,
  Card,
  Checkbox,
  Container,
  Input,
} from "@/components/ui";
import { sanitizeRedirectPath, useAuth } from "@/context";
import { useLocale } from "@/i18n";
import { ApiClientError, ErrorCode } from "@/lib";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, t } = useLocale();
  const { login, isAuthenticated } = useAuth();

  const redirectTarget = sanitizeRedirectPath(
    searchParams.get("redirect"),
    "/",
  );

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [touched, setTouched] = useState<{
    email: boolean;
    password: boolean;
  }>({
    email: false,
    password: false,
  });

  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
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

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectTarget);
    }
  }, [isAuthenticated, redirectTarget, router]);

  const validateEmail = (value: string): string | undefined => {
    const trimmed = value.trim();
    if (!trimmed) {
      return t.auth.login.validationEmailRequired;
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      return t.auth.login.validationEmailInvalid;
    }
    return undefined;
  };

  const validatePassword = (value: string): string | undefined => {
    if (!value) {
      return t.auth.login.validationPasswordRequired;
    }
    return undefined;
  };

  const handleEmailBlur = (): void => {
    setTouched((prev) => ({ ...prev, email: true }));
    setFieldErrors((prev) => ({
      ...prev,
      email: validateEmail(email),
    }));
  };

  const handlePasswordBlur = (): void => {
    setTouched((prev) => ({ ...prev, password: true }));
    setFieldErrors((prev) => ({
      ...prev,
      password: validatePassword(password),
    }));
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setApiError(null);
    setInfoNotice(null);

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    setTouched({ email: true, password: true });
    setFieldErrors({
      email: emailError,
      password: passwordError,
    });

    if (emailError) {
      emailRef.current?.focus();
      return;
    }
    if (passwordError) {
      passwordRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        email,
        password,
      });
      router.replace(redirectTarget);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setApiError({
          code: error.code,
          message: error.getUserMessage(locale),
        });

        if (
          error.code === ErrorCode.VALIDATION_ERROR &&
          Object.keys(error.fieldErrors).length > 0
        ) {
          setFieldErrors((prev) => ({
            ...prev,
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
              ? "Ocurrió un error inesperado al iniciar sesión."
              : "An unexpected error occurred while signing in.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const registerHref =
    redirectTarget && redirectTarget !== "/"
      ? `/register?redirect=${encodeURIComponent(redirectTarget)}`
      : "/register";

  return (
    <Container
      size="sm"
      className="flex w-full max-w-[460px] flex-col items-center gap-6 px-0"
    >
      <Card padding="lg" className="w-full border-default bg-surface sm:p-8">
        <div className="flex flex-col gap-6">
          {/* Encabezado editorial */}
          <div className="flex flex-col gap-2">
            <h1
              id="main-heading"
              tabIndex={-1}
              className="font-serif text-2xl font-normal tracking-tight text-ink sm:text-3xl"
            >
              {t.auth.login.title}
            </h1>
            <p className="text-xs leading-relaxed text-muted">
              {t.auth.login.subtitle}
            </p>
          </div>

          {/* Botón monocromático de Google (según wireframe) */}
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
            {t.auth.login.googleButton}
          </Button>

          {/* Separador */}
          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-bold tracking-widest text-subtle uppercase">
              {t.auth.login.divider}
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
              title={t.auth.login.errorBannerTitle}
              code={apiError.code}
              onDismiss={() => setApiError(null)}
            >
              {apiError.message}
            </Alert>
          )}

          {/* Formulario de inicio de sesión */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-4"
          >
            <Input
              ref={emailRef}
              id="login-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              label={t.auth.login.emailLabel}
              placeholder={t.auth.login.emailPlaceholder}
              value={email}
              disabled={isSubmitting}
              required
              error={touched.email ? fieldErrors.email : undefined}
              onChange={(event) => {
                const nextValue = event.target.value;
                setEmail(nextValue);
                if (touched.email) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    email: validateEmail(nextValue),
                  }));
                }
              }}
              onBlur={handleEmailBlur}
            />

            <Input
              ref={passwordRef}
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              label={t.auth.login.passwordLabel}
              placeholder="••••••••"
              value={password}
              disabled={isSubmitting}
              required
              error={touched.password ? fieldErrors.password : undefined}
              labelAction={
                <button
                  type="button"
                  onClick={() =>
                    setInfoNotice({
                      title: t.auth.passwordRecoveryNoticeTitle,
                      message: t.auth.passwordRecoveryNoticeMessage,
                    })
                  }
                  className="font-medium text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
                >
                  {t.auth.login.forgotPasswordLink}
                </button>
              }
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword
                      ? t.auth.login.hidePasswordAria
                      : t.auth.login.showPasswordAria
                  }
                  aria-pressed={showPassword}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-xs text-muted transition-colors hover:text-ink"
                >
                  {showPassword ? (
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              }
              onChange={(event) => {
                const nextValue = event.target.value;
                setPassword(nextValue);
                if (touched.password) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    password: validatePassword(nextValue),
                  }));
                }
              }}
              onBlur={handlePasswordBlur}
            />

            <div className="pt-0.5">
              <Checkbox
                id="login-remember-device"
                name="rememberDevice"
                checked={rememberDevice}
                disabled={isSubmitting}
                onChange={(event) => setRememberDevice(event.target.checked)}
                label={t.auth.login.rememberDeviceLabel}
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
                  ? t.auth.login.submittingButton
                  : t.auth.login.submitButton}
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {/* Enlaces inferiores fuera de la tarjeta según el wireframe */}
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-xs text-muted">
          {t.auth.login.noAccountPrompt}{" "}
          <Link
            href={registerHref}
            className="font-bold text-ink underline underline-offset-4 transition-colors hover:text-muted"
          >
            {t.auth.login.registerLink}
          </Link>
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-semibold tracking-widest text-subtle uppercase">
          <Link href="/login#terminos" className="hover:text-ink">
            {t.auth.login.academicTerms}
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/login#privacidad" className="hover:text-ink">
            {t.auth.login.privacyPolicy}
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/login#soporte" className="hover:text-ink">
            {t.auth.login.technicalSupport}
          </Link>
        </div>
      </div>
    </Container>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Container
          size="sm"
          role="status"
          aria-live="polite"
          className="flex w-full max-w-[460px] flex-col gap-4"
        >
          <div className="h-[460px] w-full animate-pulse rounded-xs border border-border bg-surface" />
        </Container>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
