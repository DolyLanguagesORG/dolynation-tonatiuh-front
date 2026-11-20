"use client";

import { ReadingArticle } from "@/app/readings/[id]/_components/reading-article";
import { ReadingCompletionFooter } from "@/app/readings/[id]/_components/reading-completion-footer";
import { ReadingGlossaryDrawer } from "@/app/readings/[id]/_components/reading-glossary-drawer";
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
 * El glosario y la ayuda contextual IA viven en un drawer lateral derecho superpuesto
 * para no alterar ni desplazar la maquetación de la lectura en móvil, tablet ni escritorio.
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
              consultedCount={detail.consultedEntries.length}
              onDecreaseFont={detail.decreaseFontScale}
              onIncreaseFont={detail.increaseFontScale}
              onPronounceTitle={() =>
                detail.pronounceText(detail.reading?.title ?? "")
              }
              onOpenGlossary={() => detail.openGlossaryDrawer()}
            />

            <div className="w-full">
              <ReadingArticle
                paragraphs={detail.paragraphs}
                language={detail.reading.language}
                fontScale={detail.fontScale}
                selectedWord={detail.selectedWord}
                selectionActionLabel={
                  detail.flowT.readings.selectionActionLabel
                }
                clearSelectionLabel={detail.flowT.readings.clearSelectionLabel}
                selectionTooLongNotice={
                  detail.flowT.readings.selectionTooLongNotice
                }
                selectionCrossParagraphNotice={
                  detail.flowT.readings.selectionCrossParagraphNotice
                }
                onSelectWord={(word, ctx) => void detail.selectWord(word, ctx)}
              />
            </div>

            <ReadingCompletionFooter
              t={detail.flowT}
              reading={detail.reading}
            />

            <ReadingGlossaryDrawer
              isOpen={detail.isDrawerOpen}
              activeTab={detail.drawerTab}
              onTabChange={detail.setDrawerTab}
              t={detail.flowT}
              displayLanguage={detail.readingLanguage}
              selectedWord={detail.selectedWord}
              contextSentence={detail.selectedContext}
              explanationData={detail.activeExplanation}
              deepExplanation={detail.deepExplanation}
              isLoadingExplanation={detail.isExplaining}
              isSavingGlossary={detail.isSavingGlossary}
              isDeepLoading={detail.isDeepExplaining}
              errorMessage={detail.explainError}
              consultedEntries={detail.consultedEntries}
              onPronounce={(textToSpeak) => detail.pronounceText(textToSpeak)}
              onRefresh={detail.refreshSelection}
              onRequestDeepExplanation={() =>
                void detail.requestDetailedExplanation()
              }
              onToggleSaveCurrent={() => void detail.toggleSaveCurrent()}
              onToggleSaveEntry={(entry) => void detail.toggleSaveEntry(entry)}
              onOpenCachedEntry={detail.openCachedEntry}
              onClose={detail.closeDrawer}
            />
          </div>
        )}
      </Container>
    </RequireAuth>
  );
}
