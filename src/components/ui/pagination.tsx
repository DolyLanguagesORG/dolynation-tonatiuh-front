"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/typography";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  visibleItemsCount: number;
  onPageChange: (page: number) => void;
  previousLabel?: string;
  nextLabel?: string;
  summaryText?: string;
  className?: string;
}

/**
 * Barra de paginación editorial monocromática inspirada en el historial
 * de lecturas (`MOSTRANDO 5 DE 28` + `← ANTERIOR 1 2 3 SIGUIENTE →`).
 */
export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  visibleItemsCount,
  onPageChange,
  previousLabel = "ANTERIOR",
  nextLabel = "SIGUIENTE",
  summaryText,
  className = "",
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const pages = Array.from({ length: safeTotalPages }, (_, idx) => idx + 1);
  const defaultSummary = `Mostrando ${visibleItemsCount} de ${totalItems} registros`;

  return (
    <nav
      aria-label="Paginación de registros"
      className={`flex flex-wrap items-center justify-between gap-3 pt-4 ${className}`.trim()}
    >
      <Text variant="caption" tone="muted" className="font-mono uppercase">
        {summaryText ?? defaultSummary}
      </Text>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          variant="secondary"
          size="xs"
          disabled={currentPage <= 1}
          leftIcon={<Icon name="arrow-left" size="xs" />}
          onClick={() => onPageChange(currentPage - 1)}
        >
          {previousLabel}
        </Button>

        {pages.map((pageNumber) => {
          const isCurrent = pageNumber === currentPage;
          return (
            <button
              key={pageNumber}
              type="button"
              aria-current={isCurrent ? "page" : undefined}
              onClick={() => onPageChange(pageNumber)}
              className={[
                "inline-flex min-h-7 min-w-7 items-center justify-center rounded-base border px-2 font-mono text-xs font-bold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                isCurrent
                  ? "border-brand bg-brand text-white"
                  : "border-default-medium bg-neutral-primary-soft text-heading hover:border-brand hover:bg-neutral-secondary-medium",
              ].join(" ")}
            >
              {pageNumber}
            </button>
          );
        })}

        <Button
          variant="secondary"
          size="xs"
          disabled={currentPage >= safeTotalPages}
          rightIcon={<Icon name="arrow-right" size="xs" />}
          onClick={() => onPageChange(currentPage + 1)}
        >
          {nextLabel}
        </Button>
      </div>
    </nav>
  );
}
