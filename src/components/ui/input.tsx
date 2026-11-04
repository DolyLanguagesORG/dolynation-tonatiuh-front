"use client";

import { HelperText, Label, TextInput } from "flowbite-react";
import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  useId,
} from "react";

import { dolyFlowbiteTheme } from "@/components/ui/flowbite-theme";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "color"> {
  /**
   * Etiqueta visible obligatoria asociada mediante `htmlFor` e `id`.
   */
  label: string;
  /**
   * Texto de ayuda opcional colocado sobre el control y vinculado con `aria-describedby`.
   */
  hint?: string;
  /**
   * Mensaje de error de validación. Activa `aria-invalid="true"` y se anuncia vía `aria-describedby`.
   */
  error?: string;
  /**
   * Acción o enlace secundario alineado a la derecha del label (p. ej. "¿Olvidaste tu contraseña?").
   */
  labelAction?: ReactNode;
  /**
   * Elemento interactivo o decorativo al extremo derecho del campo.
   */
  rightElement?: ReactNode;
  /**
   * Clases adicionales para el contenedor del grupo.
   */
  containerClassName?: string;
}

/**
 * Campo de entrada accesible construido con `Label`, `TextInput` y `HelperText` de `flowbite-react`
 * y estilizado con los tokens del MCP de Flowbite (`flowbite://forms/input-field`).
 *
 * El estado normal, foco y deshabilitado es estrictamente Blanco y Negro;
 * el estado de error (`failure`) utiliza color semántico dinámico.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id: providedId,
    label,
    hint,
    error,
    labelAction,
    rightElement,
    containerClassName = "",
    className = "",
    disabled,
    required,
    type = "text",
    autoCorrect,
    autoCapitalize,
    spellCheck,
    "aria-describedby": externalDescribedBy,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const inputId = providedId ?? `input-${generatedId}`;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  const hasError = Boolean(error && error.trim().length > 0);
  const hasHint = Boolean(hint && hint.trim().length > 0);

  const describedByIds = [
    hasHint ? hintId : null,
    hasError ? errorId : null,
    externalDescribedBy ?? null,
  ]
    .filter(Boolean)
    .join(" ");

  const isIdentifierField =
    type === "email" || type === "search" || type === "url";

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`.trim()}>
      <div className="flex items-baseline justify-between gap-2">
        <Label
          htmlFor={inputId}
          theme={dolyFlowbiteTheme.label}
          applyTheme={{ root: { colors: "replace" } }}
          color={hasError ? "failure" : "default"}
          disabled={disabled}
        >
          <span>{label}</span>
          {required && (
            <span aria-hidden="true" className="ml-1 text-fg-danger">
              *
            </span>
          )}
        </Label>
        {labelAction && (
          <div className="text-xs text-body">{labelAction}</div>
        )}
      </div>

      {hasHint && (
        <HelperText
          id={hintId}
          theme={dolyFlowbiteTheme.helperText}
          applyTheme={{ root: { colors: "replace" } }}
          color="gray"
          className="mt-0"
        >
          {hint}
        </HelperText>
      )}

      <div className="relative flex items-center">
        <TextInput
          ref={ref}
          id={inputId}
          type={type}
          sizing="md"
          color={hasError ? "failure" : "gray"}
          theme={dolyFlowbiteTheme.textInput}
          applyTheme={{ field: { input: { colors: "replace", sizes: "replace" } } }}
          disabled={disabled}
          required={required}
          aria-invalid={hasError ? "true" : undefined}
          aria-describedby={describedByIds || undefined}
          autoCorrect={
            autoCorrect ?? (isIdentifierField ? "off" : undefined)
          }
          autoCapitalize={
            autoCapitalize ?? (isIdentifierField ? "off" : undefined)
          }
          spellCheck={
            spellCheck ?? (isIdentifierField ? false : undefined)
          }
          className={`w-full ${rightElement ? "[&_input]:pr-11" : ""} ${className}`.trim()}
          {...rest}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-body">
            {rightElement}
          </div>
        )}
      </div>

      {hasError && (
        <HelperText
          id={errorId}
          role="alert"
          theme={dolyFlowbiteTheme.helperText}
          applyTheme={{ root: { colors: "replace" } }}
          color="failure"
          className="mt-0.5 flex items-center gap-1.5"
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
});
