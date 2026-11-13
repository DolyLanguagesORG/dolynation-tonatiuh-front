"use client";

import { Select as FlowbiteSelect } from "flowbite-react";
import { forwardRef, type SelectHTMLAttributes, useId } from "react";

import { dolyFlowbiteTheme } from "@/components/ui/flowbite-theme";
import {
  FieldError,
  FieldHint,
  FieldLabelRow,
} from "@/components/ui/form-field";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "color" | "size"> {
  /** Etiqueta visible; si se omite en barras de filtro, usar `aria-label`. */
  label?: string;
  hint?: string;
  error?: string;
  options?: readonly SelectOption[];
  sizing?: "sm" | "md" | "lg";
  containerClassName?: string;
}

/**
 * Selector desplegable basado en `Select` de `flowbite-react` con variantes
 * de formulario estándar (`md`) y barra de filtros editorial (`sm`).
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      id: providedId,
      label,
      hint,
      error,
      options,
      sizing = "md",
      containerClassName = "",
      className = "",
      disabled,
      required,
      children,
      "aria-describedby": externalDescribedBy,
      ...rest
    },
    ref,
  ) {
    const generatedId = useId();
    const selectId = providedId ?? `select-${generatedId}`;
    const hintId = `${selectId}-hint`;
    const errorId = `${selectId}-error`;

    const hasError = Boolean(error && error.trim().length > 0);
    const hasHint = Boolean(hint && hint.trim().length > 0);

    const describedByIds = [
      hasHint ? hintId : null,
      hasError ? errorId : null,
      externalDescribedBy ?? null,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={`flex flex-col gap-1.5 ${containerClassName}`.trim()}>
        {label && (
          <FieldLabelRow
            htmlFor={selectId}
            label={label}
            required={required}
            disabled={disabled}
            hasError={hasError}
          />
        )}

        {hasHint && <FieldHint id={hintId}>{hint}</FieldHint>}

        <FlowbiteSelect
          ref={ref}
          id={selectId}
          sizing={sizing}
          color={hasError ? "failure" : "gray"}
          theme={dolyFlowbiteTheme.select}
          applyTheme={{
            field: { select: { colors: "replace", sizes: "replace" } },
          }}
          disabled={disabled}
          required={required}
          aria-invalid={hasError ? "true" : undefined}
          aria-describedby={describedByIds || undefined}
          className={className}
          {...rest}
        >
          {options
            ? options.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                >
                  {opt.label}
                </option>
              ))
            : children}
        </FlowbiteSelect>

        {hasError && <FieldError id={errorId}>{error}</FieldError>}
      </div>
    );
  },
);
