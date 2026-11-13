"use client";

import {
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  Eyebrow,
  Icon,
  IconButton,
  Text,
} from "@/components/ui";
import { type Dictionary, type Locale } from "@/i18n";

export interface ContextTranslationPopoverProps {
  t: Dictionary;
  locale: Locale;
  word: string;
  contextSentence: string | null;
  explanation: string | null;
  deepExplanation: string | null;
  isLoading: boolean;
  isDeepLoading: boolean;
  errorMessage: string | null;
  isSaved: boolean;
  onPronounce: () => void;
  onRequestDeepExplanation: () => void;
  onToggleSave: () => void;
  onClose: () => void;
}

/**
 * Panel flotante/fijado de análisis contextual IA para palabras seleccionadas
 * dentro de la lectura (`06-detalle-de-lectura.png`).
 */
export function ContextTranslationPopover({
  t,
  locale,
  word,
  contextSentence,
  explanation,
  deepExplanation,
  isLoading,
  isDeepLoading,
  errorMessage,
  isSaved,
  onPronounce,
  onRequestDeepExplanation,
  onToggleSave,
  onClose,
}: ContextTranslationPopoverProps) {
  return (
    <Card
      as="aside"
      aria-label={t.readings.aiContextTitle}
      padding="md"
      className="flex flex-col gap-3.5 border-brand shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Icon name="sparkles" size="xs" />
            <Eyebrow tone="muted">{t.readings.aiContextTitle}</Eyebrow>
          </div>
          <p className="font-serif text-2xl font-bold text-heading">{word}</p>
        </div>

        <IconButton
          icon="close"
          size="xs"
          variant="ghost"
          aria-label={locale === "es" ? "Cerrar análisis" : "Close analysis"}
          onClick={onClose}
        />
      </div>

      {contextSentence && (
        <div className="rounded-base border border-default bg-neutral-secondary-soft px-3 py-2">
          <Text variant="caption" tone="muted" className="font-mono uppercase">
            {locale === "es" ? "FRAGMENTO" : "EXCERPT"}
          </Text>
          <Text variant="small" tone="body" className="mt-0.5 italic">
            “{contextSentence}”
          </Text>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 py-2 text-xs text-muted">
          <Badge variant="outline">IA</Badge>
          <span>{t.readings.loadingContextNotice}</span>
        </div>
      ) : errorMessage ? (
        <Alert variant="error">{errorMessage}</Alert>
      ) : (
        explanation && (
          <div className="flex flex-col gap-2">
            <Text variant="caption" tone="muted" className="font-bold uppercase">
              {t.readings.meaningInTextLabel}
            </Text>
            <Text variant="body" tone="heading" className="leading-relaxed">
              {explanation}
            </Text>
          </div>
        )
      )}

      {deepExplanation && (
        <div className="border-t border-default pt-2.5">
          <Text variant="caption" tone="muted" className="font-bold uppercase">
            {t.readings.detailedExplanationButton}
          </Text>
          <Text variant="small" tone="body" className="mt-1 leading-relaxed">
            {deepExplanation}
          </Text>
        </div>
      )}

      <Divider />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="xs"
          leftIcon={<Icon name="volume-2" size="xs" />}
          onClick={onPronounce}
        >
          {t.readings.pronounceButton}
        </Button>

        {!deepExplanation && (
          <Button
            variant="secondary"
            size="xs"
            isLoading={isDeepLoading}
            leftIcon={<Icon name="brain" size="xs" />}
            onClick={onRequestDeepExplanation}
          >
            {t.readings.detailedExplanationButton}
          </Button>
        )}

        <Button
          variant={isSaved ? "primary" : "outline"}
          size="xs"
          leftIcon={<Icon name={isSaved ? "check" : "bookmark"} size="xs" />}
          onClick={onToggleSave}
        >
          {isSaved ? t.readings.savedTermButton : t.readings.saveTermButton}
        </Button>
      </div>
    </Card>
  );
}
