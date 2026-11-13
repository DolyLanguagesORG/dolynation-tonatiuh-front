"use client";

import { useState } from "react";

import {
  ActionLink,
  Badge,
  Button,
  Card,
  Divider,
  Icon,
  IconButton,
  Text,
} from "@/components/ui";
import { type Dictionary, type Locale } from "@/i18n";
import {
  formatReadingDate,
  type GlossaryEntryDto,
  type TargetLanguageCode,
} from "@/lib";

export interface GlossaryEntryCardProps {
  t: Dictionary;
  locale: Locale;
  entry: GlossaryEntryDto;
  isToggling: boolean;
  onToggleSave: (entry: GlossaryEntryDto) => void;
  onPronounce: (text: string, language: TargetLanguageCode) => void;
}

/**
 * Tarjeta editorial de una entrada persistida del glosario: muestra el sentido
 * literal, la explicación en su lectura de origen, el desglose palabra por palabra,
 * alternativas naturales y otros contextos con ejemplos reales.
 */
export function GlossaryEntryCard({
  t,
  locale,
  entry,
  isToggling,
  onToggleSave,
  onPronounce,
}: GlossaryEntryCardProps) {
  const hasDetails =
    entry.wordBreakdown.length > 0 ||
    entry.otherWaysToSay.length > 0 ||
    entry.otherContexts.length > 0;
  const [expanded, setExpanded] = useState(true);

  return (
    <Card padding="lg" className="flex flex-col gap-4 border-default-medium">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline">
              {entry.entryType === "phrase"
                ? t.glossary.entryTypePhrase
                : t.glossary.entryTypeWord}
            </Badge>
            <Badge variant="secondary">
              {entry.language.toUpperCase()} · {entry.difficulty.toUpperCase()}
            </Badge>
            {entry.isSaved && (
              <Badge variant="primary">{t.glossary.savedBadge}</Badge>
            )}
            <Text variant="caption" tone="muted" className="font-mono">
              {formatReadingDate(entry.createdAt, locale)}
            </Text>
          </div>

          <div className="flex items-center gap-2">
            <h3 className="font-serif text-xl font-bold text-heading sm:text-2xl">
              {entry.word}
            </h3>
            <IconButton
              icon="volume-2"
              size="xs"
              variant="ghost"
              aria-label={`${t.glossary.pronounceButton}: ${entry.word}`}
              onClick={() => onPronounce(entry.word, entry.language)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={entry.isSaved ? "primary" : "outline"}
            size="xs"
            isLoading={isToggling}
            leftIcon={
              <Icon name={entry.isSaved ? "check" : "bookmark"} size="xs" />
            }
            onClick={() => onToggleSave(entry)}
          >
            {entry.isSaved
              ? t.glossary.removeFromGlossaryButton
              : t.glossary.addToGlossaryButton}
          </Button>

          <ActionLink
            href={`/readings/${entry.readingId}`}
            variant="secondary"
            size="xs"
            rightIcon={<Icon name="arrow-right" size="xs" />}
          >
            {t.glossary.openReadingButton}
          </ActionLink>
        </div>
      </div>

      {entry.context && (
        <div className="rounded-base border border-default bg-neutral-secondary-soft px-3.5 py-2">
          <Text variant="caption" tone="muted" className="font-mono uppercase">
            {t.glossary.sourceReadingLabel} {entry.readingTitle}
          </Text>
          <Text variant="small" tone="body" className="mt-1 italic">
            “{entry.context}”
          </Text>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Text variant="caption" tone="muted" className="font-bold uppercase">
            {t.glossary.readingContextLabel}
          </Text>
          <Text variant="body" tone="heading" className="leading-relaxed">
            {entry.explanation}
          </Text>
        </div>

        {entry.literalMeaning && (
          <div className="rounded-base border border-default bg-surface px-3.5 py-2.5">
            <Text
              variant="caption"
              tone="muted"
              className="font-bold uppercase"
            >
              {t.glossary.literalLabel}
            </Text>
            <Text variant="small" tone="body" className="mt-1 leading-relaxed">
              {entry.literalMeaning}
            </Text>
          </div>
        )}
      </div>

      {hasDetails && (
        <>
          <Divider />

          <div className="flex items-center justify-between gap-2">
            <Text
              variant="caption"
              tone="muted"
              className="font-mono uppercase"
            >
              {t.glossary.breakdownLabel} · {entry.wordBreakdown.length} ·{" "}
              {t.glossary.alternativesLabel} · {entry.otherWaysToSay.length} ·{" "}
              {t.glossary.otherContextsLabel} · {entry.otherContexts.length}
            </Text>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded
                ? locale === "es"
                  ? "Ocultar detalles"
                  : "Hide details"
                : locale === "es"
                  ? "Ver detalles"
                  : "Show details"}
            </Button>
          </div>

          {expanded && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {entry.wordBreakdown.length > 0 && (
                <section className="flex flex-col gap-2">
                  <Text
                    variant="caption"
                    tone="muted"
                    className="font-bold uppercase"
                  >
                    {t.glossary.breakdownLabel}
                  </Text>
                  <ul className="divide-y divide-default rounded-base border border-default bg-surface">
                    {entry.wordBreakdown.map((item, idx) => (
                      <li
                        key={`${item.token}-${idx}`}
                        className="flex flex-col gap-0.5 px-3 py-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="font-serif text-sm font-bold text-heading">
                            {item.token}
                            {item.lemma &&
                              item.lemma.toLowerCase() !==
                                item.token.toLowerCase() && (
                                <span className="ml-1 font-mono text-xs font-normal text-muted">
                                  ({item.lemma})
                                </span>
                              )}
                          </span>
                          {item.partOfSpeech && (
                            <Badge variant="outline">{item.partOfSpeech}</Badge>
                          )}
                        </div>
                        <Text variant="small" tone="body">
                          {item.literalDefinition}
                        </Text>
                        {item.roleInPhrase && (
                          <Text variant="caption" tone="muted">
                            {item.roleInPhrase}
                          </Text>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {entry.otherWaysToSay.length > 0 && (
                <section className="flex flex-col gap-2">
                  <Text
                    variant="caption"
                    tone="muted"
                    className="font-bold uppercase"
                  >
                    {t.glossary.alternativesLabel}
                  </Text>
                  <ul className="flex flex-col gap-2">
                    {entry.otherWaysToSay.map((alt, idx) => (
                      <li
                        key={`${alt.expression}-${idx}`}
                        className="rounded-base border border-default bg-surface px-3 py-2"
                      >
                        <div className="flex items-start justify-between gap-1.5">
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
                            aria-label={`${t.glossary.pronounceButton}: ${alt.expression}`}
                            onClick={() =>
                              onPronounce(alt.expression, entry.language)
                            }
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

              {entry.otherContexts.length > 0 && (
                <section className="flex flex-col gap-2">
                  <Text
                    variant="caption"
                    tone="muted"
                    className="font-bold uppercase"
                  >
                    {t.glossary.otherContextsLabel}
                  </Text>
                  <div className="flex flex-col gap-2">
                    {entry.otherContexts.map((ctx, idx) => (
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
                          <div className="mt-1 flex items-start justify-between gap-1.5">
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
                              aria-label={`${t.glossary.pronounceButton}: ${ctx.example}`}
                              onClick={() =>
                                onPronounce(ctx.example, entry.language)
                              }
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
