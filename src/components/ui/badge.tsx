"use client";

import { Badge as FlowbiteBadge } from "flowbite-react";
import { type HTMLAttributes } from "react";

import { dolyFlowbiteTheme } from "@/components/ui/flowbite-theme";

export type BadgeVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "error";

export interface BadgeProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "color"> {
  variant?: BadgeVariant;
}

const VARIANT_TO_FLOWBITE_COLOR: Record<
  BadgeVariant,
  "dark" | "gray" | "light" | "success" | "warning" | "failure"
> = {
  primary: "dark",
  secondary: "gray",
  outline: "light",
  success: "success",
  warning: "warning",
  error: "failure",
};

/**
 * Etiqueta compacta basada en `Badge` de `flowbite-react` y el recurso `flowbite://components/badge`
 * para clasificadores lingüísticos (`[EN] INGLÉS`, `NIVEL MEDIO`, `[B1-B2]`).
 *
 * Las variantes `primary`, `secondary` y `outline` son estrictamente en blanco y negro;
 * únicamente `success`, `warning` y `error` aplican color semántico.
 */
export function Badge({
  variant = "secondary",
  className = "",
  children,
  ...rest
}: BadgeProps) {
  return (
    <FlowbiteBadge
      theme={dolyFlowbiteTheme.badge}
      applyTheme={{ root: { color: "replace" } }}
      color={VARIANT_TO_FLOWBITE_COLOR[variant]}
      className={className}
      {...rest}
    >
      {children}
    </FlowbiteBadge>
  );
}
