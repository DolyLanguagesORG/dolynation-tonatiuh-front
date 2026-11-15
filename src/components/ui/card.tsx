import { type HTMLAttributes } from "react";

export type CardVariant = "default" | "subtle" | "outline" | "dark";
export type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  as?: "div" | "article" | "section" | "aside";
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default:
    "bg-neutral-primary-soft border border-default text-heading shadow-none",
  subtle:
    "bg-neutral-secondary-medium border border-default/80 text-heading shadow-none",
  outline:
    "bg-transparent border border-default-medium text-heading shadow-none",
  dark: "bg-brand border border-brand text-white shadow-none",
};

const PADDING_CLASSES: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

/**
 * Contenedor de superficie editorial basado en el patrón `flowbite://components/cards`
 * y las variables de tema `@theme` de Flowbite.
 */
export function Card({
  variant = "default",
  padding = "md",
  as: Component = "div",
  className = "",
  children,
  ...rest
}: CardProps) {
  const classes = [
    "rounded-base transition-colors",
    VARIANT_CLASSES[variant],
    PADDING_CLASSES[padding],
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

export function CardHeader({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mb-4 flex flex-col gap-1.5 ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`font-serif text-xl font-semibold tracking-tight text-heading ${className}`.trim()}
      {...rest}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`text-sm leading-relaxed text-body ${className}`.trim()}
      {...rest}
    >
      {children}
    </p>
  );
}

export function CardContent({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4 ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}
