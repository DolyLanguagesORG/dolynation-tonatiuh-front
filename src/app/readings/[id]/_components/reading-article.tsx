"use client";

import { cleanLookupWord, type TargetLanguageCode } from "@/lib";

export interface ReadingArticleProps {
  paragraphs: readonly string[];
  language: TargetLanguageCode;
  fontScale: 0 | 1 | 2;
  selectedWord: string | null;
  onSelectWord: (word: string, paragraphContext: string) => void;
}

const FONT_SCALE_CLASS: Record<0 | 1 | 2, string> = {
  0: "text-base sm:text-lg leading-relaxed",
  1: "text-lg sm:text-xl leading-[1.8]",
  2: "text-xl sm:text-2xl leading-[1.85]",
};

/**
 * Cuerpo editorial de la lectura con tipografía serif y palabras clicables
 * accesibles para invocar análisis contextual por IA.
 */
export function ReadingArticle({
  paragraphs,
  language,
  fontScale,
  selectedWord,
  onSelectWord,
}: ReadingArticleProps) {
  const normalizedSelected = selectedWord?.toLowerCase() ?? null;

  return (
    <article
      lang={language}
      className={`flex flex-col gap-6 font-serif text-heading ${FONT_SCALE_CLASS[fontScale]}`}
    >
      {paragraphs.map((paragraph, pIndex) => {
        const tokens = paragraph.split(/(\s+)/);

        return (
          <p key={pIndex}>
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
                cleaned.toLowerCase() === normalizedSelected;

              return (
                <span
                  key={tIndex}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectWord(cleaned, paragraph)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
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
