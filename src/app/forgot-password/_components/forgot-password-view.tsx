"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { FloatingLocaleSelector } from "@/components/layout/floating-locale-selector";
import {
  ActionLink,
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Eyebrow,
  Heading,
  Icon,
  Input,
  Text,
} from "@/components/ui";
import { formatMessage, useLocale } from "@/i18n";
import {
  ApiClientError,
  authService,
  ErrorCode,
  resolveErrorMessage,
} from "@/lib";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Vista `/forgot-password` conectada a `POST /api/v1/auth/forgot-password`.
 */
export function ForgotPasswordView() {
  const { locale, t } = useLocale();
  const fp = t.auth.forgotPassword;
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<{
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmed)) {
      setFieldError(fp.invalidEmailError);
      return;
    }

    setFieldError(null);
    setApiError(null);
    setIsSubmitting(true);

    try {
      await authService.forgotPassword({ email: trimmed });
      setEmailSent(true);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setApiError({
          message: err.getUserMessage(locale),
        });
      } else {
        setApiError({
          message: resolveErrorMessage(ErrorCode.UNKNOWN_ERROR, locale),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <FloatingLocaleSelector />

      <Container size="sm" className="flex flex-col items-center pt-20 pb-6 sm:pt-10 sm:pb-10">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <Eyebrow tone="muted">{fp.eyebrow}</Eyebrow>
        <Heading as="h1" id="main-heading" variant="display">
          {fp.title}
        </Heading>
        <Text variant="lead" tone="muted" className="max-w-md">
          {fp.subtitle}
        </Text>
      </div>

      <Card padding="lg" className="w-full max-w-md">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-2">
            <Eyebrow tone="muted">{fp.cardEyebrow}</Eyebrow>
            <Badge variant={emailSent ? "primary" : "outline"}>
              {emailSent ? fp.badgeSent : fp.badgeValidity}
            </Badge>
          </div>

          {apiError && (
            <Alert
              variant="error"
              title={fp.errorTitle}
              onDismiss={() => setApiError(null)}
            >
              {apiError.message}
            </Alert>
          )}

          {emailSent ? (
            <div className="flex flex-col gap-5">
              <Alert variant="success" title={fp.successTitle}>
                {formatMessage(fp.successBody, {
                  email: email.trim().toLowerCase(),
                })}
              </Alert>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEmailSent(false)}
                >
                  {fp.tryAnotherButton}
                </Button>
                <ActionLink
                  href="/login"
                  variant="primary"
                  size="sm"
                  leftIcon={<Icon name="arrow-left" size="xs" />}
                >
                  {fp.backToLoginButton}
                </ActionLink>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <Input
                id="forgot-password-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                label={fp.emailLabel}
                placeholder={fp.emailPlaceholder}
                value={email}
                disabled={isSubmitting}
                required
                error={fieldError ?? undefined}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (fieldError) setFieldError(null);
                }}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isSubmitting}
                rightIcon={<Icon name="arrow-right" size="md" />}
                className="normal-case tracking-normal"
              >
                {isSubmitting ? fp.sendingButton : fp.submitButton}
              </Button>
            </form>
          )}
        </div>
      </Card>

      <div className="mt-6 flex items-center gap-2 text-sm text-body">
        <span>{fp.rememberedPrompt}</span>
        <Link
          href="/login"
          className="font-semibold text-ink underline underline-offset-4 hover:text-muted"
        >
          {fp.signInLink}
        </Link>
      </div>
    </Container>
    </>
  );
}
