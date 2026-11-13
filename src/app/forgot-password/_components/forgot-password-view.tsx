"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

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
import { useLocale } from "@/i18n";
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
  const { locale } = useLocale();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<{
    code: string;
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmed)) {
      setFieldError(
        locale === "es"
          ? "Ingresa un correo electrónico válido."
          : "Enter a valid email address.",
      );
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

  return (
    <Container size="sm" className="flex flex-col items-center py-6 sm:py-10">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <Eyebrow tone="muted">
          {locale === "es" ? "RECUPERACIÓN DE CUENTA" : "ACCOUNT RECOVERY"}
        </Eyebrow>
        <Heading as="h1" id="main-heading" variant="display">
          {locale === "es" ? "Restablecer Contraseña" : "Reset Password"}
        </Heading>
        <Text variant="lead" tone="muted" className="max-w-md">
          {locale === "es"
            ? "Ingresa tu correo electrónico registrado y te enviaremos un enlace seguro de un solo uso para definir una nueva contraseña."
            : "Enter your registered email address and we will send a secure single-use link to set a new password."}
        </Text>
      </div>

      <Card padding="lg" className="w-full max-w-md">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-2">
            <Eyebrow tone="muted">
              {locale === "es" ? "SOLICITUD DE ENLACE" : "LINK REQUEST"}
            </Eyebrow>
            <Badge variant={emailSent ? "primary" : "outline"}>
              {emailSent
                ? locale === "es"
                  ? "CORREO ENVIADO"
                  : "EMAIL SENT"
                : locale === "es"
                  ? "60 MIN DE VIGENCIA"
                  : "60 MIN VALIDITY"}
            </Badge>
          </div>

          {apiError && (
            <Alert
              variant="error"
              title={
                locale === "es"
                  ? "No se pudo procesar la solicitud"
                  : "Request failed"
              }
              code={apiError.code}
              onDismiss={() => setApiError(null)}
            >
              {apiError.message}
            </Alert>
          )}

          {emailSent ? (
            <div className="flex flex-col gap-5">
              <Alert
                variant="success"
                title={
                  locale === "es"
                    ? "Revisa tu bandeja de entrada"
                    : "Check your inbox"
                }
              >
                {locale === "es"
                  ? `Si existe una cuenta asociada a ${email.trim().toLowerCase()}, recibirás en unos momentos un correo con el enlace para crear una nueva contraseña.`
                  : `If an account exists for ${email.trim().toLowerCase()}, you will shortly receive an email containing a link to create a new password.`}
              </Alert>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEmailSent(false)}
                >
                  {locale === "es"
                    ? "Enviar a otro correo"
                    : "Use a different email"}
                </Button>
                <ActionLink
                  href="/login"
                  variant="primary"
                  size="sm"
                  leftIcon={<Icon name="arrow-left" size="xs" />}
                >
                  {locale === "es"
                    ? "Volver a iniciar sesión"
                    : "Back to sign in"}
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
                label={
                  locale === "es"
                    ? "Correo electrónico institucional o personal"
                    : "Institutional or personal email"
                }
                placeholder="estudiante@universidad.edu"
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
                {isSubmitting
                  ? locale === "es"
                    ? "Enviando enlace..."
                    : "Sending link..."
                  : locale === "es"
                    ? "Enviar enlace de recuperación"
                    : "Send recovery link"}
              </Button>
            </form>
          )}
        </div>
      </Card>

      <div className="mt-6 flex items-center gap-2 text-sm text-body">
        <span>
          {locale === "es"
            ? "¿Recordaste tu contraseña?"
            : "Remembered your password?"}
        </span>
        <Link
          href="/login"
          className="font-semibold text-ink underline underline-offset-4 hover:text-muted"
        >
          {locale === "es" ? "Inicia sesión" : "Sign in"}
        </Link>
      </div>
    </Container>
  );
}
