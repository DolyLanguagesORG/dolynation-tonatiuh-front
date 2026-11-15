"use client";

import { ContextTranslationPopover } from "@/app/readings/[id]/_components/context-translation-popover";
import { ReadingArticle } from "@/app/readings/[id]/_components/reading-article";
import { ReadingCompletionFooter } from "@/app/readings/[id]/_components/reading-completion-footer";
import { ReadingToolbar } from "@/app/readings/[id]/_components/reading-toolbar";
import { useReadingDetail } from "@/app/readings/[id]/_hooks/use-reading-detail";
import { RequireAuth } from "@/components/auth";
import {
  ActionLink,
  Alert,
  Container,
  EmptyState,
  SkeletonCard,
} from "@/components/ui";
import { useImmersionDocumentLanguage } from "@/i18n";

export interface ReadingDetailViewProps {
  readingId: string;
}

/**
 * Vista interactiva de lectura enfocada y consulta léxica IA (`/readings/[id]` - Figma #06).
 */
export function ReadingDetailView({ readingId }: ReadingDetailViewProps) {
  const detail = useReadingDetail(readingId);

  useImmersionDocumentLanguage(detail.reading?.language);

  return (
    <RequireAuth>
      <Container size="lg" className="flex flex-col gap-6">
        {!detail.isValidId ? (
          <EmptyState
            icon="alert-triangle"
            title={detail.flowT.readings.invalidIdTitle}
            description={detail.flowT.readings.invalidIdDescription}
            actions={
              <ActionLink href="/readings" variant="primary" size="md">
                {detail.flowT.readings.backToReadings}
              </ActionLink>
            }
          />
        ) : detail.isLoading ? (
          <SkeletonCard
            lines={6}
            label={detail.flowT.readings.loadingReadingText}
          />
        ) : detail.errorMessage || !detail.reading ? (
          <Alert
            variant="error"
            title={detail.flowT.readings.loadErrorTitle}
          >
            {detail.errorMessage ?? detail.flowT.readings.notFoundFallback}
          </Alert>
        ) : (
          <div lang={detail.readingLanguage} className="flex flex-col gap-6">
            <ReadingToolbar
              t={detail.flowT}
              displayLanguage={detail.readingLanguage}
              reading={detail.reading}
              fontScale={detail.fontScale}
              onDecreaseFont={detail.decreaseFontScale}
              onIncreaseFont={detail.increaseFontScale}
              onPronounceTitle={() =>
                detail.pronounceText(detail.reading?.title ?? "")
              }
            />

            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
              <div
                className={
                  detail.selectedWord ? "lg:col-span-7" : "lg:col-span-12"
                }
              >
                <ReadingArticle
                  paragraphs={detail.paragraphs}
                  language={detail.reading.language}
                  fontScale={detail.fontScale}
                  selectedWord={detail.selectedWord}
                  selectionActionLabel={
                    detail.flowT.readings.selectionActionLabel
                  }
                  clearSelectionLabel={
                    detail.flowT.readings.clearSelectionLabel
                  }
                  selectionTooLongNotice={
                    detail.flowT.readings.selectionTooLongNotice
                  }
                  selectionCrossParagraphNotice={
                    detail.flowT.readings.selectionCrossParagraphNotice
                  }
                  onSelectWord={(word, ctx) => void detail.selectWord(word, ctx)}
                />
              </div>

              {detail.selectedWord && (
                <div className="lg:sticky lg:top-6 lg:col-span-5">
                  <ContextTranslationPopover
                    t={detail.flowT}
                    displayLanguage={detail.readingLanguage}
                    word={detail.selectedWord}
                    contextSentence={detail.selectedContext}
                    explanationData={detail.activeExplanation}
                    deepExplanation={detail.deepExplanation}
                    isLoading={detail.isExplaining}
                    isSavingGlossary={detail.isSavingGlossary}
                    isDeepLoading={detail.isDeepExplaining}
                    errorMessage={detail.explainError}
                    onPronounce={(textToSpeak) =>
                      detail.pronounceText(textToSpeak)
                    }
                    onRefresh={detail.refreshSelection}
                    onRequestDeepExplanation={() =>
                      void detail.requestDetailedExplanation()
                    }
                    onToggleSave={() => void detail.toggleSaveCurrent()}
                    onClose={detail.clearSelection}
                  />
                </div>
              )}
            </div>

            <ReadingCompletionFooter
              t={detail.flowT}
              reading={detail.reading}
              vocabularyTerms={detail.vocabularyTerms}
              consultedEntries={detail.consultedEntries}
              selectedWord={detail.selectedWord}
              onSelectTerm={(term) => void detail.selectWord(term)}
              onOpenCachedEntry={detail.openCachedEntry}
            />
          </div>
        )}
      </Container>
    </RequireAuth>
  );
}
