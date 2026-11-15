"use client";

import { useState } from "react";

import {
  ActionLink,
  Alert,
  AVAILABLE_ICON_NAMES,
  Badge,
  Button,
  Card,
  Checkbox,
  ChoiceCard,
  ChoiceChip,
  Container,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeadCell,
  DataTableRow,
  Divider,
  EmptyState,
  Eyebrow,
  Heading,
  Icon,
  IconButton,
  Input,
  PageHeader,
  Pagination,
  PasswordInput,
  ProgressBar,
  SegmentedMeter,
  Select,
  SkeletonCard,
  StatCard,
  Stepper,
  Text,
  Textarea,
} from "@/components/ui";
import { formatMessage, useLocale } from "@/i18n";
import {
  formatReadingLanguageBadge,
  getDifficultyMeta,
  type ReadingDifficulty,
  type TargetLanguageCode,
} from "@/lib";

const SAMPLE_ROWS: ReadonlyArray<{
  id: number;
  title: string;
  langCode: TargetLanguageCode;
  levelKey: ReadingDifficulty;
  score: number;
}> = [
  {
    id: 101,
    title: "The Architecture of Distributed Memory",
    langCode: "en",
    levelKey: "medium",
    score: 94,
  },
  {
    id: 102,
    title: "L'économie circulaire urbaine",
    langCode: "fr",
    levelKey: "easy",
    score: 88,
  },
  {
    id: 103,
    title: "Ética algorítmica en la clínica moderna",
    langCode: "es",
    levelKey: "hard",
    score: 91,
  },
];

/**
 * Catálogo interactivo oficial de componentes estandarizados DolyNation (`/design-system`).
 */
export function DesignSystemView() {
  const { locale, t } = useLocale();

  const [chipValues, setChipValues] = useState<string[]>(["en", "fr"]);
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "pro">("pro");
  const [activeStep, setActiveStep] = useState(2);
  const [page, setPage] = useState(1);
  const [sampleInput, setSampleInput] = useState("estudiante@universidad.edu");
  const [samplePassword, setSamplePassword] = useState("DolyAcademic!2026");
  const [sampleSummary, setSampleSummary] = useState(
    "La lectura contrasta sistemas distribuidos tolerantes a fallos frente a cachés locales.",
  );
  const [sampleLevel, setSampleLevel] = useState("medium");
  const [checkedTerms, setCheckedTerms] = useState(true);
  const [iconQuery, setIconQuery] = useState("");

  const toggleChip = (key: string) => {
    setChipValues((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const filteredIcons = AVAILABLE_ICON_NAMES.filter((name) =>
    name.includes(iconQuery.trim().toLowerCase()),
  );

  const stepperItems = [
    {
      step: 1,
      label: t.designSystem.stepperStep1,
      isCompleted: activeStep > 1,
      isCurrent: activeStep === 1,
    },
    {
      step: 2,
      label: t.designSystem.stepperStep2,
      isCompleted: activeStep > 2,
      isCurrent: activeStep === 2,
    },
    {
      step: 3,
      label: t.designSystem.stepperStep3,
      isCompleted: activeStep > 3,
      isCurrent: activeStep === 3,
    },
    {
      step: 4,
      label: t.designSystem.stepperStep4,
      isCompleted: false,
      isCurrent: activeStep === 4,
    },
  ];

  return (
    <Container size="xl" className="flex flex-col gap-10">
      <PageHeader
        backHref="/"
        backLabel={t.readings.result.homeButton}
        eyebrow={t.designSystem.eyebrow}
        title={t.designSystem.title}
        subtitle={t.designSystem.subtitle}
        badges={
          <>
            <Badge variant="primary">B&W EDITORIAL</Badge>
            <Badge variant="outline">FLOWBITE REACT</Badge>
            <Badge variant="secondary">LUCIDE ICONS</Badge>
          </>
        }
      />

      {/* 01. Tipografía Editorial */}
      <section className="flex flex-col gap-4">
        <Eyebrow tone="muted">{t.designSystem.section01}</Eyebrow>
        <Card padding="lg" className="flex flex-col gap-4">
          <Heading as="h2" variant="display">
            Display Serif Heading (Newsreader)
          </Heading>
          <Heading as="h3" variant="title">
            Section Title Scale
          </Heading>
          <Heading as="h4" variant="subsection">
            Subsection Card Heading
          </Heading>
          <Divider />
          <Text variant="editorial" tone="heading">
            Texto editorial serif de lectura inmersiva diseñado para concentración académica prolongada.
          </Text>
          <Text variant="body" tone="body">
            Cuerpo estándar sans-serif (`Plus Jakarta Sans`) para instrucciones, formularios y tarjetas.
          </Text>
          <Text variant="meta" tone="muted">
            [META / CODE] • MEDIO • 14 MIN FOCUS
          </Text>
        </Card>
      </section>

      {/* 02. Botones y Enlaces */}
      <section className="flex flex-col gap-4">
        <Eyebrow tone="muted">{t.designSystem.section02}</Eyebrow>
        <Card padding="lg" className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" size="md">
              Primary Button
            </Button>
            <Button variant="secondary" size="md">
              Secondary Button
            </Button>
            <Button variant="outline" size="md">
              Outline Button
            </Button>
            <Button variant="ghost" size="md">
              Ghost Button
            </Button>
            <Button variant="primary" size="md" isLoading>
              Loading
            </Button>
            <Button variant="secondary" size="xs">
              Size XS
            </Button>
            <Button variant="primary" size="lg" rightIcon={<Icon name="arrow-right" size="sm" />}>
              Large CTA
            </Button>
          </div>

          <Divider />

          <div className="flex flex-wrap items-center gap-3">
            <ActionLink
              href="#design-system-forms"
              variant="primary"
              size="sm"
              leftIcon={<Icon name="sparkles" size="xs" />}
            >
              ActionLink → #forms
            </ActionLink>
            <ActionLink href="#design-system-tables" variant="secondary" size="sm">
              ActionLink → #tables
            </ActionLink>
            <IconButton
              icon="bookmark"
              variant="secondary"
              aria-label={t.designSystem.saveIconAria}
            />
            <IconButton
              icon="volume-2"
              variant="outline"
              aria-label={t.designSystem.audioIconAria}
            />
            <IconButton
              icon="settings"
              variant="ghost"
              aria-label={t.designSystem.settingsIconAria}
            />
          </div>
        </Card>
      </section>

      {/* 03. Formularios */}
      <section id="design-system-forms" className="flex flex-col gap-4">
        <Eyebrow tone="muted">{t.designSystem.section03}</Eyebrow>
        <Card padding="lg" className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Input
            label={t.designSystem.emailInputLabel}
            hint={t.designSystem.emailInputHint}
            value={sampleInput}
            onChange={(e) => setSampleInput(e.target.value)}
          />
          <PasswordInput
            label={t.designSystem.passwordInputLabel}
            value={samplePassword}
            onChange={(e) => setSamplePassword(e.target.value)}
          />
          <Select
            label={t.designSystem.difficultySelectLabel}
            value={sampleLevel}
            onChange={(e) => setSampleLevel(e.target.value)}
            options={[
              { value: "easy", label: t.study.difficulties.easy.label },
              { value: "medium", label: t.study.difficulties.medium.label },
              { value: "hard", label: t.study.difficulties.hard.label },
            ]}
          />
          <div className="flex flex-col justify-end pb-1">
            <Checkbox
              label={t.designSystem.syncCheckboxLabel}
              hint={t.designSystem.syncCheckboxHint}
              checked={checkedTerms}
              onChange={(e) => setCheckedTerms(e.target.checked)}
            />
          </div>
          <div className="md:col-span-2">
            <Textarea
              label={t.designSystem.summaryTextareaLabel}
              rows={3}
              value={sampleSummary}
              onChange={(e) => setSampleSummary(e.target.value)}
            />
          </div>
        </Card>
      </section>

      {/* 04. Chips, Cards de Selección y Stepper */}
      <section className="flex flex-col gap-4">
        <Eyebrow tone="muted">{t.designSystem.section04}</Eyebrow>
        <Card padding="lg" className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "en", code: "EN", label: t.languages.en },
              { id: "fr", code: "FR", label: t.languages.fr },
              { id: "es", code: "ES", label: t.languages.es },
              { id: "it", code: "IT", label: t.languages.it },
            ].map((item) => (
              <ChoiceChip
                key={item.id}
                codePrefix={item.code}
                selected={chipValues.includes(item.id)}
                indicator="plus-check"
                onClick={() => toggleChip(item.id)}
              >
                {item.label}
              </ChoiceChip>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ChoiceCard
              selected={selectedPlan === "basic"}
              badge={t.plans.tiers.dolly.badge}
              title={t.plans.tiers.dolly.name}
              meta={formatMessage(t.plans.quotaHeadlineLimited, { readings: 10 })}
              description={t.plans.tiers.dolly.description}
              onClick={() => setSelectedPlan("basic")}
            />
            <ChoiceCard
              selected={selectedPlan === "pro"}
              emphasis="filled"
              badge={t.plans.tiers.dolly_pro.badge}
              title={t.plans.tiers.dolly_pro.name}
              meta={t.plans.quotaHeadlineUnlimited}
              description={t.plans.tiers.dolly_pro.description}
              onClick={() => setSelectedPlan("pro")}
            />
          </div>

          <Stepper
            items={stepperItems}
            ariaLabel={t.meta.stepperAriaLabel}
            onStepSelect={(nextStep) => setActiveStep(nextStep)}
          />
        </Card>
      </section>

      {/* 05. Alertas, Badges, Progreso y KPIs */}
      <section className="flex flex-col gap-4">
        <Eyebrow tone="muted">{t.designSystem.section05}</Eyebrow>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="primary">PRIMARY B&W</Badge>
            <Badge variant="secondary">SECONDARY</Badge>
            <Badge variant="outline">OUTLINE</Badge>
            <Badge variant="success">SUCCESS SEMANTIC</Badge>
            <Badge variant="warning">WARNING SEMANTIC</Badge>
            <Badge variant="error">ERROR SEMANTIC</Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Alert
              variant="info"
              title={t.designSystem.infoAlertTitle}
              quote={t.designSystem.infoAlertQuote}
              quoteLabel={t.designSystem.infoAlertQuoteLabel}
            >
              {t.designSystem.infoAlertBody}
            </Alert>
            <Alert
              variant="success"
              title={t.designSystem.successAlertTitle}
              code="HTTP_200"
            >
              {t.designSystem.successAlertBody}
            </Alert>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              label={t.designSystem.statCompletedLabel}
              value={28}
              unit={t.designSystem.statCompletedUnit}
              footer={t.designSystem.statCompletedFooter}
              footerIcon="clock"
            />
            <StatCard
              label={t.designSystem.statAccuracyLabel}
              topMeta="92%"
              progress={92}
              value={92}
              unit="/ 100"
              description={t.designSystem.statAccuracyDesc}
            />
            <Card padding="sm" className="flex flex-col justify-between gap-4">
              <ProgressBar
                value={74}
                label={t.designSystem.progressDailyLabel}
                valueLabel="74 / 100"
              />
              <SegmentedMeter
                activeCount={3}
                total={3}
                caption={t.designSystem.meterCaption}
                statusLabel={t.designSystem.meterStatus}
                tone="success"
              />
            </Card>
          </div>
        </div>
      </section>

      {/* 06. Tablas, Paginación y Estados */}
      <section id="design-system-tables" className="flex flex-col gap-4">
        <Eyebrow tone="muted">{t.designSystem.section06}</Eyebrow>
        <Card padding="none" className="overflow-hidden">
          <DataTable>
            <DataTableHead>
              <DataTableRow>
                <DataTableHeadCell>{t.designSystem.tableColReading}</DataTableHeadCell>
                <DataTableHeadCell>{t.designSystem.tableColLanguage}</DataTableHeadCell>
                <DataTableHeadCell>{t.designSystem.tableColDifficulty}</DataTableHeadCell>
                <DataTableHeadCell>{t.designSystem.tableColScore}</DataTableHeadCell>
              </DataTableRow>
            </DataTableHead>
            <DataTableBody>
              {SAMPLE_ROWS.map((row) => (
                <DataTableRow key={row.id}>
                  <DataTableCell className="font-serif font-semibold">
                    {row.title}
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant="secondary">
                      {formatReadingLanguageBadge(row.langCode, locale)}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant="outline">
                      {getDifficultyMeta(row.levelKey, locale).label.toUpperCase()}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant="success">{row.score}/100</Badge>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </Card>

        <Pagination
          currentPage={page}
          totalPages={3}
          totalItems={15}
          visibleItemsCount={5}
          previousLabel={t.meta.paginationPrevious}
          nextLabel={t.meta.paginationNext}
          ariaLabel={t.meta.paginationAriaLabel}
          summaryText={formatMessage(t.meta.paginationSummaryDefault, {
            visible: 5,
            total: 15,
          })}
          onPageChange={setPage}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <EmptyState
            icon="book-open"
            badge="EMPTY STATE"
            title={t.designSystem.emptyTitle}
            description={t.designSystem.emptyDescription}
            actions={
              <ActionLink href="#design-system-forms" variant="primary" size="sm">
                {t.designSystem.emptyCta}
              </ActionLink>
            }
          />
          <SkeletonCard lines={3} label={t.designSystem.skeletonLabel} />
        </div>
      </section>

      {/* 07. Registro de Íconos Lucide */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <Eyebrow tone="muted">
            {formatMessage(t.designSystem.section07, {
              filtered: filteredIcons.length,
              total: AVAILABLE_ICON_NAMES.length,
            })}
          </Eyebrow>
          <Input
            label={t.designSystem.filterIconsLabel}
            placeholder="bookmark, sparkles..."
            value={iconQuery}
            onChange={(e) => setIconQuery(e.target.value)}
            containerClassName="w-full sm:w-64"
          />
        </div>

        <Card padding="md">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {filteredIcons.map((iconName) => (
              <div
                key={iconName}
                className="flex flex-col items-center gap-2 rounded-base border border-default bg-neutral-secondary-soft px-2 py-3 text-center"
              >
                <Icon name={iconName} size="md" />
                <span className="font-mono text-[10px] text-muted">
                  {iconName}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </Container>
  );
}
