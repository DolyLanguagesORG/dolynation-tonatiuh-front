"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button, Icon, IconButton } from "@/components/ui";
import {
  cleanLookupSelection,
  cleanLookupWord,
  computeNextTokenSpan,
  findTokenSpanInParagraphs,
  MAX_LOOKUP_SELECTION_CHARS,
  type ParagraphTokenSpan,
  resolveSpanSelectionText,
  type TargetLanguageCode,
  tokenizeReadingParagraph,
} from "@/lib";

export interface ReadingArticleProps {
  paragraphs: readonly string[];
  language: TargetLanguageCode;
  fontScale: 0 | 1 | 2;
  selectedWord: string | null;
  selectionActionLabel: string;
  clearSelectionLabel: string;
  selectionTooLongNotice: string;
  selectionCrossParagraphNotice: string;
  onSelectWord: (word: string, paragraphContext: string) => void;
}

interface FloatingPosition {
  top: number;
  left: number;
}

interface ConfirmedSpanState {
  span: ParagraphTokenSpan;
  normalizedText: string;
}

const FONT_SCALE_CLASS: Record<0 | 1 | 2, string> = {
  0: "text-base sm:text-lg leading-relaxed",
  1: "text-lg sm:text-xl leading-[1.8]",
  2: "text-xl sm:text-2xl leading-[1.85]",
};

const FLOATING_BAR_HALF_WIDTH = 120;
const MIN_DRAG_DISTANCE_PX = 6;

function normalizeForComparison(text: string): string {
  return cleanLookupSelection(text).replace(/\s+/g, " ").toLowerCase();
}

function isClickableToken(token: string): boolean {
  return !/^\s+$/.test(token) && Boolean(cleanLookupWord(token));
}

function resolveParagraphElement(
  node: Node | null,
): HTMLParagraphElement | null {
  let current: Node | null = node;
  while (current) {
    if (
      current instanceof HTMLElement &&
      current.tagName.toLowerCase() === "p" &&
      current.hasAttribute("data-paragraph-index")
    ) {
      return current as HTMLParagraphElement;
    }
    current = current.parentNode;
  }
  return null;
}

function resolveBoundaryParagraph(
  articleEl: HTMLElement,
  container: Node,
  offset: number,
  isEnd: boolean,
): HTMLParagraphElement | null {
  const direct = resolveParagraphElement(container);
  if (direct) return direct;
  if (container !== articleEl) return null;

  const children = articleEl.childNodes;
  if (children.length === 0) return null;

  const startIndex = isEnd
    ? Math.min(children.length - 1, Math.max(0, offset - 1))
    : Math.min(children.length - 1, Math.max(0, offset));
  const step = isEnd ? -1 : 1;

  for (let i = startIndex; i >= 0 && i < children.length; i += step) {
    const candidate = resolveParagraphElement(children[i]);
    if (candidate) return candidate;
  }
  return null;
}

function getParagraphIndex(paragraphEl: HTMLParagraphElement | null): number | null {
  if (!paragraphEl) return null;
  const raw = paragraphEl.getAttribute("data-paragraph-index");
  if (raw === null) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function isAtStartOfParagraph(
  container: Node,
  offset: number,
  paragraphEl: HTMLParagraphElement,
): boolean {
  if (offset !== 0) return false;
  let current: Node | null = container;
  while (current && current !== paragraphEl) {
    if (current.previousSibling) {
      return false;
    }
    current = current.parentNode;
  }
  return current === paragraphEl;
}

function resolveTokenSpanAncestor(
  node: Node | null,
  paragraphEl: HTMLParagraphElement,
): HTMLElement | null {
  let current: Node | null = node;
  while (current && current !== paragraphEl) {
    if (
      current instanceof HTMLElement &&
      current.hasAttribute("data-token-index")
    ) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}

function resolveBoundaryTokenIndex(
  paragraphEl: HTMLParagraphElement,
  container: Node,
  offset: number,
  boundary: "start" | "end",
  tokenCount: number,
): number {
  const tokenEl = resolveTokenSpanAncestor(container, paragraphEl);
  if (tokenEl) {
    const idx = Number(tokenEl.getAttribute("data-token-index"));
    if (Number.isInteger(idx)) {
      if (
        boundary === "start" &&
        container.nodeType === Node.TEXT_NODE &&
        offset >= (container.textContent?.length ?? 0)
      ) {
        return idx + 1;
      }
      if (
        boundary === "end" &&
        container.nodeType === Node.TEXT_NODE &&
        offset === 0
      ) {
        return idx - 1;
      }
      return idx;
    }
  }

  if (container === paragraphEl) {
    return boundary === "start"
      ? Math.min(tokenCount - 1, Math.max(0, offset))
      : Math.max(0, offset - 1);
  }

  return boundary === "start" ? 0 : tokenCount - 1;
}

type DomRangeResolution =
  | { kind: "none" }
  | { kind: "cross-paragraph"; rect: DOMRect }
  | { kind: "span"; span: ParagraphTokenSpan };

function resolveDomRangeToSpan(
  articleEl: HTMLElement,
  range: Range,
  paragraphs: readonly string[],
): DomRangeResolution {
  const startPEl = resolveBoundaryParagraph(
    articleEl,
    range.startContainer,
    range.startOffset,
    false,
  );
  const endPEl = resolveBoundaryParagraph(
    articleEl,
    range.endContainer,
    range.endOffset,
    true,
  );

  const startP = getParagraphIndex(startPEl);
  const endP = getParagraphIndex(endPEl);

  if (startPEl === null || endPEl === null || startP === null || endP === null) {
    return { kind: "none" };
  }

  let effectiveEndAtParagraphEnd = false;
  if (
    endP === startP + 1 &&
    isAtStartOfParagraph(range.endContainer, range.endOffset, endPEl)
  ) {
    effectiveEndAtParagraphEnd = true;
  } else if (startP !== endP) {
    const fallbackRect =
      typeof range.getBoundingClientRect === "function"
        ? range.getBoundingClientRect()
        : startPEl.getBoundingClientRect();
    return { kind: "cross-paragraph", rect: fallbackRect };
  }

  const paragraph = paragraphs[startP];
  if (!paragraph) return { kind: "none" };
  const tokens = tokenizeReadingParagraph(paragraph);

  const rawStart = resolveBoundaryTokenIndex(
    startPEl,
    range.startContainer,
    range.startOffset,
    "start",
    tokens.length,
  );
  const rawEnd = effectiveEndAtParagraphEnd
    ? tokens.length - 1
    : resolveBoundaryTokenIndex(
        startPEl,
        range.endContainer,
        range.endOffset,
        "end",
        tokens.length,
      );

  let startTokenIndex = Math.max(0, rawStart);
  while (startTokenIndex < tokens.length && !isClickableToken(tokens[startTokenIndex])) {
    startTokenIndex += 1;
  }

  let endTokenIndex = Math.min(tokens.length - 1, rawEnd);
  while (endTokenIndex >= 0 && !isClickableToken(tokens[endTokenIndex])) {
    endTokenIndex -= 1;
  }

  if (startTokenIndex > endTokenIndex) {
    return { kind: "none" };
  }

  return {
    kind: "span",
    span: {
      paragraphIndex: startP,
      startTokenIndex,
      endTokenIndex,
    },
  };
}

function computeFloatingPositionFromRect(
  articleEl: HTMLElement,
  targetRect: DOMRect,
  singleLine: boolean,
  startRect?: DOMRect,
  endRect?: DOMRect,
): FloatingPosition {
  const articleRect = articleEl.getBoundingClientRect();
  const centerX =
    singleLine && startRect && endRect
      ? (startRect.left + endRect.right) / 2 - articleRect.left
      : targetRect.left - articleRect.left + targetRect.width / 2;

  const clampedLeft = Math.max(
    FLOATING_BAR_HALF_WIDTH,
    Math.min(
      centerX,
      Math.max(FLOATING_BAR_HALF_WIDTH, articleRect.width - FLOATING_BAR_HALF_WIDTH),
    ),
  );
  const preferredTop = targetRect.top - articleRect.top - 48;
  const safeTop =
    preferredTop >= 0 ? preferredTop : targetRect.bottom - articleRect.top + 10;

  return {
    top: safeTop,
    left: clampedLeft,
  };
}

function measureFloatingPositionForSpan(
  articleEl: HTMLElement,
  span: ParagraphTokenSpan,
): FloatingPosition | null {
  const paragraphEl = articleEl.querySelector(
    `p[data-paragraph-index="${span.paragraphIndex}"]`,
  );
  if (!paragraphEl) return null;

  const startEl = paragraphEl.querySelector(
    `[data-token-index="${span.startTokenIndex}"]`,
  );
  const endEl = paragraphEl.querySelector(
    `[data-token-index="${span.endTokenIndex}"]`,
  );
  if (!(startEl instanceof HTMLElement) || !(endEl instanceof HTMLElement)) {
    return null;
  }

  const startRect = startEl.getBoundingClientRect();
  const endRect = endEl.getBoundingClientRect();

  let targetRect = startRect;
  if (span.startTokenIndex !== span.endTokenIndex && typeof document !== "undefined") {
    const measureRange = document.createRange();
    measureRange.setStartBefore(startEl);
    measureRange.setEndAfter(endEl);
    if (typeof measureRange.getBoundingClientRect === "function") {
      const rangeRect = measureRange.getBoundingClientRect();
      if (rangeRect.width > 0 || rangeRect.height > 0) {
        targetRect = rangeRect;
      }
    }
  }

  const singleLine = Math.abs(startRect.top - endRect.top) < 8;
  return computeFloatingPositionFromRect(
    articleEl,
    targetRect,
    singleLine,
    startRect,
    endRect,
  );
}

function resolveSpanBorderRadius(
  isHighlighted: boolean,
  isStart: boolean,
  isEnd: boolean,
): string {
  if (!isHighlighted) return "rounded-xs";
  if (isStart && isEnd) return "rounded-xs";
  if (isStart) return "rounded-l-xs rounded-r-none";
  if (isEnd) return "rounded-r-xs rounded-l-none";
  return "rounded-none";
}

/**
 * Cuerpo editorial de la lectura con tipografía serif.
 * Soporta selección incremental por clics (palabra por palabra o rango inicio–fin
 * dentro del mismo párrafo) y selección libre por arrastre con confirmación explícita
 * antes de consultar a la IA.
 */
export function ReadingArticle({
  paragraphs,
  language,
  fontScale,
  selectedWord,
  selectionActionLabel,
  clearSelectionLabel,
  selectionTooLongNotice,
  selectionCrossParagraphNotice,
  onSelectWord,
}: ReadingArticleProps) {
  const articleRef = useRef<HTMLElement | null>(null);
  const justDraggedRef = useRef(false);
  const mouseDownPointRef = useRef<{ x: number; y: number } | null>(null);
  const mouseDownSelectionRef = useRef<string | null>(null);

  const [pendingSpan, setPendingSpan] = useState<ParagraphTokenSpan | null>(null);
  const [confirmedSpanState, setConfirmedSpanState] =
    useState<ConfirmedSpanState | null>(null);
  const [keyboardCursor, setKeyboardCursor] = useState<{
    paragraphIndex: number;
    tokenIndex: number;
  } | null>(null);
  const [dragError, setDragError] = useState<string | null>(null);
  const [floatingPos, setFloatingPos] = useState<FloatingPosition | null>(null);

  const tokenizedParagraphs = useMemo(
    () => paragraphs.map((paragraph) => tokenizeReadingParagraph(paragraph)),
    [paragraphs],
  );

  const normalizedSelected = selectedWord
    ? normalizeForComparison(selectedWord)
    : null;

  const activeConfirmedSpan = useMemo(() => {
    if (!normalizedSelected) return null;
    if (
      confirmedSpanState &&
      confirmedSpanState.normalizedText === normalizedSelected
    ) {
      return confirmedSpanState.span;
    }
    return findTokenSpanInParagraphs(paragraphs, normalizedSelected);
  }, [confirmedSpanState, normalizedSelected, paragraphs]);

  const pendingText = useMemo(() => {
    if (!pendingSpan) return "";
    return resolveSpanSelectionText(paragraphs, pendingSpan);
  }, [paragraphs, pendingSpan]);

  const isPendingTooLong = pendingText.length > MAX_LOOKUP_SELECTION_CHARS;

  useEffect(() => {
    if (!pendingSpan) return;
    const container = articleRef.current;
    if (!container) return;

    let rafId = 0;
    const scheduleReposition = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        const nextPos = measureFloatingPositionForSpan(container, pendingSpan);
        if (nextPos) {
          setFloatingPos(nextPos);
        }
      });
    };

    scheduleReposition();

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(scheduleReposition)
        : null;
    observer?.observe(container);
    window.addEventListener("resize", scheduleReposition);

    return () => {
      window.cancelAnimationFrame(rafId);
      observer?.disconnect();
      window.removeEventListener("resize", scheduleReposition);
    };
  }, [fontScale, paragraphs, pendingSpan]);

  useEffect(() => {
    if (!pendingSpan && !dragError) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPendingSpan(null);
        setDragError(null);
        setFloatingPos(null);
        setKeyboardCursor(null);
        window.getSelection()?.removeAllRanges();
      }
    };

    const handleDocumentMouseDown = (event: MouseEvent) => {
      const container = articleRef.current;
      const target = event.target as Node | null;
      if (!container || !target || !container.contains(target)) {
        setPendingSpan(null);
        setDragError(null);
        setFloatingPos(null);
        setKeyboardCursor(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleDocumentMouseDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleDocumentMouseDown);
    };
  }, [dragError, pendingSpan]);

  const clearPendingState = () => {
    setPendingSpan(null);
    setDragError(null);
    setFloatingPos(null);
    setKeyboardCursor(null);
    window.getSelection()?.removeAllRanges();
  };

  const getClickableTokenIndices = (paragraphIndex: number): number[] => {
    const tokens = tokenizedParagraphs[paragraphIndex] ?? [];
    const indices: number[] = [];
    for (let i = 0; i < tokens.length; i += 1) {
      if (isClickableToken(tokens[i])) {
        indices.push(i);
      }
    }
    return indices;
  };

  const handleParagraphKeyDown = (
    event: React.KeyboardEvent<HTMLParagraphElement>,
    paragraphIndex: number,
  ) => {
    const clickable = getClickableTokenIndices(paragraphIndex);
    if (clickable.length === 0) return;

    const currentPos =
      keyboardCursor?.paragraphIndex === paragraphIndex
        ? clickable.indexOf(keyboardCursor.tokenIndex)
        : -1;

    if (event.key === "ArrowRight") {
      event.preventDefault();
      const nextPos = currentPos < 0 ? 0 : Math.min(clickable.length - 1, currentPos + 1);
      setKeyboardCursor({
        paragraphIndex,
        tokenIndex: clickable[nextPos],
      });
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      const prevPos =
        currentPos < 0 ? clickable.length - 1 : Math.max(0, currentPos - 1);
      setKeyboardCursor({
        paragraphIndex,
        tokenIndex: clickable[prevPos],
      });
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const targetTokenIndex =
        currentPos >= 0 ? clickable[currentPos] : clickable[0];
      setKeyboardCursor({
        paragraphIndex,
        tokenIndex: targetTokenIndex,
      });
      applyTokenSelection(paragraphIndex, targetTokenIndex);
    }
  };

  const applyTokenSelection = (paragraphIndex: number, tokenIndex: number) => {
    window.getSelection()?.removeAllRanges();
    setDragError(null);

    const nextSpan = computeNextTokenSpan(pendingSpan, paragraphIndex, tokenIndex);
    setPendingSpan(nextSpan);

    if (!nextSpan) {
      setFloatingPos(null);
      return;
    }

    const container = articleRef.current;
    if (container) {
      setFloatingPos(measureFloatingPositionForSpan(container, nextSpan));
    }
  };

  const captureRangeSelection = (event: {
    clientX?: number;
    clientY?: number;
    detail?: number;
  }) => {
    const container = articleRef.current;
    const sel = window.getSelection();
    const downPoint = mouseDownPointRef.current;
    const downSelectionText = mouseDownSelectionRef.current;
    mouseDownPointRef.current = null;
    mouseDownSelectionRef.current = null;

    if (!container || !sel || sel.rangeCount === 0 || sel.isCollapsed) {
      return;
    }

    const range = sel.getRangeAt(0);
    if (
      !container.contains(range.startContainer) ||
      !container.contains(range.endContainer)
    ) {
      return;
    }

    const rawText = sel.toString();
    const cleaned = cleanLookupSelection(rawText);
    if (!cleaned) {
      return;
    }

    const movedDistance =
      downPoint &&
      typeof event.clientX === "number" &&
      typeof event.clientY === "number"
        ? Math.hypot(event.clientX - downPoint.x, event.clientY - downPoint.y)
        : Number.POSITIVE_INFINITY;

    const isMultiWord = cleaned.includes(" ");
    const isDoubleClick = (event.detail ?? 0) >= 2;
    const selectionUnchangedOnClick =
      downSelectionText !== null &&
      rawText === downSelectionText &&
      movedDistance < MIN_DRAG_DISTANCE_PX &&
      !isDoubleClick;

    if (selectionUnchangedOnClick) {
      return;
    }

    const isIntentionalDrag =
      isMultiWord || isDoubleClick || movedDistance >= MIN_DRAG_DISTANCE_PX;

    if (!isIntentionalDrag) {
      return;
    }

    const resolved = resolveDomRangeToSpan(container, range, paragraphs);
    if (resolved.kind === "none") {
      return;
    }

    justDraggedRef.current = true;
    window.setTimeout(() => {
      justDraggedRef.current = false;
    }, 50);

    if (resolved.kind === "cross-paragraph") {
      setPendingSpan(null);
      setDragError(selectionCrossParagraphNotice);
      setFloatingPos(
        computeFloatingPositionFromRect(container, resolved.rect, false),
      );
      return;
    }

    setDragError(null);
    setPendingSpan(resolved.span);
    setFloatingPos(measureFloatingPositionForSpan(container, resolved.span));
  };

  const handleConfirmPendingSelection = () => {
    if (!pendingSpan || !pendingText || isPendingTooLong) return;
    const context = paragraphs[pendingSpan.paragraphIndex] ?? "";
    const confirmedSpan = pendingSpan;
    const normalizedText = normalizeForComparison(pendingText);

    setConfirmedSpanState({
      span: confirmedSpan,
      normalizedText,
    });
    clearPendingState();
    onSelectWord(pendingText, context);
  };

  return (
    <article
      ref={articleRef}
      lang={language}
      onMouseDown={(event) => {
        mouseDownPointRef.current = { x: event.clientX, y: event.clientY };
        setKeyboardCursor(null);
        const currentSel = window.getSelection();
        mouseDownSelectionRef.current =
          currentSel && !currentSel.isCollapsed ? currentSel.toString() : null;
        if (event.target === articleRef.current) {
          setPendingSpan(null);
          setDragError(null);
          setFloatingPos(null);
        }
      }}
      onMouseUp={(event) => captureRangeSelection(event)}
      onTouchEnd={() => captureRangeSelection({})}
      className={`relative flex flex-col gap-6 font-serif text-heading ${FONT_SCALE_CLASS[fontScale]}`}
    >
      {floatingPos && (pendingSpan || dragError) && (
        <div
          role="toolbar"
          aria-label={clearSelectionLabel}
          style={{ top: floatingPos.top, left: floatingPos.left }}
          className="absolute z-20 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-1.5 rounded-base border border-default-strong bg-surface p-1 shadow-lg"
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onMouseUp={(event) => event.stopPropagation()}
          onTouchEnd={(event) => event.stopPropagation()}
        >
          {dragError ? (
            <span className="px-2 py-0.5 font-sans text-xs font-medium text-status-warning sm:whitespace-nowrap">
              {dragError}
            </span>
          ) : isPendingTooLong ? (
            <span className="px-2 py-0.5 font-sans text-xs font-medium text-status-warning sm:whitespace-nowrap">
              {selectionTooLongNotice} ({pendingText.length}/
              {MAX_LOOKUP_SELECTION_CHARS})
            </span>
          ) : (
            <Button
              variant="primary"
              size="xs"
              leftIcon={<Icon name="sparkles" size="xs" />}
              className="whitespace-nowrap"
              onClick={handleConfirmPendingSelection}
            >
              {selectionActionLabel}
            </Button>
          )}

          <IconButton
            icon="close"
            size="xs"
            variant="ghost"
            aria-label={clearSelectionLabel}
            onClick={clearPendingState}
          />
        </div>
      )}

      {tokenizedParagraphs.map((tokens, pIndex) => (
        <p
          key={pIndex}
          data-paragraph-index={pIndex}
          tabIndex={0}
          onKeyDown={(event) => handleParagraphKeyDown(event, pIndex)}
          onBlur={() => {
            if (keyboardCursor?.paragraphIndex === pIndex) {
              setKeyboardCursor(null);
            }
          }}
          className="rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring"
        >
          {tokens.map((token, tIndex) => {
            const isInPending =
              pendingSpan !== null &&
              pendingSpan.paragraphIndex === pIndex &&
              tIndex >= pendingSpan.startTokenIndex &&
              tIndex <= pendingSpan.endTokenIndex;

            const isInConfirmed =
              activeConfirmedSpan !== null &&
              activeConfirmedSpan.paragraphIndex === pIndex &&
              tIndex >= activeConfirmedSpan.startTokenIndex &&
              tIndex <= activeConfirmedSpan.endTokenIndex;

            const activeSpan = isInPending
              ? pendingSpan
              : isInConfirmed
                ? activeConfirmedSpan
                : null;
            const isStart = activeSpan?.startTokenIndex === tIndex;
            const isEnd = activeSpan?.endTokenIndex === tIndex;
            const radiusClass = resolveSpanBorderRadius(
              Boolean(activeSpan),
              isStart,
              isEnd,
            );

            const highlightClass = isInPending
              ? "bg-brand text-white underline decoration-white/70 underline-offset-4"
              : isInConfirmed
                ? pendingSpan
                  ? "bg-neutral-secondary-strongest text-heading underline decoration-brand/60 underline-offset-4"
                  : "bg-brand text-white underline decoration-white/70 underline-offset-4"
                : "";

            if (!isClickableToken(token)) {
              return (
                <span
                  key={tIndex}
                  data-token-index={tIndex}
                  className={
                    highlightClass
                      ? `${radiusClass} ${highlightClass}`
                      : undefined
                  }
                >
                  {token}
                </span>
              );
            }

            const hoverClass = !highlightClass
              ? "hover:bg-neutral-secondary-medium hover:underline hover:decoration-brand/40 hover:underline-offset-4"
              : "";
            const isKeyboardFocused =
              keyboardCursor?.paragraphIndex === pIndex &&
              keyboardCursor?.tokenIndex === tIndex;

            return (
              <span
                key={tIndex}
                data-token-index={tIndex}
                data-selected={
                  isInPending ? "pending" : isInConfirmed ? "confirmed" : undefined
                }
                aria-current={isInPending || isInConfirmed ? "true" : undefined}
                onClick={() => {
                  if (justDraggedRef.current) {
                    justDraggedRef.current = false;
                    return;
                  }
                  applyTokenSelection(pIndex, tIndex);
                }}
                className={[
                  "cursor-pointer px-0.5 transition-colors",
                  radiusClass,
                  highlightClass || hoverClass,
                  isKeyboardFocused
                    ? "outline-2 outline-offset-2 outline-focus-ring"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {token}
              </span>
            );
          })}
        </p>
      ))}
    </article>
  );
}
