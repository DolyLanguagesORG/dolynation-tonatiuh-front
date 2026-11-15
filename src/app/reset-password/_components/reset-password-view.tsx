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
  const { locale } = useLocale();
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
      setFieldError(
        locale === "es"
          ? "La contraseña debe tener entre 8 y 128 caracteres."
          : "Password must be between 8 and 128 characters.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setConfirmError(
        locale === "es"
          ? "Las contraseñas no coinciden."
          : "Passwords do not match.",
      );
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
        <Eyebrow tone="muted">
          {locale === "es"
            ? "ACTUALIZACIÓN DE CREDENCIALES"
            : "CREDENTIAL UPDATE"}
        </Eyebrow>
        <Heading as="h1" id="main-heading" variant="display">
          {locale === "es" ? "Nueva Contraseña" : "Set New Password"}
        </Heading>
        <Text variant="lead" tone="muted" className="max-w-md">
          {locale === "es"
            ? "Define una nueva contraseña segura. Al confirmar, cerraremos tus sesiones activas anteriores por seguridad."
            : "Choose a new strong password. Confirming will revoke previous active sessions for your security."}
        </Text>
      </div>

      <Card padding="lg" className="w-full max-w-md">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-2">
            <Eyebrow tone="muted">
              {locale === "es" ? "VALIDACIÓN DE TOKEN" : "TOKEN VALIDATION"}
            </Eyebrow>
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
                ? locale === "es"
                  ? "CONTRASEÑA ACTUALIZADA"
                  : "PASSWORD UPDATED"
                : hasInvalidOrMissingToken
                  ? locale === "es"
                    ? "ENLACE INVÁLIDO"
                    : "INVALID LINK"
                  : locale === "es"
                    ? "ENLACE DETECTADO"
                    : "LINK DETECTED"}
            </Badge>
          </div>

          {!token && !isSuccess && (
            <Alert
              variant="error"
              code={ErrorCode.AUTH_EMAIL_TOKEN_INVALID}
              title={
                locale === "es"
                  ? "Falta el token de restablecimiento"
                  : "Missing reset token"
              }
            >
              {locale === "es"
                ? "Abre el enlace directamente desde tu correo electrónico o solicita un nuevo correo de recuperación."
                : "Open the link directly from your email or request a new recovery link."}
            </Alert>
          )}

          {apiError && (
            <Alert
              variant="error"
              title={
                locale === "es"
                  ? "No se pudo actualizar la contraseña"
                  : "Could not update password"
              }
              code={apiError.code}
              onDismiss={() => setApiError(null)}
            >
              {apiError.message}
            </Alert>
          )}

          {isSuccess ? (
            <div className="flex flex-col gap-4">
              <Alert
                variant="success"
                title={
                  locale === "es"
                    ? "¡Contraseña restablecida!"
                    : "Password updated!"
                }
              >
                {locale === "es"
                  ? "Tu contraseña se actualizó y se cerraron las sesiones previas. Redirigiendo a inicio de sesión..."
                  : "Your password was updated and previous sessions were signed out. Redirecting to sign in..."}
              </Alert>

              <ActionLink
                href="/login?reset=success"
                variant="primary"
                size="md"
                rightIcon={<Icon name="arrow-right" size="sm" />}
              >
                {locale === "es"
                  ? "Ir a iniciar sesión ahora"
                  : "Go to sign in now"}
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
                {locale === "es"
                  ? "Solicitar nuevo enlace"
                  : "Request a new link"}
              </ActionLink>
              <ActionLink href="/login" variant="secondary" size="sm">
                {locale === "es"
                  ? "Volver a iniciar sesión"
                  : "Back to sign in"}
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
                  label={
                    locale === "es" ? "Nueva contraseña" : "New password"
                  }
                  placeholder="••••••••••••"
                  value={password}
                  disabled={isSubmitting}
                  required
                  toggleStyle="text"
                  showLabel={locale === "es" ? "Mostrar" : "Show"}
                  hideLabel={locale === "es" ? "Ocultar" : "Hide"}
                  error={fieldError ?? undefined}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (fieldError) setFieldError(null);
                  }}
                />
                <SegmentedMeter
                  activeCount={strength.activeSegments}
                  total={3}
                  caption={
                    locale === "es"
                      ? "Mínimo 8 caracteres; combina mayúsculas, minúsculas y números."
                      : "Minimum 8 characters; combine upper/lowercase letters and numbers."
                  }
                  statusLabel={strength.label}
                  tone={strength.tone}
                />
              </div>

              <PasswordInput
                id="reset-password-confirm"
                name="confirmPassword"
                autoComplete="new-password"
                minLength={8}
                label={
                  locale === "es"
                    ? "Confirmar nueva contraseña"
                    : "Confirm new password"
                }
                placeholder="••••••••••••"
                value={confirmPassword}
                disabled={isSubmitting}
                required
                toggleStyle="text"
                showLabel={locale === "es" ? "Mostrar" : "Show"}
                hideLabel={locale === "es" ? "Ocultar" : "Hide"}
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
                {isSubmitting
                  ? locale === "es"
                    ? "Guardando contraseña..."
                    : "Saving password..."
                  : locale === "es"
                    ? "Guardar nueva contraseña"
                    : "Save new password"}
              </Button>

              {hasInvalidOrMissingToken && (
                <ActionLink
                  href="/forgot-password"
                  variant="secondary"
                  size="sm"
                >
                  {locale === "es"
                    ? "Solicitar un nuevo enlace por correo"
                    : "Request a new email link"}
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
          {locale === "es" ? "← Volver a iniciar sesión" : "← Back to sign in"}
        </Link>
      </div>
    </Container>
  );
}
