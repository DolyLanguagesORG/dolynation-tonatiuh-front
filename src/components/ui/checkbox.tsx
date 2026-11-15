"use client";

import { Checkbox as FlowbiteCheckbox, Label } from "flowbite-react";
import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  useId,
} from "react";

import { dolyFlowbiteTheme } from "@/components/ui/flowbite-theme";
import { FieldError, FieldHint } from "@/components/ui/form-field";

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
          <FieldHint id={hintId} className="pl-6">
            {hint}
          </FieldHint>
        )}

        {hasError && (
          <FieldError id={errorId} className="pl-6">
            {error}
          </FieldError>
        )}
      </div>
    );
  },
);
