"use client";

import { useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Input,
} from "@/components/ui";
import { useLocale } from "@/i18n";
import {
  ApiClientError,
  env,
  ErrorCode,
  httpClient,
} from "@/lib";

interface LanguageOption {
  id: string;
  labelEs: string;
  labelEn: string;
}

interface DomainOption {
  id: string;
  labelEs: string;
  labelEn: string;
}

interface ComplexityOption {
  id: "low" | "medium" | "high";
  titleEs: string;
  titleEn: string;
  cefr: string;
  descriptionEs: string;
  descriptionEn: string;
}

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

const LANGUAGES: readonly LanguageOption[] = [
  { id: "en", labelEs: "INGLÉS", labelEn: "ENGLISH" },
  { id: "fr", labelEs: "FRANCÉS", labelEn: "FRENCH" },
  { id: "de", labelEs: "ALEMÁN", labelEn: "GERMAN" },
  { id: "it", labelEs: "ITALIANO", labelEn: "ITALIAN" },
  { id: "ja", labelEs: "JAPONÉS", labelEn: "JAPANESE" },
];

const DOMAINS: readonly DomainOption[] = [
  {
    id: "tech",
    labelEs: "TECNOLOGÍA & CIENCIA",
    labelEn: "TECHNOLOGY & SCIENCE",
  },
  {
    id: "literature",
    labelEs: "LITERATURA CLÁSICA",
    labelEn: "CLASSICAL LITERATURE",
  },
  { id: "news", labelEs: "NOTICIAS GLOBALES", labelEn: "GLOBAL NEWS" },
  { id: "philosophy", labelEs: "FILOSOFÍA", labelEn: "PHILOSOPHY" },
  {
    id: "business",
    labelEs: "NEGOCIOS & STARTUPS",
    labelEn: "BUSINESS & STARTUPS",
  },
];

const COMPLEXITY_LEVELS: readonly ComplexityOption[] = [
  {
    id: "low",
    titleEs: "NIVEL BAJO",
    titleEn: "LOW LEVEL",
    cefr: "[A1–A2]",
    descriptionEs:
      "Estructuras básicas, presentes simples, léxico directo de alta frecuencia.",
    descriptionEn:
      "Basic structures, simple present tenses, high-frequency direct vocabulary.",
  },
  {
    id: "medium",
    titleEs: "NIVEL MEDIO",
    titleEn: "MEDIUM LEVEL",
    cefr: "[B1–B2]",
    descriptionEs:
      "Tiempos compuestos, conectores argumentativos y modismos técnicos.",
    descriptionEn:
      "Compound tenses, argumentative connectors, and technical idioms.",
  },
  {
    id: "high",
    titleEs: "NIVEL ALTO",
    titleEn: "HIGH LEVEL",
    cefr: "[C1–C2]",
    descriptionEs:
      "Subjuntivo complejo, oraciones subordinadas, vocabulario ensayístico abstracto.",
    descriptionEn:
      "Complex subjunctive, subordinate clauses, abstract essayistic lexicon.",
  },
];

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

  const [selectedLang, setSelectedLang] = useState<string>("en");
  const [selectedDomain, setSelectedDomain] = useState<string>("tech");
  const [selectedComplexity, setSelectedComplexity] =
    useState<ComplexityOption["id"]>("medium");

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);

  const [demoEmail, setDemoEmail] = useState<string>("correo@ejemplo.com");
  const [apiPingStatus, setApiPingStatus] = useState<{
    variant: "info" | "success" | "error";
    code: string;
    message: string;
  } | null>(null);
  const [isPingingApi, setIsPingingApi] = useState<boolean>(false);

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

  const handleGeneratePreview = (): void => {
    const langObj = LANGUAGES.find((l) => l.id === selectedLang);
    const domainObj = DOMAINS.find((d) => d.id === selectedDomain);
    const levelObj = COMPLEXITY_LEVELS.find(
      (c) => c.id === selectedComplexity,
    );

    const langName =
      locale === "es" ? langObj?.labelEs : langObj?.labelEn;
    const domainName =
      locale === "es" ? domainObj?.labelEs : domainObj?.labelEn;
    const levelName =
      locale === "es" ? levelObj?.titleEs : levelObj?.titleEn;

    setGenerationNotice(
      locale === "es"
        ? `Parámetros preparados para generación IA: Idioma ${langName} • Dominio ${domainName} • ${levelName} ${levelObj?.cefr}.`
        : `Parameters ready for AI generation: Language ${langName} • Domain ${domainName} • ${levelName} ${levelObj?.cefr}.`,
    );
  };

  const handleTestHttpClient = async (): Promise<void> => {
    setIsPingingApi(true);
    try {
      const response = await httpClient.get<{ status?: string }>(
        "/health/live",
        { timeoutMs: 3500 },
      );
      setApiPingStatus({
        variant: "success",
        code: "API_OK",
        message:
          response.message ||
          (locale === "es"
            ? "Conexión establecida correctamente con el backend."
            : "Successfully connected to the backend."),
      });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setApiPingStatus({
          variant: "error",
          code: err.code,
          message: err.getUserMessage(locale),
        });
      }
    } finally {
      setIsPingingApi(false);
    }
  };

  const configuredApiUrl =
    env.apiBaseUrl || "http://localhost:3333/api/v1 (.env.example)";

  return (
    <Container size="lg" className="flex flex-col gap-8 sm:gap-10">
      {/* Encabezado de bienvenida editorial */}
      <section className="flex flex-col gap-1.5">
        <h1
          id="main-heading"
          tabIndex={-1}
          className="font-serif text-3xl font-normal tracking-tight text-ink sm:text-4xl"
        >
          {t.home.welcomeHeading}
        </h1>
        <p className="font-serif text-base text-muted italic sm:text-lg">
          {t.home.welcomeSubtitle}
        </p>
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
                14
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
                  className="flex flex-col items-center gap-1 rounded-xs bg-surface px-2 py-1.5 border border-border"
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

      {/* Generador de Lectura */}
      <Card id="generar-lectura" padding="lg" as="section">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-ink uppercase">
            <svg
              aria-hidden="true"
              className="h-4 w-4 text-ink"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 3.75a2 2 0 10-4 0 2 2 0 004 0zM17.25 4.5a.75.75 0 000-1.5h-5.5a.75.75 0 000 1.5h5.5zM5 3.75a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 01.75.75zM4.25 17a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5h1.5zM17.25 17a.75.75 0 000-1.5h-5.5a.75.75 0 000 1.5h5.5zM9 10a.75.75 0 01-.75.75h-5.5a.75.75 0 010-1.5h5.5A.75.75 0 019 10zM17.25 10.75a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5h1.5zM14 10a2 2 0 10-4 0 2 2 0 004 0zM10 16.25a2 2 0 10-4 0 2 2 0 004 0z" />
            </svg>
            <h2>{t.home.generateSectionTitle}</h2>
          </div>

          {/* 01. Idioma Meta */}
          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2 text-[11px] font-bold tracking-wider text-muted uppercase">
              {t.home.stepTargetLanguage}
            </legend>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => {
                const isSelected = selectedLang === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedLang(lang.id)}
                    className={[
                      "min-h-8 rounded-xs border px-3.5 py-1.5 text-xs font-bold tracking-wider uppercase transition-colors",
                      isSelected
                        ? "border-ink bg-ink text-ink-contrast"
                        : "border-border bg-surface-subtle text-muted hover:border-border-strong hover:text-ink",
                    ].join(" ")}
                  >
                    {locale === "es" ? lang.labelEs : lang.labelEn}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* 02. Dominio Temático */}
          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2 text-[11px] font-bold tracking-wider text-muted uppercase">
              {t.home.stepThematicDomain}
            </legend>
            <div className="flex flex-wrap gap-2">
              {DOMAINS.map((domain) => {
                const isSelected = selectedDomain === domain.id;
                return (
                  <button
                    key={domain.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedDomain(domain.id)}
                    className={[
                      "min-h-8 rounded-xs border px-3.5 py-1.5 text-xs font-bold tracking-wider uppercase transition-colors",
                      isSelected
                        ? "border-ink bg-ink text-ink-contrast"
                        : "border-border bg-surface-subtle text-muted hover:border-border-strong hover:text-ink",
                    ].join(" ")}
                  >
                    {locale === "es" ? domain.labelEs : domain.labelEn}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* 03. Nivel de Complejidad Lingüística */}
          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2 text-[11px] font-bold tracking-wider text-muted uppercase">
              {t.home.stepComplexityLevel}
            </legend>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {COMPLEXITY_LEVELS.map((level) => {
                const isSelected = selectedComplexity === level.id;
                return (
                  <button
                    key={level.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedComplexity(level.id)}
                    className={[
                      "flex flex-col justify-between gap-4 rounded-xs border p-4 text-left transition-colors",
                      isSelected
                        ? "border-ink bg-ink text-ink-contrast"
                        : "border-border bg-surface-subtle text-foreground hover:border-border-strong",
                    ].join(" ")}
                  >
                    <div className="flex w-full items-center justify-between gap-2 text-[11px] font-bold tracking-wider uppercase">
                      <span>
                        {locale === "es" ? level.titleEs : level.titleEn}
                      </span>
                      <span
                        className={
                          isSelected ? "text-ink-contrast/80" : "text-muted"
                        }
                      >
                        {level.cefr}
                      </span>
                    </div>
                    <p
                      className={`text-xs leading-relaxed ${
                        isSelected ? "text-ink-contrast/90" : "text-muted"
                      }`}
                    >
                      {locale === "es"
                        ? level.descriptionEs
                        : level.descriptionEn}
                    </p>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {generationNotice && (
            <Alert
              variant="info"
              title={
                locale === "es"
                  ? "Configuración de sesión lista"
                  : "Session configuration ready"
              }
              code="PROMPT_CONFIG_READY"
              onDismiss={() => setGenerationNotice(null)}
            >
              {generationNotice}
            </Alert>
          )}

          <div className="flex flex-col justify-between gap-4 border-t border-border pt-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-xs text-muted">
              <svg
                aria-hidden="true"
                className="h-4 w-4 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{t.home.estimatedTime}</span>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleGeneratePreview}
              leftIcon={
                <svg
                  aria-hidden="true"
                  className="h-3.5 w-3.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z" />
                </svg>
              }
            >
              {t.home.generateButton}
            </Button>
          </div>
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

      {/* Catálogo de Componentes Base y Verificación del Cliente HTTP */}
      <Card
        id="sistema-base"
        variant="default"
        padding="lg"
        as="section"
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col gap-1 border-b border-border pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-bold tracking-wider text-ink uppercase">
              {t.home.uiKitTitle}
            </h2>
            <Badge variant="outline">DESIGN TOKENS + HTTP CLIENT</Badge>
          </div>
          <p className="text-xs text-muted">{t.home.uiKitSubtitle}</p>
        </div>

        {/* Demostración de estados de Input: foco, error y deshabilitado */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Input
            type="email"
            label="Correo electrónico (estado normal / foco)"
            hint="Conecta con el perfil académico sincronizado."
            placeholder="correo@ejemplo.com"
            value={demoEmail}
            onChange={(e) => setDemoEmail(e.target.value)}
            required
          />

          <Input
            type="password"
            label="Contraseña (estado con error)"
            defaultValue="12345"
            labelAction={
              <span className="font-semibold text-muted">INCOMPLETO</span>
            }
            error="Mínimo 8 caracteres, al menos un número y un símbolo."
          />

          <Input
            type="text"
            label="Expediente institucional (deshabilitado)"
            hint="Identificador asignado por el sistema CEFR."
            defaultValue="EXP-2026-ROSTOVA"
            disabled
          />
        </div>

        {/* Demostración de variantes de Button (Blanco y Negro) y Badges semánticos (Success, Warning, Danger) */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-bold tracking-wider text-muted uppercase">
              Botones Flowbite (Estrictamente Blanco y Negro)
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary" size="sm">
                Primario
              </Button>
              <Button variant="secondary" size="sm">
                Secundario
              </Button>
              <Button variant="outline" size="sm">
                Outline
              </Button>
              <Button variant="ghost" size="sm">
                Ghost
              </Button>
              <Button variant="primary" size="sm" disabled>
                Deshabilitado
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-bold tracking-wider text-muted uppercase">
              Badges Flowbite (Blanco/Negro + Estados Dinámicos: Success, Warning, Danger)
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary">PRIMARIO B&amp;W</Badge>
              <Badge variant="secondary">SECUNDARIO B&amp;W</Badge>
              <Badge variant="outline">OUTLINE B&amp;W</Badge>
              <Badge variant="success">SUCCESS</Badge>
              <Badge variant="warning">WARNING</Badge>
              <Badge variant="error">DANGER</Badge>
            </div>
          </div>
        </div>

        {/* Demostración de Alert editorial (patrón de evaluación y estado de cliente HTTP) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Alert
            variant="warning"
            title="OMISIÓN DE MATIZ ÉTICO EN EL ÚLTIMO PÁRRAFO"
            code="CEFR-B2-OBSERVATION"
            quote='"While contextual adaptation improves operational friction, it hinges critically on resolving edge-computation privacy trade-offs."'
          >
            Omitiste mencionar el dilema de privacidad sobre el almacenamiento
            local versus en la nube introducido en la conclusión del autor.
          </Alert>

          <div className="flex flex-col justify-between gap-3 rounded-xs border border-border bg-surface-subtle p-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold tracking-wider text-ink uppercase">
                  CLIENTE HTTP BASE (NEXT_PUBLIC_API_BASE_URL)
                </span>
                <Badge
                  variant={env.isApiConfigured ? "success" : "secondary"}
                >
                  {env.isApiConfigured ? "ENV ACTIVO" : "MODO PLANTILLA"}
                </Badge>
              </div>
              <p className="font-mono text-xs break-all text-muted">
                {configuredApiUrl}
              </p>
              <p className="text-xs leading-relaxed text-muted">
                Todas las respuestas se procesan bajo el envelope{" "}
                <code className="font-mono text-ink">ApiResponse&lt;T&gt;</code>{" "}
                y los errores se discriminan por{" "}
                <code className="font-mono text-ink">error.code</code> (p. ej.{" "}
                <code className="font-mono text-ink">
                  {ErrorCode.AUTH_UNAUTHORIZED}
                </code>
                ).
              </p>
            </div>

            {apiPingStatus && (
              <Alert
                variant={apiPingStatus.variant}
                code={apiPingStatus.code}
                title="Resultado de verificación HTTP"
              >
                {apiPingStatus.message}
              </Alert>
            )}

            <div className="flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                isLoading={isPingingApi}
                onClick={() => void handleTestHttpClient()}
              >
                Probar cliente HTTP (/health/live)
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </Container>
  );
}
