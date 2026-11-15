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
import {
  getReadingFlowDictionary,
  type Locale,
  resolveReadingLanguage,
} from "@/i18n";
import {
  formatReadingDate,
  formatReadingLanguageBadge,
  getDifficultyMeta,
  type GlossaryEntryDto,
  type TargetLanguageCode,
} from "@/lib";

export interface GlossaryEntryCardProps {
  locale: Locale;
  entry: GlossaryEntryDto;
  isToggling: boolean;
  onToggleSave: (entry: GlossaryEntryDto) => void;
  onPronounce: (text: string, language: TargetLanguageCode) => void;
}

/**
 * Tarjeta editorial inmersiva de una entrada del glosario: toda su estructura fija
 * (encabezado, acciones, lectura de origen, aviso de lectura eliminada y desglose)
 * se presenta en el idioma meta en el que fue consultada la entrada.
 */
export function GlossaryEntryCard({
  locale,
  entry,
  isToggling,
  onToggleSave,
  onPronounce,
}: GlossaryEntryCardProps) {
  const cardLanguage = resolveReadingLanguage(entry.language, locale);
  const g = getReadingFlowDictionary(cardLanguage).glossary;
  const difficultyLabel = getDifficultyMeta(
    entry.difficulty,
    cardLanguage,
  ).label;
  const isReadingAvailable = entry.readingAvailable !== false;

  const hasDetails =
    entry.wordBreakdown.length > 0 ||
    entry.otherWaysToSay.length > 0 ||
    entry.otherContexts.length > 0;
  const [expanded, setExpanded] = useState(true);

  return (
    <Card
      as="article"
      lang={cardLanguage}
      padding="lg"
      className="flex flex-col gap-4 border-default-medium"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline">
              {entry.entryType === "phrase"
                ? g.entryTypePhrase
                : g.entryTypeWord}
            </Badge>
            <Badge variant="secondary">
              {formatReadingLanguageBadge(cardLanguage, cardLanguage)} ·{" "}
              {difficultyLabel}
            </Badge>
            {entry.isSaved && <Badge variant="primary">{g.savedBadge}</Badge>}
            <Text variant="caption" tone="muted" className="font-mono">
              {formatReadingDate(entry.createdAt, cardLanguage)}
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
              aria-label={`${g.pronounceButton}: ${entry.word}`}
              onClick={() => onPronounce(entry.word, cardLanguage)}
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
            {entry.isSaved ? g.removeFromGlossaryButton : g.addToGlossaryButton}
          </Button>

          {isReadingAvailable ? (
            <ActionLink
              href={`/readings/${entry.readingId}`}
              variant="secondary"
              size="xs"
              rightIcon={<Icon name="arrow-right" size="xs" />}
            >
              {g.openReadingButton}
            </ActionLink>
          ) : (
            <Badge
              variant="outline"
              className="inline-flex items-center gap-1 font-mono uppercase"
            >
              <Icon name="archive" size="xs" />
              <span>{g.readingUnavailableBadge}</span>
            </Badge>
          )}
        </div>
      </div>

      {(entry.context || entry.readingTitle || !isReadingAvailable) && (
        <div className="rounded-base border border-default bg-neutral-secondary-soft px-3.5 py-2">
          {entry.readingTitle && (
            <Text variant="caption" tone="muted" className="font-mono uppercase">
              {g.sourceReadingLabel} {entry.readingTitle}
            </Text>
          )}
          {entry.context && (
            <Text variant="small" tone="body" className="mt-1 italic">
              “{entry.context}”
            </Text>
          )}
          {!isReadingAvailable && (
            <Text
              variant="caption"
              tone="muted"
              className="mt-1.5 flex items-center gap-1.5"
            >
              <Icon name="info" size="xs" />
              <span>{g.readingUnavailableNotice}</span>
            </Text>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Text variant="caption" tone="muted" className="font-bold uppercase">
            {g.readingContextLabel}
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
              {g.literalLabel}
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

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Text
              variant="caption"
              tone="muted"
              className="font-mono uppercase"
            >
              {g.breakdownLabel} · {entry.wordBreakdown.length} ·{" "}
              {g.alternativesLabel} · {entry.otherWaysToSay.length} ·{" "}
              {g.otherContextsLabel} · {entry.otherContexts.length}
            </Text>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? g.hideDetailsButton : g.showDetailsButton}
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
                    {g.breakdownLabel}
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
                            {g.roleLabel} {item.roleInPhrase}
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
                    {g.alternativesLabel}
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
                            aria-label={`${g.pronounceButton}: ${alt.expression}`}
                            onClick={() =>
                              onPronounce(alt.expression, cardLanguage)
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
                    {g.otherContextsLabel}
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
                              aria-label={`${g.pronounceButton}: ${ctx.example}`}
                              onClick={() =>
                                onPronounce(ctx.example, cardLanguage)
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
