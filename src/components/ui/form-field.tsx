"use client";

import { HelperText, Label } from "flowbite-react";
import { type ReactNode } from "react";

import { dolyFlowbiteTheme } from "@/components/ui/flowbite-theme";
import { Icon } from "@/components/ui/icon";

export interface FieldLabelRowProps {
  htmlFor: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  hasError?: boolean;
  labelAction?: ReactNode;
}

/**
 * Fila superior reutilizable de etiqueta + acción secundaria para campos de formulario.
 */
export function FieldLabelRow({
  htmlFor,
  label,
  required,
  disabled,
  hasError = false,
  labelAction,
}: FieldLabelRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <Label
        htmlFor={htmlFor}
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
  );
}

/**
 * Texto auxiliar descriptivo asociado a un control mediante `aria-describedby`.
 */
export function FieldHint({
  id,
  children,
  className = "",
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <HelperText
      id={id}
      theme={dolyFlowbiteTheme.helperText}
      applyTheme={{ root: { colors: "replace" } }}
      color="gray"
      className={`mt-0 ${className}`.trim()}
    >
      {children}
    </HelperText>
  );
}

/**
 * Mensaje de validación accesible unificado para entradas de texto, selección y casillas.
 */
export function FieldError({
  id,
  children,
  className = "",
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <HelperText
      id={id}
      role="alert"
      theme={dolyFlowbiteTheme.helperText}
      applyTheme={{ root: { colors: "replace" } }}
      color="failure"
      className={`mt-0.5 flex items-center gap-1.5 ${className}`.trim()}
    >
      <Icon name="alert-circle" size="sm" />
      <span>{children}</span>
    </HelperText>
  );
}
