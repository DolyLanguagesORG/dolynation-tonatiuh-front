"use client";

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
import { ErrorCode, type StudyParameters } from "@/lib";

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
                  ? locale === "es"
                    ? `HOY: ${study.subscriptionUsage.readingsCreatedToday}/${study.subscriptionUsage.readingsLimit} LECTURAS`
                    : `TODAY: ${study.subscriptionUsage.readingsCreatedToday}/${study.subscriptionUsage.readingsLimit} READINGS`
                  : locale === "es"
                    ? "LECTURAS ILIMITADAS"
                    : "UNLIMITED READINGS"}
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
                  ? locale === "es"
                    ? "Debes seleccionar al menos un idioma meta de estudio y registrar 3 categorías favoritas en tu cuenta antes de generar nuevas lecturas."
                    : "Select at least one target study language and 3 favorite categories before generating new readings."
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

        {study.validationError && (
          <Alert
            variant="error"
            code={study.validationErrorCode ?? undefined}
            title={
              study.validationErrorCode
                ? locale === "es"
                  ? "No se pudo completar la acción"
                  : "Action could not be completed"
                : locale === "es"
                  ? "Parámetro incompleto"
                  : "Missing parameter"
            }
            onDismiss={() => study.setValidationError(null)}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{study.validationError}</span>
              {study.validationErrorCode ===
                ErrorCode.READING_PENDING_LIMIT_REACHED && (
                <ActionLink
                  href="/readings"
                  variant="secondary"
                  size="sm"
                  rightIcon={<Icon name="arrow-right" size="xs" />}
                  className="shrink-0 normal-case tracking-normal"
                >
                  {locale === "es"
                    ? "Ver lecturas pendientes"
                    : "View pending readings"}
                </ActionLink>
              )}
              {(study.validationErrorCode ===
                ErrorCode.READING_DAILY_LIMIT_REACHED ||
                study.validationErrorCode ===
                  ErrorCode.SUBSCRIPTION_CATEGORY_LIMIT_EXCEEDED ||
                study.validationErrorCode ===
                  ErrorCode.SUBSCRIPTION_LANGUAGE_LIMIT_EXCEEDED) && (
                <ActionLink
                  href="/profile#subscription"
                  variant="secondary"
                  size="sm"
                  rightIcon={<Icon name="arrow-right" size="xs" />}
                  className="shrink-0 normal-case tracking-normal"
                >
                  {locale === "es"
                    ? "Ver plan y consumo"
                    : "View plan & usage"}
                </ActionLink>
              )}
            </div>
          </Alert>
        )}

        {study.saveNotice && (
          <Alert
            variant="success"
            title={locale === "es" ? "Preferencias guardadas" : "Preferences saved"}
            onDismiss={() => study.setSaveNotice(null)}
          >
            {study.saveNotice}
          </Alert>
        )}

        {study.generationNotice && (
          <Alert
            variant="info"
            title={locale === "es" ? "Sesión de estudio configurada" : "Study session ready"}
            code="STUDY_READY"
            onDismiss={() => study.setGenerationNotice(null)}
          >
            {study.generationNotice}
          </Alert>
        )}

        <LanguageSelectorSection
          title={t.study.step1Language}
          locale={locale}
          selectedLanguage={study.effectiveLanguage}
          activePlanLanguages={study.activePlanLanguages}
          onSelect={(lang) => {
            study.setSelectedLanguage(lang);
            study.setValidationError(null);
          }}
        />

        <CategorySelectorSection
          title={t.study.step2Category}
          locale={locale}
          categories={study.categories}
          selectedCategory={study.selectedCategory}
          customCategoryBadge={t.study.customCategoryBadge}
          addCategoryPrompt={t.study.addCategoryPrompt}
          addCategoryPlaceholder={t.study.addCategoryPlaceholder}
          addCategoryButton={t.study.addCategoryButton}
          emptyNotice={t.study.emptyCategoriesNotice}
          isAddingCustom={study.isAddingCustom}
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
            study.setValidationError(null);
          }}
        />

        <DifficultySelectorSection
          title={t.study.step3Difficulty}
          locale={locale}
          difficulties={study.difficulties}
          selectedDifficulty={study.selectedDifficulty}
          onSelect={(difficulty) => {
            study.setSelectedDifficulty(difficulty);
            study.setValidationError(null);
          }}
        />

        <SizeSelectorSection
          title={t.study.step4Length}
          locale={locale}
          sizes={study.sizes}
          selectedSize={study.selectedSize}
          onSelect={(size) => {
            study.setSelectedSize(size);
            study.setValidationError(null);
          }}
        />

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
              leftIcon={<Icon name="sparkles" size="sm" />}
              className="normal-case tracking-normal"
            >
              {t.study.generateButton}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
