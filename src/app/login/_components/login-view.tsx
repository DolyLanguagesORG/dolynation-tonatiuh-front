"use client";

import Link from "next/link";

import { AuthShell } from "@/components/auth";
import {
  Alert,
  Button,
  Checkbox,
  Divider,
  Icon,
  Input,
  PasswordInput,
} from "@/components/ui";
import { useLoginForm } from "@/app/login/_hooks/use-login-form";

/**
 * Vista interactiva de inicio de sesión alineada con el wireframe `02-iniciar-sesion.png`.
 */
export function LoginView() {
  const {
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
  } = useLoginForm();

  return (
    <AuthShell
      title={t.auth.login.title}
      subtitle={t.auth.login.subtitle}
      maxWidthClass="max-w-[460px]"
      footerPrompt={
        <>
          {t.auth.login.noAccountPrompt}{" "}
          <Link
            href={registerHref}
            className="font-bold text-ink underline underline-offset-4 transition-colors hover:text-muted"
          >
            {t.auth.login.registerLink}
          </Link>
        </>
      }
      legalLinks={[
        { href: "/login#terminos", label: t.auth.login.academicTerms },
        { href: "/login#privacidad", label: t.auth.login.privacyPolicy },
        { href: "/login#soporte", label: t.auth.login.technicalSupport },
      ]}
    >
      <Button
        type="button"
        variant="secondary"
        size="md"
        fullWidth
        disabled={isSubmitting}
        onClick={showOAuthNotice}
        leftIcon={
          <span aria-hidden="true" className="font-sans text-sm font-bold text-ink">
            G
          </span>
        }
        className="normal-case tracking-normal"
      >
        {t.auth.login.googleButton}
      </Button>

      <Divider label={t.auth.login.divider} />

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

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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
          onChange={(event) => handleEmailChange(event.target.value)}
          onBlur={handleEmailBlur}
        />

        <PasswordInput
          ref={passwordRef}
          id="login-password"
          name="password"
          autoComplete="current-password"
          label={t.auth.login.passwordLabel}
          placeholder="••••••••"
          value={password}
          disabled={isSubmitting}
          required
          showLabel={t.auth.login.showPasswordAria}
          hideLabel={t.auth.login.hidePasswordAria}
          error={touched.password ? fieldErrors.password : undefined}
          labelAction={
            <Button
              variant="ghost"
              size="xs"
              onClick={showPasswordRecoveryNotice}
              className="h-auto min-h-0 px-0 py-0 text-xs font-medium normal-case tracking-normal text-muted underline-offset-4 hover:bg-transparent hover:text-ink hover:underline"
            >
              {t.auth.login.forgotPasswordLink}
            </Button>
          }
          onChange={(event) => handlePasswordChange(event.target.value)}
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
            rightIcon={<Icon name="arrow-right" size="md" />}
            className="normal-case tracking-normal"
          >
            {isSubmitting
              ? t.auth.login.submittingButton
              : t.auth.login.submitButton}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
