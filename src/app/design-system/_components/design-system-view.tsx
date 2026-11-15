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
import { useLocale } from "@/i18n";

const SAMPLE_ROWS = [
  {
    id: 101,
    title: "The Architecture of Distributed Memory",
    lang: "[EN] INGLÉS",
    level: "B2",
    score: 94,
  },
  {
    id: 102,
    title: "L'économie circulaire urbaine",
    lang: "[FR] FRANCÉS",
    level: "B1",
    score: 88,
  },
  {
    id: 103,
    title: "Ética algorítmica en la clínica moderna",
    lang: "[ES] ESPAÑOL",
    level: "C1",
    score: 91,
  },
];

/**
 * Catálogo interactivo oficial de componentes estandarizados DolyNation (`/design-system`).
 */
export function DesignSystemView() {
  const { locale, t } = useLocale();

  const [chipValues, setChipValues] = useState<string[]>(["en", "tech"]);
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
      label: locale === "es" ? "Datos" : "Details",
      isCompleted: activeStep > 1,
      isCurrent: activeStep === 1,
    },
    {
      step: 2,
      label: locale === "es" ? "Verificar" : "Verify",
      isCompleted: activeStep > 2,
      isCurrent: activeStep === 2,
    },
    {
      step: 3,
      label: locale === "es" ? "Plan" : "Plan",
      isCompleted: activeStep > 3,
      isCurrent: activeStep === 3,
    },
    {
      step: 4,
      label: locale === "es" ? "Idiomas" : "Languages",
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
        <Eyebrow tone="muted">
          01. {locale === "es" ? "TIPOGRAFÍA Y JERARQUÍA" : "TYPOGRAPHY & HIERARCHY"}
        </Eyebrow>
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
            [META / CODE] • CEFR B1-B2 • 14 MIN FOCUS
          </Text>
        </Card>
      </section>

      {/* 02. Botones y Enlaces */}
      <section className="flex flex-col gap-4">
        <Eyebrow tone="muted">
          02. {locale === "es" ? "BOTONES, ENLACES E ICONOGRAFÍA" : "BUTTONS, ACTION LINKS & ICON BUTTONS"}
        </Eyebrow>
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
            <IconButton icon="bookmark" variant="secondary" aria-label="Guardar" />
            <IconButton icon="volume-2" variant="outline" aria-label="Audio" />
            <IconButton icon="settings" variant="ghost" aria-label="Ajustes" />
          </div>
        </Card>
      </section>

      {/* 03. Formularios */}
      <section id="design-system-forms" className="flex flex-col gap-4">
        <Eyebrow tone="muted">
          03. {locale === "es" ? "CONTROLES DE FORMULARIO" : "FORM CONTROLS"}
        </Eyebrow>
        <Card padding="lg" className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Input
            label="Correo institucional"
            hint="Validación accesible aria-describedby"
            value={sampleInput}
            onChange={(e) => setSampleInput(e.target.value)}
          />
          <PasswordInput
            label="Contraseña académica"
            value={samplePassword}
            onChange={(e) => setSamplePassword(e.target.value)}
          />
          <Select
            label="Nivel CEFR objetivo"
            value={sampleLevel}
            onChange={(e) => setSampleLevel(e.target.value)}
            options={[
              { value: "easy", label: "Básico (A1–A2)" },
              { value: "medium", label: "Intermedio (B1–B2)" },
              { value: "hard", label: "Avanzado (C1–C2)" },
            ]}
          />
          <div className="flex flex-col justify-end pb-1">
            <Checkbox
              label="Activar sincronización de progreso CEFR"
              hint="Guarda estadísticas en tu perfil académico."
              checked={checkedTerms}
              onChange={(e) => setCheckedTerms(e.target.checked)}
            />
          </div>
          <div className="md:col-span-2">
            <Textarea
              label="Resumen de comprensión"
              rows={3}
              value={sampleSummary}
              onChange={(e) => setSampleSummary(e.target.value)}
            />
          </div>
        </Card>
      </section>

      {/* 04. Chips, Cards de Selección y Stepper */}
      <section className="flex flex-col gap-4">
        <Eyebrow tone="muted">
          04. {locale === "es" ? "CHIPS, TARJETAS DE SELECCIÓN Y STEPPER" : "CHIPS, CHOICE CARDS & STEPPER"}
        </Eyebrow>
        <Card padding="lg" className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "en", code: "EN", label: "Inglés" },
              { id: "fr", code: "FR", label: "Francés" },
              { id: "tech", label: "Tecnología" },
              { id: "science", label: "Ciencia" },
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
              badge="BASIC"
              title="Dolly"
              meta="10 lecturas / día"
              description="1 idioma activo y lecturas diarias adaptadas."
              onClick={() => setSelectedPlan("basic")}
            />
            <ChoiceCard
              selected={selectedPlan === "pro"}
              emphasis="filled"
              badge="ALL ACCESS"
              title="Dolly Pro"
              meta="Cuotas ilimitadas"
              description="4 idiomas simultáneos y retroalimentación ilimitada."
              onClick={() => setSelectedPlan("pro")}
            />
          </div>

          <Stepper
            items={stepperItems}
            onStepSelect={(nextStep) => setActiveStep(nextStep)}
          />
        </Card>
      </section>

      {/* 05. Alertas, Badges, Progreso y KPIs */}
      <section className="flex flex-col gap-4">
        <Eyebrow tone="muted">
          05. {locale === "es" ? "ALERTAS, INSIGNIAS, MÉTRICAS Y PROGRESO" : "ALERTS, BADGES, STATS & PROGRESS"}
        </Eyebrow>
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
              title="Nota editorial"
              quote="Incluye dos conectores de contraste en tu próximo resumen."
              quoteLabel="RECOMENDACIÓN IA:"
            >
              Solo las alertas semánticas introducen color fuera de la paleta B&W.
            </Alert>
            <Alert variant="success" title="Sincronización correcta" code="HTTP_200">
              Tus preferencias académicas están listas para generar nuevas lecturas.
            </Alert>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              label="LECTURAS COMPLETADAS"
              value={28}
              unit="textos"
              footer="Última sesión hace 2 h"
              footerIcon="clock"
            />
            <StatCard
              label="PRECISIÓN CONTEXTUAL"
              topMeta="92%"
              progress={92}
              value={92}
              unit="/ 100"
              description="Promedio sostenido en lecturas B1–B2."
            />
            <Card padding="sm" className="flex flex-col justify-between gap-4">
              <ProgressBar
                value={74}
                label="Meta diaria de palabras"
                valueLabel="74 / 100"
              />
              <SegmentedMeter
                activeCount={3}
                total={3}
                caption="Fortaleza léxica"
                statusLabel="ÓPTIMA"
                tone="success"
              />
            </Card>
          </div>
        </div>
      </section>

      {/* 06. Tablas, Paginación y Estados */}
      <section id="design-system-tables" className="flex flex-col gap-4">
        <Eyebrow tone="muted">
          06. {locale === "es" ? "TABLAS, PAGINACIÓN Y ESTADOS" : "TABLES, PAGINATION & STATES"}
        </Eyebrow>
        <Card padding="none" className="overflow-hidden">
          <DataTable>
            <DataTableHead>
              <DataTableRow>
                <DataTableHeadCell>LECTURA</DataTableHeadCell>
                <DataTableHeadCell>IDIOMA</DataTableHeadCell>
                <DataTableHeadCell>CEFR</DataTableHeadCell>
                <DataTableHeadCell>SCORE</DataTableHeadCell>
              </DataTableRow>
            </DataTableHead>
            <DataTableBody>
              {SAMPLE_ROWS.map((row) => (
                <DataTableRow key={row.id}>
                  <DataTableCell className="font-serif font-semibold">
                    {row.title}
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant="secondary">{row.lang}</Badge>
                  </DataTableCell>
                  <DataTableCell>
                    <Badge variant="outline">{row.level}</Badge>
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
          onPageChange={setPage}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <EmptyState
            icon="book-open"
            badge="EMPTY STATE"
            title="Sin lecturas pendientes"
            description="Genera un texto adaptado a tu nivel CEFR para practicar hoy."
            actions={
              <ActionLink href="#design-system-forms" variant="primary" size="sm">
                Ir a formularios demo
              </ActionLink>
            }
          />
          <SkeletonCard lines={3} label="Demostración de esqueleto" />
        </div>
      </section>

      {/* 07. Registro de Íconos Lucide */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <Eyebrow tone="muted">
            07. ICON REGISTRY ({filteredIcons.length} / {AVAILABLE_ICON_NAMES.length})
          </Eyebrow>
          <Input
            label={locale === "es" ? "Filtrar íconos" : "Filter icons"}
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
