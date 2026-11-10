"use client";

import {
  Checkbox as FlowbiteCheckbox,
  HelperText,
  Label,
} from "flowbite-react";
import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  useId,
} from "react";

import { dolyFlowbiteTheme } from "@/components/ui/flowbite-theme";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "color"> {
  /**
   * Contenido de la etiqueta asociada al checkbox mediante `htmlFor` e `id`.
   */
  label: ReactNode;
  /**
   * Texto de ayuda opcional vinculado con `aria-describedby`.
   */
  hint?: string;
  /**
   * Mensaje de error de validación. Activa `aria-invalid="true"` y color semántico `failure`.
   */
  error?: string;
  /**
   * Clases adicionales para el contenedor del control.
   */
  containerClassName?: string;
}

/**
 * Casilla de verificación accesible construida sobre `Checkbox`, `Label` y `HelperText`
 * de `flowbite-react` y el recurso MCP `flowbite://forms/checkbox`.
 *
 * El estado normal, marcado y foco es estrictamente Blanco y Negro;
 * el estado de error (`failure`) utiliza color semántico dinámico.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    {
      id: providedId,
      label,
      hint,
      error,
      containerClassName = "",
      className = "",
      disabled,
      required,
      "aria-describedby": externalDescribedBy,
      ...rest
    },
    ref,
  ) {
    const generatedId = useId();
    const checkboxId = providedId ?? `checkbox-${generatedId}`;
    const hintId = `${checkboxId}-hint`;
    const errorId = `${checkboxId}-error`;

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
      <div className={`flex flex-col gap-1 ${containerClassName}`.trim()}>
        <div className="flex items-start gap-2.5">
          <FlowbiteCheckbox
            ref={ref}
            id={checkboxId}
            color={hasError ? "failure" : "default"}
            theme={dolyFlowbiteTheme.checkbox}
            applyTheme={{ base: "replace", color: "replace" }}
            disabled={disabled}
            required={required}
            aria-invalid={hasError ? "true" : undefined}
            aria-describedby={describedByIds || undefined}
            className={`mt-0.5 ${className}`.trim()}
            {...rest}
          />
          <Label
            htmlFor={checkboxId}
            theme={dolyFlowbiteTheme.label}
            applyTheme={{ root: { colors: "replace" } }}
            color={hasError ? "failure" : "default"}
            disabled={disabled}
            className="cursor-pointer text-xs font-normal leading-relaxed text-body"
          >
            {label}
          </Label>
        </div>

        {hasHint && (
          <HelperText
            id={hintId}
            theme={dolyFlowbiteTheme.helperText}
            applyTheme={{ root: { colors: "replace" } }}
            color="gray"
            className="mt-0 pl-6"
          >
            {hint}
          </HelperText>
        )}

        {hasError && (
          <HelperText
            id={errorId}
            role="alert"
            theme={dolyFlowbiteTheme.helperText}
            applyTheme={{ root: { colors: "replace" } }}
            color="failure"
            className="mt-0.5 flex items-center gap-1.5 pl-6"
          >
            <svg
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </HelperText>
        )}
      </div>
    );
  },
);
