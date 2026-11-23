"use client";

import { useEffect, useState } from "react";

import { TurnstileField } from "@/components/security";
import { CategorySelectorSection } from "@/components/study/category-selector-section";
import { DifficultySelectorSection } from "@/components/study/difficulty-selector-section";
import { LanguageSelectorSection } from "@/components/study/language-selector-section";
import { SizeSelectorSection } from "@/components/study/size-selector-section";
import { useStudyParameters } from "@/components/study/use-study-parameters";
import {
  ActionLink,
  Alert,
  Badge,
  Button,
  Card,
  Icon,
  SkeletonCard,
  Text,
} from "@/components/ui";
import { formatMessage } from "@/i18n";
import { type StudyParameters } from "@/lib";

export interface StudyParametersFormProps {
  /**
   * Identificador del contenedor (por ejemplo para anclajes `#generar-lectura`).
   */
  id?: string;
  /**
   * Variante visual: 'standalone' (página dedicada /generate) o 'embedded' (inicio).
   */
  variant?: "standalone" | "embedded";
  /**
   * Callback opcional disparado cuando el usuario hace submit para generar la lectura.
   */
  onGenerate?: (parameters: StudyParameters) => void;
}

function ReadingGenerationProgress({
  title,
  subtitle,
  stages,
  inProgressBadge,
}: {
  title: string;
  subtitle: string;
  stages: readonly string[];
  inProgressBadge: string;
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const stageIndex = elapsedSeconds < 2 ? 0 : elapsedSeconds < 5 ? 1 : 2;
  const progressWidth =
    stageIndex === 0 ? "32%" : stageIndex === 1 ? "68%" : "90%";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={title}
      className="flex flex-col gap-3 rounded-base border border-strong bg-neutral-primary-soft p-4 shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-base bg-ink text-ink-contrast"
          >
            <Icon name="loader" size="sm" className="animate-spin" />
          </span>
          <span className="font-mono text-xs font-bold tracking-wider text-ink uppercase">
            {title}
          </span>
        </div>

        <span className="rounded-xxs border border-default bg-surface px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-muted">
          {elapsedSeconds}s · {inProgressBadge}
        </span>
      </div>

      <Text variant="small" tone="muted">
        {subtitle}
      </Text>

      <div
        aria-hidden="true"
        className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-secondary-medium"
      >
        <div
          className="h-full rounded-full bg-brand transition-all duration-700 ease-out"
          style={{ width: progressWidth }}
        />
      </div>

      <p className="font-mono text-[11px] font-medium text-heading">
        {stages[stageIndex]}
      </p>
    </div>
  );
}

/**
 * Formulario modular de configuración paramétrica y generación IA de lecturas.
 */
export function StudyParametersForm({
  id = "generar-lectura",
  variant = "standalone",
  onGenerate,
}: StudyParametersFormProps) {
  const study = useStudyParameters(onGenerate);
  const { locale, t } = study;

  if (study.isLoading) {
    return (
      <SkeletonCard
        lines={4}
        label={t.study.loadingParametersNotice}
        className="w-full"
      />
    );
  }

  return (
    <Card
      id={id}
      padding="lg"
      as="section"
      className={`w-full border-default bg-surface ${
        variant === "standalone" ? "shadow-xs sm:p-8" : ""
      }`}
    >
      <form
        onSubmit={study.handleSubmit}
        noValidate
        aria-labelledby="study-parameters-heading"
        className="flex flex-col gap-8"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-6 w-6 items-center justify-center rounded-xs bg-ink text-ink-contrast"
            >
              <Icon name="sliders" size="xs" />
            </span>
            <h2
              id="study-parameters-heading"
              className="font-mono text-xs font-bold tracking-wider text-ink uppercase sm:text-sm"
            >
              {t.study.formTitle}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {study.subscriptionUsage && (
              <Badge
                variant={
                  study.subscriptionUsage.readingsRemainingToday === 0
                    ? "warning"
                    : "secondary"
                }
              >
                {study.subscriptionUsage.readingsLimit != null
                  ? formatMessage(t.study.todayQuotaBadge, {
                      created: study.subscriptionUsage.readingsCreatedToday,
                      limit: study.subscriptionUsage.readingsLimit,
                    })
                  : t.study.unlimitedReadingsBadge}
              </Badge>
            )}
            <Badge variant="outline">
              {study.effectiveLanguage.toUpperCase()} •{" "}
              {study.selectedDifficulty.toUpperCase()}
            </Badge>
          </div>
        </div>

        {study.isPreferencesBlocked && (
          <Alert variant="warning" title={t.study.generationBlockedTitle}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>
                {study.missingLanguagesForGeneration &&
                study.missingCategoriesForGeneration
                  ? t.study.generationBlockedBoth
                  : study.missingLanguagesForGeneration
                    ? t.study.generationBlockedLanguages
                    : t.study.generationBlockedCategories}
              </span>
              <ActionLink
                href="/setup-preferences"
                variant="primary"
                size="sm"
                rightIcon={<Icon name="arrow-right" size="xs" />}
                className="shrink-0 normal-case tracking-normal"
              >
                {t.study.goToPreferencesButton}
              </ActionLink>
            </div>
          </Alert>
        )}

        <LanguageSelectorSection
          title={t.study.step1Language}
          locale={locale}
          selectedLanguage={study.effectiveLanguage}
          activePlanLanguages={study.activePlanLanguages}
          onSelect={(lang) => {
            study.setSelectedLanguage(lang);
          }}
        />

        <CategorySelectorSection
          title={t.study.step2Category}
          locale={locale}
          categories={study.categories}
          selectedCategory={study.selectedCategory}
          addCategoryPrompt={t.study.addCategoryPrompt}
          addCategoryPlaceholder={t.study.addCategoryPlaceholder}
          addCategoryButton={t.study.addCategoryButton}
          emptyNotice={t.study.emptyCategoriesNotice}
          isAddingCustom={study.isAddingCustom}
          isSubmittingCustom={study.isSubmittingCustom}
          customCategoryName={study.customCategoryName}
          customCategoryError={study.customCategoryError}
          onStartAddCustom={() => study.setIsAddingCustom(true)}
          onCancelAddCustom={study.cancelCustomCategory}
          onCustomNameChange={(value) => {
            study.setCustomCategoryName(value);
            study.setCustomCategoryError(null);
          }}
          onConfirmAddCustom={study.handleAddCustomCategory}
          onSelectCategory={(categoryId) => {
            study.setSelectedCategory(categoryId);
          }}
        />

        <DifficultySelectorSection
          title={t.study.step3Difficulty}
          locale={locale}
          difficulties={study.difficulties}
          selectedDifficulty={study.selectedDifficulty}
          onSelect={(difficulty) => {
            study.setSelectedDifficulty(difficulty);
          }}
        />

        <SizeSelectorSection
          title={t.study.step4Length}
          locale={locale}
          sizes={study.sizes}
          selectedSize={study.selectedSize}
          onSelect={(size) => {
            study.setSelectedSize(size);
          }}
        />

        {study.isSubmitting && (
          <ReadingGenerationProgress
            title={t.study.generatingTitle}
            subtitle={t.study.generatingSubtitle}
            stages={t.study.generatingStages}
            inProgressBadge={t.study.aiInProgressBadge}
          />
        )}

        <TurnstileField containerRef={study.captchaContainerRef} />

        <div className="flex flex-col justify-between gap-4 border-t border-border pt-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <Icon name="clock" size="md" className="text-ink" />
            <Text as="span" variant="small" tone="muted">
              {t.study.estimatedTimePrefix}
              <strong className="font-mono font-bold text-ink">
                {study.estimatedTime}
              </strong>
              {t.study.estimatedMinutes}
            </Text>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={study.isSubmitting}
              isLoading={study.isSaving}
              onClick={study.handleSavePreferences}
            >
              {t.study.savePreferencesButton}
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={study.isPreferencesBlocked}
              isLoading={study.isSubmitting}
              aria-busy={study.isSubmitting}
              leftIcon={<Icon name="sparkles" size="sm" />}
              className="normal-case tracking-normal"
            >
              {study.isSubmitting
                ? t.study.generatingButton
                : t.study.generateButton}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
