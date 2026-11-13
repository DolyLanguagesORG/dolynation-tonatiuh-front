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
import { type Dictionary, type Locale } from "@/i18n";

export interface EvaluationEditorCardProps {
  t: Dictionary;
  locale: Locale;
  responseText: string;
  wordCount: number;
  charCount: number;
  wordProgress: number;
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
  locale,
  responseText,
  wordCount,
  charCount,
  wordProgress,
  validationError,
  submitError,
  draftNotice,
  isSubmitting,
  onChangeText,
  onSaveDraft,
  onSubmit,
}: EvaluationEditorCardProps) {
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
        <Alert
          variant="error"
          title={
            locale === "es"
              ? "Error al enviar evaluación"
              : "Failed to submit evaluation"
          }
        >
          {submitError}
        </Alert>
      )}

      <Textarea
        label={t.readings.eval.textareaLabel}
        placeholder={t.readings.eval.textareaPlaceholder}
        rows={8}
        value={responseText}
        onChange={(event) => onChangeText(event.target.value)}
        error={validationError ?? undefined}
        disabled={isSubmitting}
        required
      />

      <div className="flex flex-col gap-2">
        <ProgressBar
          value={wordProgress}
          size="sm"
          label={`${wordCount} ${t.readings.eval.minWordsSuffix}`}
          valueLabel={`${charCount} ${t.readings.eval.charactersSuffix}`}
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
          rightIcon={<Icon name="arrow-right" size="sm" />}
          onClick={onSubmit}
        >
          {isSubmitting
            ? t.readings.eval.submittingButton
            : t.readings.eval.submitButton}
        </Button>
      </div>

      {isSubmitting && (
        <Text variant="caption" tone="muted" className="font-mono">
          {locale === "es"
            ? "Analizando retención temática, léxico contextual y claridad sintáctica..."
            : "Analyzing thematic retention, contextual lexicon, and syntactic clarity..."}
        </Text>
      )}
    </Card>
  );
}
