"use client";

import { useEffect, useMemo, useState } from "react";

import { ContextTranslationPopover } from "@/app/readings/[id]/_components/context-translation-popover";
import { type ReadingDrawerTab } from "@/app/readings/[id]/_hooks/use-reading-detail";
import {
  ActionLink,
  Badge,
  EmptyState,
  Icon,
  IconButton,
  Text,
} from "@/components/ui";
import { type ReadingFlowDictionary } from "@/i18n";
import {
  type ExplanationResultDto,
  type GlossaryEntryDto,
  type TargetLanguageCode,
} from "@/lib";

export interface ReadingGlossaryDrawerProps {
  isOpen: boolean;
  activeTab: ReadingDrawerTab;
  onTabChange: (tab: ReadingDrawerTab) => void;
  t: ReadingFlowDictionary;
  displayLanguage: TargetLanguageCode;
  selectedWord: string | null;
  contextSentence: string | null;
  explanationData: ExplanationResultDto | null;
  deepExplanation: string | null;
  isLoadingExplanation: boolean;
  isSavingGlossary: boolean;
  isDeepLoading: boolean;
  errorMessage: string | null;
  consultedEntries: readonly GlossaryEntryDto[];
  onPronounce: (text: string) => void;
  onRefresh: () => void;
  onRequestDeepExplanation: () => void;
  onToggleSaveCurrent: () => void;
  onToggleSaveEntry: (entry: GlossaryEntryDto) => void;
  onOpenCachedEntry: (entry: GlossaryEntryDto) => void;
  onClose: () => void;
}

/**
 * Sidebar superpuesto desde el lado derecho para la explicación IA activa y el
 * glosario consultado de la lectura sin desplazar ni reacomodar el texto principal.
 * Funciona de forma uniforme en móvil, tablet y escritorio.
 */
export function ReadingGlossaryDrawer({
  isOpen,
  activeTab,
  onTabChange,
  t,
  displayLanguage,
  selectedWord,
  contextSentence,
  explanationData,
  deepExplanation,
  isLoadingExplanation,
  isSavingGlossary,
  isDeepLoading,
  errorMessage,
  consultedEntries,
  onPronounce,
  onRefresh,
  onRequestDeepExplanation,
  onToggleSaveCurrent,
  onToggleSaveEntry,
  onOpenCachedEntry,
  onClose,
}: ReadingGlossaryDrawerProps) {
  const [savedOnly, setSavedOnly] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const savedCount = useMemo(
    () => consultedEntries.filter((entry) => entry.isSaved).length,
    [consultedEntries],
  );

  const visibleEntries = useMemo(
    () =>
      savedOnly
        ? consultedEntries.filter((entry) => entry.isSaved)
        : consultedEntries,
    [consultedEntries, savedOnly],
  );

  if (!isOpen) {
    return null;
  }

  const showExplanationTab = Boolean(selectedWord) && activeTab === "explanation";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-brand/40 backdrop-blur-[1px]"
      />

      <aside
        role="complementary"
        aria-label={t.readings.aiContextTitle}
        data-testid="reading-glossary-drawer"
        className="relative z-10 flex h-dvh w-full max-w-[92vw] flex-col border-l border-default bg-surface shadow-xl sm:w-[28rem] sm:max-w-[90vw] lg:w-[32rem]"
      >
        {/* Cabecera fija del drawer derecho */}
        <div className="flex shrink-0 flex-col gap-3 border-b border-default bg-neutral-primary-soft px-4 py-3.5 sm:px-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Icon
                name="bookmark"
                size="sm"
                className="shrink-0 text-heading"
              />
              <span className="truncate font-serif text-base font-bold text-heading sm:text-lg">
                {t.readings.glossaryDrawerTitle}
              </span>
            </div>

            <IconButton
              icon="close"
              size="sm"
              variant="ghost"
              aria-label={t.readings.closeHelpLabel}
              onClick={onClose}
            />
          </div>

          <div
            role="tablist"
            aria-label={t.readings.glossaryDrawerTitle}
            className="grid grid-cols-2 gap-1.5 rounded-base border border-default bg-surface p-1"
          >
            {selectedWord && (
              <button
                type="button"
                role="tab"
                aria-selected={showExplanationTab}
                onClick={() => onTabChange("explanation")}
                className={`flex items-center justify-center gap-1.5 rounded-xs px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  showExplanationTab
                    ? "bg-brand text-ink-contrast"
                    : "text-muted hover:text-heading"
                }`}
              >
                <Icon name="sparkles" size="xs" />
                <span className="truncate">
                  {t.readings.drawerExplanationTab}
                </span>
              </button>
            )}

            <button
              type="button"
              role="tab"
              aria-selected={!showExplanationTab}
              onClick={() => onTabChange("glossary")}
              className={`flex items-center justify-center gap-1.5 rounded-xs px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                selectedWord ? "" : "col-span-2"
              } ${
                !showExplanationTab
                  ? "bg-brand text-ink-contrast"
                  : "text-muted hover:text-heading"
              }`}
            >
              <Icon name="book-open" size="xs" />
              <span className="truncate">
                {t.readings.drawerGlossaryTab} ({consultedEntries.length})
              </span>
            </button>
          </div>
        </div>

        {/* Contenido desplazable */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          {showExplanationTab && selectedWord ? (
            <ContextTranslationPopover
              embedded
              t={t}
              displayLanguage={displayLanguage}
              word={selectedWord}
              contextSentence={contextSentence}
              explanationData={explanationData}
              deepExplanation={deepExplanation}
              isLoading={isLoadingExplanation}
              isSavingGlossary={isSavingGlossary}
              isDeepLoading={isDeepLoading}
              errorMessage={errorMessage}
              onPronounce={onPronounce}
              onRefresh={onRefresh}
              onRequestDeepExplanation={onRequestDeepExplanation}
              onToggleSave={onToggleSaveCurrent}
              onClose={onClose}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {consultedEntries.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSavedOnly(false)}
                    className={`rounded-base border px-2.5 py-1 text-xs font-semibold transition-colors ${
                      !savedOnly
                        ? "border-brand bg-brand text-ink-contrast"
                        : "border-default bg-surface text-muted hover:text-heading"
                    }`}
                  >
                    {t.readings.drawerAllFilterLabel} ({consultedEntries.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSavedOnly(true)}
                    className={`rounded-base border px-2.5 py-1 text-xs font-semibold transition-colors ${
                      savedOnly
                        ? "border-brand bg-brand text-ink-contrast"
                        : "border-default bg-surface text-muted hover:text-heading"
                    }`}
                  >
                    {t.readings.drawerSavedFilterLabel} ({savedCount})
                  </button>
                </div>
              )}

              {visibleEntries.length === 0 ? (
                <EmptyState
                  icon="bookmark"
                  title={t.readings.drawerEmptyTitle}
                  description={
                    savedOnly && consultedEntries.length > 0
                      ? t.readings.drawerEmptySavedDescription
                      : t.readings.drawerEmptyDescription
                  }
                />
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {visibleEntries.map((entry) => {
                    const isSelected =
                      selectedWord?.trim().toLowerCase() ===
                      entry.normalizedWord;
                    const isPhrase = entry.entryType === "phrase";

                    return (
                      <li
                        key={`drawer-entry-${entry.id}`}
                        className={`rounded-base border bg-surface p-3 transition-colors ${
                          isSelected
                            ? "border-brand bg-neutral-primary-soft"
                            : "border-default hover:border-strong"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenCachedEntry(entry)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-serif text-base font-bold text-heading">
                                {entry.word}
                              </span>
                              <Badge variant="outline">
                                {isPhrase
                                  ? t.readings.entryTypePhrase
                                  : t.readings.entryTypeWord}
                              </Badge>
                              {entry.isSaved && (
                                <Badge variant="primary">
                                  {t.glossary.savedBadge}
                                </Badge>
                              )}
                            </div>

                            {entry.explanation && (
                              <Text
                                variant="small"
                                tone="muted"
                                className="mt-1.5 line-clamp-2 leading-snug"
                              >
                                {entry.explanation}
                              </Text>
                            )}
                          </button>

                          <div className="flex shrink-0 items-center gap-1">
                            <IconButton
                              icon="volume-2"
                              size="xs"
                              variant="ghost"
                              aria-label={`${t.readings.pronounceButton}: ${entry.word}`}
                              onClick={() => onPronounce(entry.word)}
                            />
                            <IconButton
                              icon={entry.isSaved ? "check" : "bookmark"}
                              size="xs"
                              variant={entry.isSaved ? "secondary" : "ghost"}
                              disabled={isSavingGlossary}
                              aria-label={
                                entry.isSaved
                                  ? t.readings.savedTermButton
                                  : t.readings.saveTermButton
                              }
                              onClick={() => onToggleSaveEntry(entry)}
                            />
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Pie fijo con acceso al glosario completo */}
        <div className="shrink-0 border-t border-default bg-neutral-primary-soft px-4 py-3 sm:px-5">
          <ActionLink
            href="/glossary"
            variant="secondary"
            size="sm"
            fullWidth
            leftIcon={<Icon name="bookmark" size="xs" />}
            rightIcon={<Icon name="arrow-right" size="xs" />}
          >
            {t.readings.drawerOpenFullGlossary}
          </ActionLink>
        </div>
      </aside>
    </div>
  );
}
