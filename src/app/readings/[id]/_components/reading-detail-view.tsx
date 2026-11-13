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
import { useLocale } from "@/i18n";

export interface ReadingDetailViewProps {
  readingId: string;
}

/**
 * Vista interactiva de lectura enfocada y consulta léxica IA (`/readings/[id]` - Figma #06).
 */
export function ReadingDetailView({ readingId }: ReadingDetailViewProps) {
  const { locale, t } = useLocale();
  const detail = useReadingDetail(readingId);

  return (
    <RequireAuth>
      <Container size="lg" className="flex flex-col gap-6">
        {!detail.isValidId ? (
          <EmptyState
            icon="alert-triangle"
            title={
              locale === "es"
                ? "Identificador de lectura inválido"
                : "Invalid reading identifier"
            }
            description={
              locale === "es"
                ? "Verifica el enlace o selecciona una lectura válida desde tu historial."
                : "Check the link or choose a valid reading from your history."
            }
            actions={
              <ActionLink href="/readings" variant="primary" size="md">
                {t.readings.backToReadings}
              </ActionLink>
            }
          />
        ) : detail.isLoading ? (
          <SkeletonCard
            lines={6}
            label={
              locale === "es" ? "Cargando texto de lectura" : "Loading reading text"
            }
          />
        ) : detail.errorMessage || !detail.reading ? (
          <Alert
            variant="error"
            title={
              locale === "es"
                ? "Error al cargar lectura"
                : "Failed to load reading"
            }
          >
            {detail.errorMessage ??
              (locale === "es"
                ? "No se encontró la lectura solicitada."
                : "Requested reading was not found.")}
          </Alert>
        ) : (
          <>
            <ReadingToolbar
              t={t}
              locale={locale}
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
                  detail.selectedWord ? "lg:col-span-8" : "lg:col-span-12"
                }
              >
                <ReadingArticle
                  paragraphs={detail.paragraphs}
                  language={detail.reading.language}
                  fontScale={detail.fontScale}
                  selectedWord={detail.selectedWord}
                  onSelectWord={detail.selectWord}
                />
              </div>

              {detail.selectedWord && (
                <div className="lg:sticky lg:top-6 lg:col-span-4">
                  <ContextTranslationPopover
                    t={t}
                    locale={locale}
                    word={detail.selectedWord}
                    contextSentence={detail.selectedContext}
                    explanation={detail.aiExplanation}
                    deepExplanation={detail.deepExplanation}
                    isLoading={detail.isExplaining}
                    isDeepLoading={detail.isDeepExplaining}
                    errorMessage={detail.explainError}
                    isSaved={detail.savedTerms.some(
                      (term) =>
                        term.toLowerCase() ===
                        detail.selectedWord?.toLowerCase(),
                    )}
                    onPronounce={() =>
                      detail.pronounceText(detail.selectedWord ?? "")
                    }
                    onRequestDeepExplanation={detail.requestDetailedExplanation}
                    onToggleSave={() =>
                      detail.toggleSaveTerm(detail.selectedWord ?? "")
                    }
                    onClose={detail.clearSelection}
                  />
                </div>
              )}
            </div>

            <ReadingCompletionFooter
              t={t}
              reading={detail.reading}
              vocabularyTerms={detail.vocabularyTerms}
              savedTerms={detail.savedTerms}
              selectedWord={detail.selectedWord}
              onSelectTerm={(term) => detail.selectWord(term)}
            />
          </>
        )}
      </Container>
    </RequireAuth>
  );
}
