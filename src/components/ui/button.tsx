"use client";

import { Button as FlowbiteButton, Spinner } from "flowbite-react";
import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from "react";

import { dolyFlowbiteTheme } from "@/components/ui/flowbite-theme";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "success"
  | "warning"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const VARIANT_TO_FLOWBITE_COLOR: Record<
  ButtonVariant,
  "default" | "light" | "alternative" | "gray" | "green" | "yellow" | "red"
> = {
  primary: "default",
  secondary: "light",
  outline: "alternative",
  ghost: "gray",
  success: "green",
  warning: "yellow",
  danger: "red",
};

/**
 * Botón reutilizable basado en `flowbite-react` y el tema MCP de Flowbite (`@theme`),
 * adaptado al diseño editorial Blanco y Negro de los wireframes de DolyNation.
 *
 * Todos los botones estándar (`primary`, `secondary`, `outline`, `ghost`) son estrictamente
 * en blanco y negro; solo `success`, `warning` y `danger` aplican color semántico.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      type = "button",
      className = "",
      children,
      ...rest
    },
    ref,
  ) {
    const isDisabled = Boolean(disabled || isLoading);
    const flowbiteColor = VARIANT_TO_FLOWBITE_COLOR[variant];

    return (
      <FlowbiteButton
        ref={ref}
        theme={dolyFlowbiteTheme.button}
        applyTheme={{ color: "replace", size: "replace" }}
        color={flowbiteColor}
        size={size}
        fullSized={fullWidth}
        disabled={isDisabled}
        type={type}
        aria-busy={isLoading || undefined}
        className={className}
        {...rest}
      >
        {isLoading ? (
          <Spinner
            aria-hidden="true"
            size="sm"
            className="me-1.5 fill-current text-transparent"
          />
        ) : (
          leftIcon && (
            <span aria-hidden="true" className="inline-flex shrink-0">
              {leftIcon}
            </span>
          )
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && (
          <span aria-hidden="true" className="inline-flex shrink-0">
            {rightIcon}
          </span>
        )}
      </FlowbiteButton>
    );
  },
);
