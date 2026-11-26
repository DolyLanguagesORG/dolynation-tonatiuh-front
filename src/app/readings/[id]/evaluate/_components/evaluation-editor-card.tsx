"use client";

import {
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  Eyebrow,
  Icon,
  ProgressBar,
  Text,
  Textarea,
} from "@/components/ui";
import { formatMessage, type ReadingFlowDictionary } from "@/i18n";
import { type TargetLanguageCode } from "@/lib";

export interface EvaluationEditorCardProps {
  t: ReadingFlowDictionary;
  readingLanguage: TargetLanguageCode;
  responseText: string;
  wordCount: number;
  charCount: number;
  wordProgress: number;
  minWords?: number;
  maxWords?: number;
  maxChars?: number;
  isOverWordLimit?: boolean;
  isOverCharLimit?: boolean;
  validationError: string | null;
  submitError: string | null;
  draftNotice: string | null;
  isSubmitting: boolean;
  onChangeText: (value: string) => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
}

/**
 * Editor principal de resumen de comprensión con progreso de palabras,
 * autoguardado local y envío a evaluación por IA (`07-respuesta-de-comprension.png`).
 */
export function EvaluationEditorCard({
  t,
  readingLanguage,
  responseText,
  wordCount,
  charCount,
  wordProgress,
  minWords = 15,
  maxWords = 500,
  maxChars = 5000,
  isOverWordLimit = false,
  isOverCharLimit = false,
  validationError,
  submitError,
  draftNotice,
  isSubmitting,
  onChangeText,
  onSaveDraft,
  onSubmit,
}: EvaluationEditorCardProps) {
  const effectiveError =
    validationError ??
    (isOverWordLimit
      ? formatMessage(t.readings.eval.maxWordsError, { max: maxWords })
      : isOverCharLimit
        ? formatMessage(t.readings.eval.maxCharsError, { max: maxChars })
        : null);
  const isOverLimit = isOverWordLimit || isOverCharLimit;

  return (
    <Card padding="lg" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Eyebrow tone="muted">{t.readings.eval.openResponseTitle}</Eyebrow>
          <Badge variant="outline">{t.readings.eval.localSavedBadge}</Badge>
          {draftNotice && <Badge variant="success">{draftNotice}</Badge>}
        </div>

        <Button
          variant="secondary"
          size="xs"
          leftIcon={<Icon name="save" size="xs" />}
          onClick={onSaveDraft}
          disabled={isSubmitting}
        >
          {t.readings.eval.saveDraftButton}
        </Button>
      </div>

      {submitError && (
        <Alert variant="error" title={t.readings.eval.submitErrorTitle}>
          {submitError}
        </Alert>
      )}

      <Textarea
        lang={readingLanguage}
        label={t.readings.eval.textareaLabel}
        placeholder={t.readings.eval.textareaPlaceholder}
        rows={8}
        maxLength={maxChars}
        value={responseText}
        onChange={(event) => onChangeText(event.target.value)}
        error={effectiveError ?? undefined}
        disabled={isSubmitting}
        required
      />

      <div className="flex flex-col gap-2">
        <ProgressBar
          value={isOverLimit ? 100 : wordProgress}
          size="sm"
          color={isOverLimit ? "red" : "default"}
          label={formatMessage(t.readings.eval.wordLimitProgress, {
            count: wordCount,
            max: maxWords,
            min: minWords,
          })}
          valueLabel={formatMessage(t.readings.eval.charLimitCounter, {
            count: charCount,
            max: maxChars,
          })}
        />
      </div>

      <Divider />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Text variant="caption" tone="muted" className="max-w-md">
          {t.readings.eval.aiDisclaimer}
        </Text>

        <Button
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          disabled={isSubmitting || isOverLimit}
          rightIcon={<Icon name="arrow-right" size="sm" />}
          onClick={onSubmit}
        >
          {isSubmitting
            ? t.readings.eval.submittingButton
            : t.readings.eval.submitButton}
        </Button>
      </div>

      {isSubmitting && (
        <div className="flex flex-col gap-2">
          <Alert variant="info">
            {t.readings.eval.doNotReloadEvaluatingNotice}
          </Alert>
          <Text variant="caption" tone="muted" className="font-mono">
            {t.readings.eval.submittingAnalysisNotice}
          </Text>
        </div>
      )}
    </Card>
  );
}
