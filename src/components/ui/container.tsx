import { type HTMLAttributes } from "react";

export type ContainerSize = "sm" | "md" | "lg" | "xl" | "full" | "none";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
  as?: "div" | "section" | "article";
}

const SIZE_CLASSES: Record<ContainerSize, string> = {
  sm: "max-w-md",
  md: "max-w-3xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  full: "max-w-full",
  none: "",
};

/**
 * Contenedor responsivo alineado a la retícula editorial de DolyNation.
 * Garantiza márgenes horizontales seguros sin desbordes desde 375 px hasta 1280+ px.
 */
export function Container({
  size = "lg",
  as: Component = "div",
  className = "",
  children,
  ...rest
}: ContainerProps) {
  const classes = [
    "mx-auto w-full min-w-0 px-4 sm:px-6 lg:px-10",
    SIZE_CLASSES[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  );
}
