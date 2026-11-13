"use client";

import { useEffect, useRef, useState } from "react";

import { Button, Icon } from "@/components/ui";
import {
  cleanLookupSelection,
  cleanLookupWord,
  type TargetLanguageCode,
} from "@/lib";

export interface ReadingArticleProps {
  paragraphs: readonly string[];
  language: TargetLanguageCode;
  fontScale: 0 | 1 | 2;
  selectedWord: string | null;
  selectionActionLabel: string;
  onSelectWord: (word: string, paragraphContext: string) => void;
}

interface FloatingSelection {
  text: string;
  context: string;
  top: number;
  left: number;
}

const FONT_SCALE_CLASS: Record<0 | 1 | 2, string> = {
  0: "text-base sm:text-lg leading-relaxed",
  1: "text-lg sm:text-xl leading-[1.8]",
  2: "text-xl sm:text-2xl leading-[1.85]",
};

function resolveParagraphContext(
  node: Node | null,
  paragraphs: readonly string[],
): string {
  let current: Node | null = node;
  while (current) {
    if (
      current instanceof HTMLElement &&
      current.tagName.toLowerCase() === "p"
    ) {
      const idxAttr = current.getAttribute("data-paragraph-index");
      const idx = idxAttr !== null ? Number(idxAttr) : -1;
      if (Number.isInteger(idx) && idx >= 0 && paragraphs[idx]) {
        return paragraphs[idx];
      }
      return current.textContent?.trim() ?? "";
    }
    current = current.parentNode;
  }
  return "";
}

/**
 * Cuerpo editorial de la lectura con tipografía serif.
 * Soporta clic directo sobre una palabra y selección libre de frases u oraciones
 * con botón flotante contextual.
 */
export function ReadingArticle({
  paragraphs,
  language,
  fontScale,
  selectedWord,
  selectionActionLabel,
  onSelectWord,
}: ReadingArticleProps) {
  const articleRef = useRef<HTMLElement | null>(null);
  const justDraggedRef = useRef(false);
  const [floatingSelection, setFloatingSelection] =
    useState<FloatingSelection | null>(null);

  const normalizedSelected = selectedWord?.toLowerCase() ?? null;

  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setFloatingSelection(null);
      }
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  const captureRangeSelection = () => {
    const container = articleRef.current;
    const sel = window.getSelection();
    if (!container || !sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setFloatingSelection(null);
      return;
    }

    const range = sel.getRangeAt(0);
    if (
      !container.contains(range.startContainer) ||
      !container.contains(range.endContainer)
    ) {
      setFloatingSelection(null);
      return;
    }

    const rawText = sel.toString();
    const cleaned = cleanLookupSelection(rawText);
    if (!cleaned) {
      setFloatingSelection(null);
      return;
    }

    // Mostrar botón flotante cuando el usuario selecciona múltiples palabras
    // o arrastra conscientemente una selección no colapsada dentro del artículo.
    const isMultiWord = cleaned.includes(" ");
    const isIntentionalHighlight = isMultiWord || rawText.trim().length >= 2;
    if (!isIntentionalHighlight) {
      setFloatingSelection(null);
      return;
    }

    justDraggedRef.current = true;
    window.setTimeout(() => {
      justDraggedRef.current = false;
    }, 250);

    const rect = range.getBoundingClientRect();
    const articleRect = container.getBoundingClientRect();
    const centerX = rect.left - articleRect.left + rect.width / 2;
    const clampedLeft = Math.max(
      96,
      Math.min(centerX, Math.max(96, articleRect.width - 96)),
    );
    const preferredTop = rect.top - articleRect.top - 48;
    const safeTop =
      preferredTop >= 0 ? preferredTop : rect.bottom - articleRect.top + 10;

    setFloatingSelection({
      text: cleaned,
      context: resolveParagraphContext(range.startContainer, paragraphs),
      top: safeTop,
      left: clampedLeft,
    });
  };

  const handleConfirmFloatingSelection = () => {
    if (!floatingSelection) return;
    const { text, context } = floatingSelection;
    setFloatingSelection(null);
    window.getSelection()?.removeAllRanges();
    onSelectWord(text, context);
  };

  return (
    <article
      ref={articleRef}
      lang={language}
      onMouseUp={captureRangeSelection}
      onTouchEnd={captureRangeSelection}
      className={`relative flex flex-col gap-6 font-serif text-heading ${FONT_SCALE_CLASS[fontScale]}`}
    >
      {floatingSelection && (
        <div
          style={{ top: floatingSelection.top, left: floatingSelection.left }}
          className="absolute z-20 -translate-x-1/2"
          onMouseDown={(event) => event.preventDefault()}
        >
          <Button
            variant="primary"
            size="xs"
            leftIcon={<Icon name="sparkles" size="xs" />}
            className="whitespace-nowrap shadow-lg"
            onClick={handleConfirmFloatingSelection}
          >
            {selectionActionLabel}
          </Button>
        </div>
      )}

      {paragraphs.map((paragraph, pIndex) => {
        const tokens = paragraph.split(/(\s+)/);

        return (
          <p key={pIndex} data-paragraph-index={pIndex}>
            {tokens.map((token, tIndex) => {
              if (/^\s+$/.test(token)) {
                return <span key={tIndex}>{token}</span>;
              }

              const cleaned = cleanLookupWord(token);
              if (!cleaned) {
                return <span key={tIndex}>{token}</span>;
              }

              const isSelected =
                normalizedSelected !== null &&
                !normalizedSelected.includes(" ") &&
                cleaned.toLowerCase() === normalizedSelected;

              return (
                <span
                  key={tIndex}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (justDraggedRef.current) return;
                    const sel = window.getSelection();
                    if (
                      sel &&
                      !sel.isCollapsed &&
                      cleanLookupSelection(sel.toString()).includes(" ")
                    ) {
                      return;
                    }
                    setFloatingSelection(null);
                    onSelectWord(cleaned, paragraph);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setFloatingSelection(null);
                      onSelectWord(cleaned, paragraph);
                    }
                  }}
                  className={[
                    "cursor-pointer rounded-xs px-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                    isSelected
                      ? "bg-brand text-white underline decoration-white/70 underline-offset-4"
                      : "hover:bg-neutral-secondary-medium hover:underline hover:decoration-brand/40 hover:underline-offset-4",
                  ].join(" ")}
                >
                  {token}
                </span>
              );
            })}
          </p>
        );
      })}
    </article>
  );
}
