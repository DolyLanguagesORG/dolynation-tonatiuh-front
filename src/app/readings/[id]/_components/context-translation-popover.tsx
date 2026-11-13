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
import { type ExplanationResultDto } from "@/lib";

export interface ContextTranslationPopoverProps {
  t: Dictionary;
  locale: Locale;
  word: string;
  contextSentence: string | null;
  explanationData: ExplanationResultDto | null;
  deepExplanation: string | null;
  isLoading: boolean;
  isSavingGlossary: boolean;
  isDeepLoading: boolean;
  errorMessage: string | null;
  onPronounce: (text: string) => void;
  onRefresh: () => void;
  onRequestDeepExplanation: () => void;
  onToggleSave: () => void;
  onClose: () => void;
}

/**
 * Panel estructurado de ayuda contextual y desglose lingüístico en el idioma de la lectura:
 * desglose palabra por palabra, sentido literal, explicación en el texto, otras formas
 * de expresarlo y otros contextos reales de uso.
 */
export function ContextTranslationPopover({
  t,
  locale,
  word,
  contextSentence,
  explanationData,
  deepExplanation,
  isLoading,
  isSavingGlossary,
  isDeepLoading,
  errorMessage,
  onPronounce,
  onRefresh,
  onRequestDeepExplanation,
  onToggleSave,
  onClose,
}: ContextTranslationPopoverProps) {
  const isPhrase =
    explanationData?.entryType === "phrase" || word.trim().includes(" ");
  const isSaved = Boolean(explanationData?.isSaved);
  const canSave = typeof explanationData?.id === "number";

  return (
    <Card
      as="aside"
      aria-label={t.readings.aiContextTitle}
      padding="md"
      className="flex flex-col gap-4 border-brand shadow-md lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Icon name="sparkles" size="xs" />
            <Eyebrow tone="muted">{t.readings.aiContextTitle}</Eyebrow>
            <Badge variant="outline">
              {isPhrase ? t.readings.entryTypePhrase : t.readings.entryTypeWord}
            </Badge>
            {explanationData && (
              <>
                <Badge variant="secondary">
                  {explanationData.language.toUpperCase()} ·{" "}
                  {explanationData.difficulty.toUpperCase()}
                </Badge>
                {explanationData.cached && (
                  <Badge variant="secondary">{t.readings.cachedBadge}</Badge>
                )}
              </>
            )}
          </div>
          <p className="font-serif text-xl font-bold leading-snug text-heading sm:text-2xl">
            {word}
          </p>
        </div>

        <IconButton
          icon="close"
          size="xs"
          variant="ghost"
          aria-label={locale === "es" ? "Cerrar ayuda" : "Close help"}
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
        <div className="flex items-center gap-2 py-3 text-xs text-muted">
          <Badge variant="outline">IA</Badge>
          <span>{t.readings.loadingContextNotice}</span>
        </div>
      ) : errorMessage ? (
        <Alert variant="error">{errorMessage}</Alert>
      ) : (
        explanationData && (
          <div className="flex flex-col gap-4">
            <section className="flex flex-col gap-1.5">
              <Text
                variant="caption"
                tone="muted"
                className="font-bold uppercase"
              >
                {t.readings.meaningInTextLabel}
              </Text>
              <Text variant="body" tone="heading" className="leading-relaxed">
                {explanationData.explanation}
              </Text>
            </section>

            {explanationData.literalMeaning && (
              <section className="rounded-base border border-default bg-surface px-3 py-2.5">
                <Text
                  variant="caption"
                  tone="muted"
                  className="font-bold uppercase"
                >
                  {t.readings.literalMeaningLabel}
                </Text>
                <Text
                  variant="small"
                  tone="body"
                  className="mt-1 leading-relaxed"
                >
                  {explanationData.literalMeaning}
                </Text>
              </section>
            )}

            {explanationData.wordBreakdown.length > 0 && (
              <section className="flex flex-col gap-2">
                <Text
                  variant="caption"
                  tone="muted"
                  className="font-bold uppercase"
                >
                  {t.readings.wordBreakdownTitle}
                </Text>
                <ul className="divide-y divide-default rounded-base border border-default bg-surface">
                  {explanationData.wordBreakdown.map((item, idx) => (
                    <li
                      key={`${item.token}-${idx}`}
                      className="flex flex-col gap-1 px-3 py-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex flex-wrap items-baseline gap-1.5">
                          <span className="font-serif text-sm font-bold text-heading">
                            {item.token}
                          </span>
                          {item.lemma &&
                            item.lemma.toLowerCase() !==
                              item.token.toLowerCase() && (
                              <span className="font-mono text-xs text-muted">
                                ({item.lemma})
                              </span>
                            )}
                        </div>
                        {item.partOfSpeech && (
                          <Badge variant="outline">{item.partOfSpeech}</Badge>
                        )}
                      </div>
                      <Text
                        variant="small"
                        tone="body"
                        className="leading-snug"
                      >
                        {item.literalDefinition}
                      </Text>
                      {item.roleInPhrase && (
                        <Text variant="caption" tone="muted">
                          {t.readings.wordBreakdownNoteLabel} {item.roleInPhrase}
                        </Text>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {explanationData.otherWaysToSay.length > 0 && (
              <section className="flex flex-col gap-2">
                <Text
                  variant="caption"
                  tone="muted"
                  className="font-bold uppercase"
                >
                  {t.readings.otherWaysTitle}
                </Text>
                <ul className="flex flex-col gap-2">
                  {explanationData.otherWaysToSay.map((alt, idx) => (
                    <li
                      key={`${alt.expression}-${idx}`}
                      className="rounded-base border border-default bg-surface px-3 py-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-serif text-sm font-semibold text-heading">
                            {alt.expression}
                          </span>
                          {alt.register && (
                            <Badge variant="secondary">{alt.register}</Badge>
                          )}
                        </div>
                        <IconButton
                          icon="volume-2"
                          size="xs"
                          variant="ghost"
                          aria-label={`${t.readings.pronounceButton}: ${alt.expression}`}
                          onClick={() => onPronounce(alt.expression)}
                        />
                      </div>
                      {alt.note && (
                        <Text variant="caption" tone="muted" className="mt-1">
                          {alt.note}
                        </Text>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {explanationData.otherContexts.length > 0 && (
              <section className="flex flex-col gap-2">
                <Text
                  variant="caption"
                  tone="muted"
                  className="font-bold uppercase"
                >
                  {t.readings.otherContextsTitle}
                </Text>
                <div className="flex flex-col gap-2">
                  {explanationData.otherContexts.map((ctx, idx) => (
                    <div
                      key={`${ctx.contextLabel}-${idx}`}
                      className="border-l-2 border-brand bg-neutral-secondary-soft px-3 py-2"
                    >
                      {ctx.contextLabel && (
                        <Text
                          variant="caption"
                          tone="heading"
                          className="font-semibold uppercase"
                        >
                          {ctx.contextLabel}
                        </Text>
                      )}
                      {ctx.explanation && (
                        <Text variant="small" tone="body" className="mt-0.5">
                          {ctx.explanation}
                        </Text>
                      )}
                      {ctx.example && (
                        <div className="mt-1.5 flex items-start justify-between gap-2">
                          <Text
                            variant="small"
                            tone="heading"
                            className="font-serif italic"
                          >
                            “{ctx.example}”
                          </Text>
                          <IconButton
                            icon="volume-2"
                            size="xs"
                            variant="ghost"
                            aria-label={`${t.readings.pronounceButton}: ${ctx.example}`}
                            onClick={() => onPronounce(ctx.example)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
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
          onClick={() => onPronounce(word)}
        >
          {t.readings.pronounceButton}
        </Button>

        <Button
          variant={isSaved ? "primary" : "outline"}
          size="xs"
          isLoading={isSavingGlossary}
          disabled={!canSave || isLoading}
          leftIcon={<Icon name={isSaved ? "check" : "bookmark"} size="xs" />}
          onClick={onToggleSave}
        >
          {isSaved ? t.readings.savedTermButton : t.readings.saveTermButton}
        </Button>

        {!isLoading && explanationData && (
          <Button
            variant="ghost"
            size="xs"
            leftIcon={<Icon name="sparkles" size="xs" />}
            onClick={onRefresh}
          >
            {t.readings.refreshAnalysisButton}
          </Button>
        )}

        {!deepExplanation && !isLoading && explanationData && (
          <Button
            variant="ghost"
            size="xs"
            isLoading={isDeepLoading}
            leftIcon={<Icon name="brain" size="xs" />}
            onClick={onRequestDeepExplanation}
          >
            {t.readings.detailedExplanationButton}
          </Button>
        )}
      </div>
    </Card>
  );
}
