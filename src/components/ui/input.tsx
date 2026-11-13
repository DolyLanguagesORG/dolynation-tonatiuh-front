"use client";

import { TextInput } from "flowbite-react";
import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  useId,
} from "react";

import { dolyFlowbiteTheme } from "@/components/ui/flowbite-theme";
import {
  FieldError,
  FieldHint,
  FieldLabelRow,
} from "@/components/ui/form-field";

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
      <FieldLabelRow
        htmlFor={inputId}
        label={label}
        required={required}
        disabled={disabled}
        hasError={hasError}
        labelAction={labelAction}
      />

      {hasHint && <FieldHint id={hintId}>{hint}</FieldHint>}

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

      {hasError && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
});
