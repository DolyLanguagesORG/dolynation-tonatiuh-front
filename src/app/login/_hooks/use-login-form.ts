"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { useTurnstile } from "@/components/security";
import { sanitizeRedirectPath, useAuth } from "@/context";
import { useNavigationGuard } from "@/hooks";
import { useLocale } from "@/i18n";
import {
  ApiClientError,
  ErrorCode,
  isValidInviteRedirectPath,
  resolveErrorMessage,
  savePendingInviteRedirect,
} from "@/lib";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Hook de lógica y validación para la vista de inicio de sesión (`/login`).
 */
export function useLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, t } = useLocale();
  const { login, isAuthenticated, user, accessPhase } = useAuth();
  const captcha = useTurnstile("login");

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
    message: string;
  } | null>(null);

  const [infoNotice, setInfoNotice] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { allowNextNavigation } = useNavigationGuard({
    active: isSubmitting,
    message: t.navigationGuard.authInProgressMessage,
  });

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      setInfoNotice({
        title: t.auth.login.resetSuccessTitle,
        message: t.auth.login.resetSuccessMessage,
      });
    }
  }, [searchParams, t.auth.login.resetSuccessMessage, t.auth.login.resetSuccessTitle]);

  const oauthErrorParam = searchParams.get("oauthError");
  useEffect(() => {
    if (oauthErrorParam) {
      setApiError({
        message: resolveErrorMessage(oauthErrorParam, locale),
      });
    }
  }, [locale, oauthErrorParam]);

  useEffect(() => {
    if (isValidInviteRedirectPath(redirectTarget)) {
      savePendingInviteRedirect(redirectTarget);
    }
  }, [redirectTarget]);

  useEffect(() => {
    if (isAuthenticated) {
      const destination =
        user?.role === "admin"
          ? "/admin"
          : accessPhase === "plan_required"
            ? "/select-plan"
            : redirectTarget;
      allowNextNavigation();
      router.replace(destination);
    }
  }, [
    accessPhase,
    allowNextNavigation,
    isAuthenticated,
    redirectTarget,
    router,
    user?.role,
  ]);

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

  const clearNotices = (): void => {
    setInfoNotice(null);
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
      const captchaToken = await captcha.execute("login");
      const loggedUser = captchaToken
        ? await login({ email, password }, { captchaToken })
        : await login({ email, password });
      allowNextNavigation();
      if (loggedUser.role === "admin") {
        router.replace("/admin");
      } else if (loggedUser.subscriptionTier === null) {
        router.replace("/select-plan");
      } else {
        router.replace(redirectTarget);
      }
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.code === ErrorCode.AUTH_EMAIL_NOT_VERIFIED) {
          allowNextNavigation();
          router.replace("/verify-email");
          return;
        }
        setApiError({
          message: error.getUserMessage(locale),
        });

        if (
          error.code === ErrorCode.VALIDATION_ERROR &&
          Object.keys(error.fieldErrors).length > 0
        ) {
          setFieldErrors((prev) => ({
            ...prev,
            ...(error.fieldErrors.email
              ? { email: t.auth.login.validationEmailInvalid }
              : {}),
            ...(error.fieldErrors.password
              ? { password: t.auth.login.validationPasswordRequired }
              : {}),
          }));
        }
      } else {
        setApiError({
          message: t.auth.login.unexpectedError,
        });
      }
    } finally {
      captcha.reset();
      setIsSubmitting(false);
    }
  };

  const registerHref =
    redirectTarget && redirectTarget !== "/"
      ? `/register?redirect=${encodeURIComponent(redirectTarget)}`
      : "/register";

  return {
    t,
    captchaContainerRef: captcha.containerRef,
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
    redirectTarget,
    registerHref,
    handleEmailChange,
    handlePasswordChange,
    handleEmailBlur,
    handlePasswordBlur,
    clearNotices,
    handleSubmit,
  };
}
