"use client";

import {
  ActionLink,
  Badge,
  Card,
  Container,
  Heading,
  Icon,
  Text,
} from "@/components/ui";
import { type OnboardingState } from "@/context";
import { type Dictionary } from "@/i18n";

export interface OnboardingGateBannerProps {
  t: Dictionary;
  onboarding: OnboardingState;
  mode: "plan" | "languages";
}

/**
 * Puerta editorial mostrada en `/` cuando el estudiante autenticado aún no completa
 * la selección de plan o idiomas de su onboarding.
 */
export function OnboardingGateBanner({
  t,
  onboarding,
  mode,
}: OnboardingGateBannerProps) {
  if (mode === "languages") {
    const planLabel =
      onboarding.subscriptionPlan === "dolly"
        ? "Dolly"
        : onboarding.subscriptionPlan === "dolly_plus"
          ? "Dolly Plus"
          : "Dolly Pro";

    return (
      <Container
        size="md"
        className="flex flex-col items-center gap-6 py-8 sm:py-12"
      >
        <Card padding="lg" className="w-full border-brand bg-surface p-6 sm:p-8">
          <div className="flex flex-col gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Badge variant="warning">CONFIGURACIÓN PENDIENTE</Badge>
              <Heading as="h1" variant="title" mainHeading>
                Completa la selección de tus idiomas
              </Heading>
              <Text variant="small" tone="muted" className="max-w-lg sm:text-sm">
                Has seleccionado tu plan ({planLabel}). Ahora elige los idiomas
                que deseas aprender para desbloquear tu acceso.
              </Text>
            </div>

            <div className="flex justify-center pt-2">
              <ActionLink
                href="/register?step=4"
                variant="primary"
                size="lg"
                rightIcon={<Icon name="arrow-right" size="md" />}
                className="w-full sm:w-auto"
              >
                Seleccionar idiomas de estudio
              </ActionLink>
            </div>
          </div>
        </Card>
      </Container>
    );
  }

  return (
    <Container
      size="md"
      className="flex flex-col items-center gap-6 py-8 sm:py-12"
    >
      <Card padding="lg" className="w-full border-brand bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <Badge variant="warning">{t.auth.stepper.gate.badge}</Badge>
            <Heading as="h1" variant="title" mainHeading>
              {t.auth.stepper.gate.title}
            </Heading>
            <Text variant="small" tone="muted" className="max-w-lg sm:text-sm">
              {t.auth.stepper.gate.subtitle}
            </Text>
          </div>

          <div className="flex flex-col gap-3 rounded-base border border-border bg-neutral-secondary-medium p-4 text-left sm:p-5">
            <span className="text-[10px] font-bold tracking-widest text-muted uppercase">
              {t.auth.stepper.gate.planSummaryTitle}
            </span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1 rounded-base border border-border bg-surface p-3">
                <span className="font-serif text-sm font-bold text-ink">
                  {t.auth.stepper.step3Plan.planDolyName}
                </span>
                <span className="text-[11px] font-semibold text-muted">
                  {t.auth.stepper.step3Plan.planDolyPrice} · 1 idioma
                </span>
                <p className="text-[10px] text-muted">
                  {t.auth.stepper.step3Plan.planDolyFeature1}
                </p>
              </div>
              <div className="flex flex-col gap-1 rounded-base border border-brand bg-surface p-3 ring-1 ring-brand">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-sm font-bold text-ink">
                    {t.auth.stepper.step3Plan.planDolyPlusName}
                  </span>
                  <Badge variant="primary">RECOMENDADO</Badge>
                </div>
                <span className="text-[11px] font-semibold text-muted">
                  {t.auth.stepper.step3Plan.planDolyPlusPrice} · Hasta 2 idiomas
                </span>
                <p className="text-[10px] text-muted">
                  {t.auth.stepper.step3Plan.planDolyPlusFeature1}
                </p>
              </div>
              <div className="flex flex-col gap-1 rounded-base border border-border bg-surface p-3">
                <span className="font-serif text-sm font-bold text-ink">
                  {t.auth.stepper.step3Plan.planDolyProName}
                </span>
                <span className="text-[11px] font-semibold text-muted">
                  {t.auth.stepper.step3Plan.planDolyProPrice} · Hasta 4 idiomas
                </span>
                <p className="text-[10px] text-muted">
                  {t.auth.stepper.step3Plan.planDolyProFeature1}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 pt-2">
            <ActionLink
              href="/register?step=3"
              variant="primary"
              size="lg"
              rightIcon={<Icon name="arrow-right" size="md" />}
              className="w-full sm:w-auto"
            >
              {t.auth.stepper.gate.cta}
            </ActionLink>
          </div>
        </div>
      </Card>
    </Container>
  );
}
