"use client";

import Link from "next/link";
import { useState } from "react";

import {
  Badge,
  Button,
  Card,
  Container,
  Input,
} from "@/components/ui";
import { useAuth } from "@/context";
import { useLocale } from "@/i18n";

interface ReadingRecord {
  id: string;
  langBadgeEs: string;
  langBadgeEn: string;
  levelBadgeEs: string;
  levelBadgeEn: string;
  levelVariant: "primary" | "secondary";
  timestampEs: string;
  timestampEn: string;
  scoreLabelEs: string;
  scoreLabelEn: string;
  title: string;
  excerpt: string;
  excerptLang: string;
  durationEs: string;
  durationEn: string;
  annotationsEs: string;
  annotationsEn: string;
}

const RECENT_READINGS: readonly ReadingRecord[] = [
  {
    id: "reading-cloud-systems",
    langBadgeEs: "[EN] INGLÉS",
    langBadgeEn: "[EN] ENGLISH",
    levelBadgeEs: "NIVEL MEDIO",
    levelBadgeEn: "MEDIUM LEVEL",
    levelVariant: "secondary",
    timestampEs: "Hoy, 10:30 AM",
    timestampEn: "Today, 10:30 AM",
    scoreLabelEs: "COMPLETADA (92/100)",
    scoreLabelEn: "COMPLETED (92/100)",
    title: "The Architecture of Modern Cloud Systems",
    excerpt:
      '"Distributed infrastructure relies on deterministic latency bounds and asynchronous consensus algorithms to guarantee continuous convergence under network partition..."',
    excerptLang: "en",
    durationEs: "5 MIN LECTURA",
    durationEn: "5 MIN READ",
    annotationsEs: "8 ANOTACIONES GUARDADAS",
    annotationsEn: "8 SAVED ANNOTATIONS",
  },
  {
    id: "reading-ia-societe",
    langBadgeEs: "[FR] FRANCÉS",
    langBadgeEn: "[FR] FRENCH",
    levelBadgeEs: "NIVEL ALTO",
    levelBadgeEn: "HIGH LEVEL",
    levelVariant: "primary",
    timestampEs: "Ayer, 18:45",
    timestampEn: "Yesterday, 18:45",
    scoreLabelEs: "COMPLETADA (88/100)",
    scoreLabelEn: "COMPLETED (88/100)",
    title: "L'intelligence Artificielle et la Société",
    excerpt:
      '"Bien que les mutations technologiques induisent une réorganisation globale du travail, la question fondamentale demeure celle de l\'autonomie critique des institutions face à la..."',
    excerptLang: "fr",
    durationEs: "7 MIN LECTURA",
    durationEn: "7 MIN READ",
    annotationsEs: "14 ANOTACIONES GUARDADAS",
    annotationsEn: "14 SAVED ANNOTATIONS",
  },
  {
    id: "reading-kognition",
    langBadgeEs: "[DE] ALEMÁN",
    langBadgeEn: "[DE] GERMAN",
    levelBadgeEs: "NIVEL BAJO",
    levelBadgeEn: "LOW LEVEL",
    levelVariant: "secondary",
    timestampEs: "12 Mayo, 14:15",
    timestampEn: "May 12, 14:15",
    scoreLabelEs: "COMPLETADA (95/100)",
    scoreLabelEn: "COMPLETED (95/100)",
    title: "Der Ursprung der Kognitionswissenschaft",
    excerpt:
      '"Das Gehirn verarbeitet einfache Informationen durch viele kleine Nervenzellen. In den frühen Jahren der Forschung verstand man dieses Zusammenspiel als biologische..."',
    excerptLang: "de",
    durationEs: "4 MIN LECTURA",
    durationEn: "4 MIN READ",
    annotationsEs: "5 ANOTACIONES GUARDADAS",
    annotationsEn: "5 SAVED ANNOTATIONS",
  },
];

export default function HomePage() {
  const { locale, t } = useLocale();
  const { user, isAuthenticated, onboarding } = useAuth();

  const [searchQuery, setSearchQuery] = useState<string>("");

  const firstNameDisplay =
    user?.fullName?.trim().split(/\s+/)[0] ||
    user?.email?.split("@")[0] ||
    "Elena";

  const dynamicWelcomeHeading =
    locale === "es"
      ? `Bienvenido de vuelta, ${firstNameDisplay}.`
      : `Welcome back, ${firstNameDisplay}.`;

  const streakDaysCount = user?.currentStreak ?? 14;

  const searchError =
    searchQuery.trim().length > 40
      ? locale === "es"
        ? "El término de filtrado no debe exceder 40 caracteres."
        : "Filter query must not exceed 40 characters."
      : undefined;

  const filteredReadings = RECENT_READINGS.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || searchError) {
      return true;
    }
    return (
      item.title.toLowerCase().includes(q) ||
      item.langBadgeEs.toLowerCase().includes(q) ||
      item.langBadgeEn.toLowerCase().includes(q) ||
      item.levelBadgeEs.toLowerCase().includes(q)
    );
  });

  // =========================================================================
  // FILTRO OBLIGATORIO DE SUSCRIPCIÓN (Requisito 3)
  // Si el usuario está autenticado pero no ha seleccionado un plan, no se le
  // permite explorar el sistema y se le presenta únicamente la selección de plan.
  // =========================================================================
  if (isAuthenticated && !onboarding.hasSelectedPlan) {
    return (
      <Container size="md" className="flex flex-col items-center gap-6 py-8 sm:py-12">
        <Card padding="lg" className="w-full border-brand bg-surface p-6 sm:p-8">
          <div className="flex flex-col gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Badge variant="warning">
                {t.auth.stepper.gate.badge}
              </Badge>
              <h1
                id="main-heading"
                tabIndex={-1}
                className="font-serif text-2xl font-bold tracking-tight text-ink sm:text-3xl"
              >
                {t.auth.stepper.gate.title}
              </h1>
              <p className="max-w-lg text-xs leading-relaxed text-muted sm:text-sm">
                {t.auth.stepper.gate.subtitle}
              </p>
            </div>

            {/* Resumen de los 3 planes en el gate */}
            <div className="flex flex-col gap-3 rounded-xs border border-border bg-neutral-secondary-medium p-4 text-left sm:p-5">
              <span className="text-[10px] font-bold tracking-widest text-muted uppercase">
                {t.auth.stepper.gate.planSummaryTitle}
              </span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1 rounded-xs border border-border bg-surface p-3">
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
                <div className="flex flex-col gap-1 rounded-xs border border-brand bg-surface p-3 ring-1 ring-brand">
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
                <div className="flex flex-col gap-1 rounded-xs border border-border bg-surface p-3">
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
              <Link href="/register?step=3" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  rightIcon={<span aria-hidden="true">→</span>}
                >
                  {t.auth.stepper.gate.cta}
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </Container>
    );
  }

  // =========================================================================
  // FILTRO OBLIGATORIO DE IDIOMAS (Requisito 4)
  // Si ya tiene plan pero no ha terminado de seleccionar sus idiomas
  // =========================================================================
  if (isAuthenticated && !onboarding.isOnboardingComplete) {
    return (
      <Container size="md" className="flex flex-col items-center gap-6 py-8 sm:py-12">
        <Card padding="lg" className="w-full border-brand bg-surface p-6 sm:p-8">
          <div className="flex flex-col gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Badge variant="warning">CONFIGURACIÓN PENDIENTE</Badge>
              <h1
                id="main-heading"
                tabIndex={-1}
                className="font-serif text-2xl font-bold tracking-tight text-ink sm:text-3xl"
              >
                Completa la selección de tus idiomas
              </h1>
              <p className="max-w-lg text-xs leading-relaxed text-muted sm:text-sm">
                Has seleccionado tu plan (
                {onboarding.subscriptionPlan === "dolly"
                  ? "Dolly"
                  : onboarding.subscriptionPlan === "dolly_plus"
                    ? "Dolly Plus"
                    : "Dolly Pro"}
                ). Ahora elige los idiomas que deseas aprender para desbloquear tu acceso.
              </p>
            </div>

            <div className="flex justify-center pt-2">
              <Link href="/register?step=4" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  rightIcon={<span aria-hidden="true">→</span>}
                >
                  Seleccionar idiomas de estudio →
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="lg" className="flex flex-col gap-8 sm:gap-10">
      {/* Encabezado de bienvenida editorial */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1.5">
          <h1
            id="main-heading"
            tabIndex={-1}
            className="font-serif text-3xl font-normal tracking-tight text-ink sm:text-4xl"
          >
            {dynamicWelcomeHeading}
          </h1>
          <p className="font-serif text-base text-muted italic sm:text-lg">
            {t.home.welcomeSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAuthenticated ? (
            <Badge variant="success">
              {locale === "es"
                ? `SESIÓN ACTIVA: ${user?.email}`
                : `ACTIVE SESSION: ${user?.email}`}
            </Badge>
          ) : (
            <Badge variant="outline">
              {locale === "es"
                ? "MODO VISTA PREVIA (SIN SESIÓN)"
                : "PREVIEW MODE (UNAUTHENTICATED)"}
            </Badge>
          )}
        </div>
      </section>

      {/* Tarjeta de Racha de Consistencia */}
      <Card variant="subtle" padding="lg" as="section">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-ink uppercase">
              <svg
                aria-hidden="true"
                className="h-3.5 w-3.5 text-ink"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M13.5 4.938a7 7 0 11-9.006 1.737c.202-.257.59-.218.793.039.278.352.594.672.943.954.332.269.786-.049.773-.476a5.977 5.977 0 01.572-2.759 6.026 6.026 0 012.486-2.665c.247-.14.55-.016.677.238A6.967 6.967 0 0013.5 4.938z"
                  clipRule="evenodd"
                />
              </svg>
              <h2>{t.home.streakTitle}</h2>
            </div>

            <div className="flex items-baseline gap-2.5">
              <span className="font-serif text-4xl font-semibold text-ink sm:text-5xl">
                {streakDaysCount}
              </span>
              <span className="font-serif text-lg text-ink sm:text-xl">
                {t.home.streakDaysSuffix}
              </span>
            </div>

            <p className="max-w-md text-xs leading-relaxed text-muted">
              {t.home.streakDailyGoal}
            </p>
          </div>

          {/* Registro semanal de 7 días */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold tracking-wider text-muted uppercase">
              {t.home.weeklyLogTitle}
            </p>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {t.home.weekDays.map((day, idx) => (
                <div
                  key={`${day}-${idx}`}
                  className="flex flex-col items-center gap-1 rounded-xs border border-border bg-surface px-2 py-1.5"
                >
                  <span
                    className={`text-[10px] font-bold ${
                      idx === 6 ? "text-ink" : "text-muted"
                    }`}
                  >
                    {day}
                  </span>
                  <span
                    aria-hidden="true"
                    className="inline-flex h-4 w-4 items-center justify-center rounded-[2px] bg-ink text-ink-contrast"
                  >
                    <svg
                      className="h-2.5 w-2.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-3.5 text-[11px] font-bold tracking-wider text-muted uppercase">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <span>{t.home.syntacticRetention}</span>
            <span>{t.home.acquiredVocabulary}</span>
          </div>

          <svg
            aria-hidden="true"
            className="h-5 w-24 text-ink"
            viewBox="0 0 96 20"
            fill="none"
          >
            <path
              d="M2 16L18 14L34 15L50 9L66 11L82 5L94 3"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </Card>

      {/* Últimas Lecturas Realizadas */}
      <section id="ultimas-lecturas" className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-xs font-bold tracking-wider text-ink uppercase">
              {t.home.recentReadingsTitle}
            </h2>
            <span className="text-xs font-semibold text-muted">
              {t.home.recordsCount}
            </span>
          </div>

          <a
            href="#ultimas-lecturas"
            className="inline-flex items-center gap-1 text-xs font-bold tracking-wider text-ink uppercase transition-colors hover:text-muted"
          >
            <span>{t.home.fullHistoryLink}</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>

        {/* Buscador usando el componente base Input */}
        <Input
          type="search"
          label={t.home.searchReadingsLabel}
          hint={t.home.searchReadingsHint}
          placeholder={t.home.searchReadingsPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          error={searchError}
          rightElement={
            searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label={
                  locale === "es" ? "Limpiar filtro" : "Clear filter"
                }
                className="rounded-xs px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-muted uppercase hover:text-ink"
              >
                ESC
              </button>
            ) : undefined
          }
        />

        <div className="flex flex-col gap-4">
          {filteredReadings.map((reading) => (
            <Card
              key={reading.id}
              as="article"
              padding="lg"
              className="flex flex-col gap-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {locale === "es"
                      ? reading.langBadgeEs
                      : reading.langBadgeEn}
                  </Badge>
                  <Badge variant={reading.levelVariant}>
                    {locale === "es"
                      ? reading.levelBadgeEs
                      : reading.levelBadgeEn}
                  </Badge>
                  <span className="text-xs text-muted">
                    •{" "}
                    {locale === "es"
                      ? reading.timestampEs
                      : reading.timestampEn}
                  </span>
                </div>

                <span className="text-[11px] font-bold tracking-wider text-ink uppercase">
                  {locale === "es"
                    ? reading.scoreLabelEs
                    : reading.scoreLabelEn}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <h3
                  lang={reading.excerptLang}
                  className="font-serif text-xl font-semibold text-ink sm:text-2xl"
                >
                  {reading.title}
                </h3>
                <p
                  lang={reading.excerptLang}
                  className="font-serif text-sm leading-relaxed text-muted sm:text-base"
                >
                  {reading.excerpt}
                </p>
              </div>

              <div className="mt-1 flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className="text-[11px] font-semibold tracking-wider text-muted uppercase">
                  {locale === "es"
                    ? reading.durationEs
                    : reading.durationEn}{" "}
                  •{" "}
                  {locale === "es"
                    ? reading.annotationsEs
                    : reading.annotationsEn}
                </p>

                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm">
                    {t.home.feedbackButton}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    rightIcon={<span className="text-[10px]">▷</span>}
                  >
                    {t.home.rereadButton}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </Container>
  );
}
