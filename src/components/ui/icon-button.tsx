"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";

import { Icon, type IconName, type IconSize } from "@/components/ui/icon";

export type IconButtonVariant = "ghost" | "secondary" | "outline" | "primary";
export type IconButtonSize = "xs" | "sm" | "md";
export type IconButtonShape = "square" | "circle";

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Identificador del ícono del sistema a renderizar. */
  icon: IconName;
  /** Etiqueta accesible obligatoria para lectores de pantalla. */
  "aria-label": string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  shape?: IconButtonShape;
  iconSize?: IconSize;
}

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  ghost:
    "border border-transparent bg-transparent text-body enabled:hover:bg-neutral-secondary-medium enabled:hover:text-heading",
  secondary:
    "border border-default-medium bg-neutral-primary-soft text-heading enabled:hover:border-brand enabled:hover:bg-neutral-secondary-medium",
  outline:
    "border border-brand bg-neutral-primary-soft text-heading enabled:hover:bg-brand enabled:hover:text-white",
  primary:
    "border border-brand bg-brand text-white enabled:hover:bg-brand-strong enabled:hover:border-brand-strong",
};

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  xs: "h-7 w-7",
  sm: "h-8 w-8",
  md: "h-9 w-9",
};

const ICON_SIZE_BY_BUTTON: Record<IconButtonSize, IconSize> = {
  xs: "sm",
  sm: "md",
  md: "md",
};

/**
 * Botón compacto exclusivamente para acciones de ícono (`cerrar`, `alternar contraseña`,
 * `menú móvil`, `reproducir audio`) con contraste accesible y área táctil uniforme.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      icon,
      variant = "ghost",
      size = "sm",
      shape = "square",
      iconSize,
      type = "button",
      className = "",
      disabled,
      ...rest
    },
    ref,
  ) {
    const resolvedIconSize = iconSize ?? ICON_SIZE_BY_BUTTON[size];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={[
          "inline-flex shrink-0 items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50",
          shape === "circle" ? "rounded-full" : "rounded-base",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        <Icon name={icon} size={resolvedIconSize} />
      </button>
    );
  },
);
