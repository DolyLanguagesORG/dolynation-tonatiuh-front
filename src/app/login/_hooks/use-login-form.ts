"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { sanitizeRedirectPath, useAuth } from "@/context";
import { useLocale } from "@/i18n";
import { ApiClientError, ErrorCode } from "@/lib";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Hook de lógica y validación para la vista de inicio de sesión (`/login`).
 */
export function useLoginForm() {
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

  const [touched, setTouched] = useState({
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

  const handleEmailChange = (nextValue: string): void => {
    setEmail(nextValue);
    if (touched.email) {
      setFieldErrors((prev) => ({
        ...prev,
        email: validateEmail(nextValue),
      }));
    }
  };

  const handlePasswordChange = (nextValue: string): void => {
    setPassword(nextValue);
    if (touched.password) {
      setFieldErrors((prev) => ({
        ...prev,
        password: validatePassword(nextValue),
      }));
    }
  };

  const handleEmailBlur = (): void => {
    setTouched((prev) => ({ ...prev, email: true }));
    setFieldErrors((prev) => ({ ...prev, email: validateEmail(email) }));
  };

  const handlePasswordBlur = (): void => {
    setTouched((prev) => ({ ...prev, password: true }));
    setFieldErrors((prev) => ({
      ...prev,
      password: validatePassword(password),
    }));
  };

  const showOAuthNotice = (): void => {
    setInfoNotice({
      title: t.auth.oauthUnavailableTitle,
      message: t.auth.oauthUnavailableMessage,
    });
  };

  const showPasswordRecoveryNotice = (): void => {
    setInfoNotice({
      title: t.auth.passwordRecoveryNoticeTitle,
      message: t.auth.passwordRecoveryNoticeMessage,
    });
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    if (isSubmitting) return;

    setApiError(null);
    setInfoNotice(null);

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    setTouched({ email: true, password: true });
    setFieldErrors({ email: emailError, password: passwordError });

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
      await login({ email, password });
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

  return {
    t,
    emailRef,
    passwordRef,
    email,
    password,
    rememberDevice,
    setRememberDevice,
    touched,
    fieldErrors,
    apiError,
    setApiError,
    infoNotice,
    setInfoNotice,
    isSubmitting,
    registerHref,
    handleEmailChange,
    handlePasswordChange,
    handleEmailBlur,
    handlePasswordBlur,
    showOAuthNotice,
    showPasswordRecoveryNotice,
    handleSubmit,
  };
}
