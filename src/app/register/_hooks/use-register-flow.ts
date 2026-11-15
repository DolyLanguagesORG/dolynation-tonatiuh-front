"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";

import { sanitizeRedirectPath, useAuth } from "@/context";
import { useLocale } from "@/i18n";
import { ApiClientError, ErrorCode } from "@/lib";

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
 * Hook de orquestación del Paso 1 de registro (`/register`).
 * Los pasos 2, 3 y 4 viven en rutas protegidas dedicadas (`/verify-email`,
 * `/select-plan` y `/setup-preferences`).
 */
export function useRegisterFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, t } = useLocale();
  const { register, isAuthenticated, onboarding } = useAuth();

  const redirectTarget = sanitizeRedirectPath(
    searchParams.get("redirect"),
    "/",
  );

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

  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const result = await register({
        email,
        password,
        fullName: buildFullName(firstName, lastName),
        locale,
      });

      if (result.needsEmailVerification) {
        router.replace("/verify-email");
      } else if (result.user.subscriptionTier === null) {
        router.replace("/select-plan");
      } else {
        router.replace(redirectTarget);
      }
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

  const loginHref =
    redirectTarget && redirectTarget !== "/"
      ? `/login?redirect=${encodeURIComponent(redirectTarget)}`
      : "/login";

  return {
    t,
    locale,
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
    isSubmitting,
    strength,
    strengthLabel,
    strengthTone,
    handleStep1Submit,
    loginHref,
  };
}
