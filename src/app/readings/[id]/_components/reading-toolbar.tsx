"use client";

import {
  Badge,
  Button,
  Divider,
  Icon,
  IconButton,
  PageHeader,
} from "@/components/ui";
import { type ReadingFlowDictionary } from "@/i18n";
import {
  estimateReadingMinutes,
  formatReadingLanguageBadge,
  getDifficultyMeta,
  type ReadingDto,
  type TargetLanguageCode,
} from "@/lib";

export interface ReadingToolbarProps {
  t: ReadingFlowDictionary;
  displayLanguage: TargetLanguageCode;
  reading: ReadingDto;
  fontScale: 0 | 1 | 2;
  onDecreaseFont: () => void;
  onIncreaseFont: () => void;
  onPronounceTitle: () => void;
}

/**
 * Cabecera editorial y controles tipográficos (`A-` / `A+` y audio) para el detalle
 * de lectura (`/readings/[id]` - Figma #06).
 */
export function ReadingToolbar({
  t,
  displayLanguage,
  reading,
  fontScale,
  onDecreaseFont,
  onIncreaseFont,
  onPronounceTitle,
}: ReadingToolbarProps) {
  const diffMeta = getDifficultyMeta(reading.difficulty, displayLanguage);
  const estMinutes = estimateReadingMinutes(reading.wordCount, reading.content);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        backHref="/readings"
        backLabel={t.readings.backToReadings}
        titleVariant="title"
        title={reading.title}
        subtitle={reading.description}
        badges={
          <>
            <Badge variant="primary">
              {formatReadingLanguageBadge(reading.language, displayLanguage)}
            </Badge>
            <Badge variant="outline">{diffMeta.label}</Badge>
            {reading.category && (
              <Badge variant="secondary">{reading.category.toUpperCase()}</Badge>
            )}
            <Badge variant="secondary">
              {estMinutes} {t.readings.estimatedReadUnit}
            </Badge>
          </>
        }
        actions={
          <div className="flex items-center gap-1.5 rounded-base border border-default-medium bg-neutral-primary-soft p-1">
            <Button
              variant="ghost"
              size="xs"
              disabled={fontScale <= 0}
              onClick={onDecreaseFont}
              aria-label={t.readings.decreaseFontLabel}
            >
              A-
            </Button>
            <Button
              variant="ghost"
              size="xs"
              disabled={fontScale >= 2}
              onClick={onIncreaseFont}
              aria-label={t.readings.increaseFontLabel}
            >
              A+
            </Button>
            <IconButton
              icon="volume-2"
              size="xs"
              variant="ghost"
              aria-label={t.readings.pronounceButton}
              onClick={onPronounceTitle}
            />
          </div>
        }
      />

      <div className="flex items-center gap-2 text-xs text-muted">
        <Icon name="info" size="xs" />
        <span>{t.readings.clickWordHint}</span>
      </div>

      <Divider />
    </div>
  );
}
