"use client";

import { Icon } from "@/components/ui/icon";

export interface StepperItem {
  step: number;
  label: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface StepperProps {
  items: readonly StepperItem[];
  onStepSelect?: (step: number) => void;
  ariaLabel?: string;
  className?: string;
}

/**
 * Barra de pasos horizontal estandarizada para flujos guiados multi-etapa
 * (onboarding, evaluaciones o configuraciones secuenciales).
 */
export function Stepper({
  items,
  onStepSelect,
  ariaLabel = "Progreso de etapas",
  className = "",
}: StepperProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className={`w-full rounded-base border border-default bg-neutral-primary-soft p-3 sm:p-4 ${className}`.trim()}
    >
      <ol className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-between sm:gap-2">
        {items.map((item, idx) => {
          const canNavigate = Boolean(item.isCompleted && onStepSelect);

          return (
            <li
              key={item.step}
              className="min-w-0 sm:flex sm:flex-1 sm:items-center sm:gap-2"
            >
              <button
                type="button"
                disabled={!item.isCompleted && !item.isCurrent}
                onClick={() => {
                  if (canNavigate) {
                    onStepSelect?.(item.step);
                  }
                }}
                aria-current={item.isCurrent ? "step" : undefined}
                className={[
                  "flex w-full min-w-0 items-center justify-center gap-1.5 rounded-base px-2.5 py-2 text-[11px] font-bold tracking-wider uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring sm:gap-2 sm:px-3 sm:py-2.5 sm:text-xs",
                  item.isCurrent
                    ? "border border-brand bg-brand text-white"
                    : item.isCompleted
                      ? "cursor-pointer border border-default-medium bg-surface font-semibold text-ink hover:bg-neutral-secondary-medium"
                      : "cursor-default border border-transparent bg-neutral-primary-soft text-muted",
                ].join(" ")}
              >
                <span aria-hidden="true" className="shrink-0 font-mono font-bold">
                  {item.isCompleted ? (
                    <Icon name="check" size="xs" strokeWidth={2.5} />
                  ) : (
                    `0${item.step}`
                  )}
                </span>
                <span className="truncate font-bold tracking-wider">
                  {item.label}
                </span>
              </button>
              {idx < items.length - 1 && (
                <span
                  aria-hidden="true"
                  className="hidden h-px w-2 shrink-0 bg-default sm:block md:w-4"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
