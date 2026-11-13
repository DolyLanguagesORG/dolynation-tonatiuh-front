"use client";

import { Textarea as FlowbiteTextarea } from "flowbite-react";
import {
  forwardRef,
  type ReactNode,
  type TextareaHTMLAttributes,
  useId,
} from "react";

import { dolyFlowbiteTheme } from "@/components/ui/flowbite-theme";
import {
  FieldError,
  FieldHint,
  FieldLabelRow,
} from "@/components/ui/form-field";

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "color"> {
  label: string;
  hint?: string;
  error?: string;
  labelAction?: ReactNode;
  containerClassName?: string;
}

/**
 * Área de texto editorial accesible basada en `Textarea` de `flowbite-react` y
 * los tokens monocromáticos de DolyNation (ideal para respuestas de comprensión).
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      id: providedId,
      label,
      hint,
      error,
      labelAction,
      containerClassName = "",
      className = "",
      disabled,
      required,
      rows = 6,
      "aria-describedby": externalDescribedBy,
      ...rest
    },
    ref,
  ) {
    const generatedId = useId();
    const textareaId = providedId ?? `textarea-${generatedId}`;
    const hintId = `${textareaId}-hint`;
    const errorId = `${textareaId}-error`;

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
        <FieldLabelRow
          htmlFor={textareaId}
          label={label}
          required={required}
          disabled={disabled}
          hasError={hasError}
          labelAction={labelAction}
        />

        {hasHint && <FieldHint id={hintId}>{hint}</FieldHint>}

        <FlowbiteTextarea
          ref={ref}
          id={textareaId}
          rows={rows}
          color={hasError ? "failure" : "gray"}
          theme={dolyFlowbiteTheme.textarea}
          applyTheme={{ colors: "replace" }}
          disabled={disabled}
          required={required}
          aria-invalid={hasError ? "true" : undefined}
          aria-describedby={describedByIds || undefined}
          className={className}
          {...rest}
        />

        {hasError && <FieldError id={errorId}>{error}</FieldError>}
      </div>
    );
  },
);
