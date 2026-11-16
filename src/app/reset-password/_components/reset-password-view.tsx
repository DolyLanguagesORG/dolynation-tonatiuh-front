"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";

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
  PasswordInput,
  SegmentedMeter,
  Text,
} from "@/components/ui";
import { useLocale } from "@/i18n";
import {
  ApiClientError,
  authService,
  ErrorCode,
  resolveErrorMessage,
} from "@/lib";
import { evaluatePasswordStrength } from "@/lib/password-strength";

/**
 * Vista `/reset-password?token=...` conectada a `POST /api/v1/auth/reset-password`.
 */
export function ResetPasswordView() {
  const { locale, t } = useLocale();
  const rp = t.auth.resetPassword;
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(
    () => searchParams.get("token")?.trim() ?? "",
    [searchParams],
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<{
    code: string;
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const strength = useMemo(
    () => evaluatePasswordStrength(password, locale),
    [password, locale],
  );

  useEffect(() => {
    if (!isSuccess) {
      return;
    }
    const timer = window.setTimeout(() => {
      router.replace("/login?reset=success");
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [isSuccess, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError(null);

    if (!token) {
      setApiError({
        code: ErrorCode.AUTH_EMAIL_TOKEN_INVALID,
        message: resolveErrorMessage(
          ErrorCode.AUTH_EMAIL_TOKEN_INVALID,
          locale,
        ),
      });
      return;
    }

    if (password.length < 8 || password.length > 128) {
      setFieldError(rp.lengthError);
      return;
    }

    if (password !== confirmPassword) {
      setConfirmError(rp.mismatchError);
      return;
    }

    setFieldError(null);
    setConfirmError(null);
    setIsSubmitting(true);

    try {
      await authService.resetPassword({ token, password });
      setIsSuccess(true);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setApiError({
          code: err.code,
          message: err.getUserMessage(locale),
        });
      } else {
        setApiError({
          code: ErrorCode.UNKNOWN_ERROR,
          message: resolveErrorMessage(ErrorCode.UNKNOWN_ERROR, locale),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasInvalidOrMissingToken =
    !token || apiError?.code === ErrorCode.AUTH_EMAIL_TOKEN_INVALID;

  return (
    <Container size="sm" className="flex flex-col items-center py-6 sm:py-10">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <Eyebrow tone="muted">{rp.eyebrow}</Eyebrow>
        <Heading as="h1" id="main-heading" variant="display">
          {rp.title}
        </Heading>
        <Text variant="lead" tone="muted" className="max-w-md">
          {rp.subtitle}
        </Text>
      </div>

      <Card padding="lg" className="w-full max-w-md">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-2">
            <Eyebrow tone="muted">{rp.cardEyebrow}</Eyebrow>
            <Badge
              variant={
                isSuccess
                  ? "primary"
                  : hasInvalidOrMissingToken
                    ? "warning"
                    : "outline"
              }
            >
              {isSuccess
                ? rp.badgeUpdated
                : hasInvalidOrMissingToken
                  ? rp.badgeInvalid
                  : rp.badgeDetected}
            </Badge>
          </div>

          {!token && !isSuccess && (
            <Alert
              variant="error"
              code={ErrorCode.AUTH_EMAIL_TOKEN_INVALID}
              title={rp.missingTokenTitle}
            >
              {rp.missingTokenBody}
            </Alert>
          )}

          {apiError && (
            <Alert
              variant="error"
              title={rp.errorTitle}
              code={apiError.code}
              onDismiss={() => setApiError(null)}
            >
              {apiError.message}
            </Alert>
          )}

          {isSuccess ? (
            <div className="flex flex-col gap-4">
              <Alert variant="success" title={rp.successTitle}>
                {rp.successBody}
              </Alert>

              <ActionLink
                href="/login?reset=success"
                variant="primary"
                size="md"
                rightIcon={<Icon name="arrow-right" size="sm" />}
              >
                {rp.goToLoginButton}
              </ActionLink>
            </div>
          ) : !token ? (
            <div className="flex flex-col gap-3">
              <ActionLink
                href="/forgot-password"
                variant="primary"
                size="md"
                rightIcon={<Icon name="arrow-right" size="sm" />}
              >
                {rp.requestNewLinkButton}
              </ActionLink>
              <ActionLink href="/login" variant="secondary" size="sm">
                {rp.backToLoginButton}
              </ActionLink>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <PasswordInput
                  id="reset-password-new"
                  name="password"
                  autoComplete="new-password"
                  minLength={8}
                  label={rp.newPasswordLabel}
                  placeholder="••••••••••••"
                  value={password}
                  disabled={isSubmitting}
                  required
                  toggleStyle="text"
                  showLabel={rp.showPassword}
                  hideLabel={rp.hidePassword}
                  error={fieldError ?? undefined}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (fieldError) setFieldError(null);
                  }}
                />
                <SegmentedMeter
                  activeCount={strength.activeSegments}
                  total={3}
                  caption={rp.requirementsHint}
                  statusLabel={strength.label}
                  tone={strength.tone}
                />
              </div>

              <PasswordInput
                id="reset-password-confirm"
                name="confirmPassword"
                autoComplete="new-password"
                minLength={8}
                label={rp.confirmPasswordLabel}
                placeholder="••••••••••••"
                value={confirmPassword}
                disabled={isSubmitting}
                required
                toggleStyle="text"
                showLabel={rp.showPassword}
                hideLabel={rp.hidePassword}
                error={confirmError ?? undefined}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  if (confirmError) setConfirmError(null);
                }}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isSubmitting}
                rightIcon={<Icon name="check" size="sm" />}
                className="normal-case tracking-normal"
              >
                {isSubmitting ? rp.savingButton : rp.saveButton}
              </Button>

              {hasInvalidOrMissingToken && (
                <ActionLink
                  href="/forgot-password"
                  variant="secondary"
                  size="sm"
                >
                  {rp.requestAnotherLinkButton}
                </ActionLink>
              )}
            </form>
          )}
        </div>
      </Card>

      <div className="mt-6 flex items-center gap-2 text-sm text-body">
        <Link
          href="/login"
          className="font-semibold text-ink underline underline-offset-4 hover:text-muted"
        >
          {rp.footerBackLink}
        </Link>
      </div>
    </Container>
  );
}
