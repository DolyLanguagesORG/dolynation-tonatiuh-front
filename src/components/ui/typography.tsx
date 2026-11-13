import { type HTMLAttributes, type ReactNode } from "react";

export type HeadingLevel = "h1" | "h2" | "h3" | "h4";
export type HeadingVariant =
  | "display"
  | "title"
  | "section"
  | "subsection"
  | "card";

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Etiqueta semántica HTML (`h1`-`h4`). */
  as?: HeadingLevel;
  /** Escala tipográfica editorial DolyNation. */
  variant?: HeadingVariant;
  /** Marca este encabezado como destino del enlace "Saltar al contenido". */
  mainHeading?: boolean;
}

const HEADING_VARIANT_CLASSES: Record<HeadingVariant, string> = {
  display: "font-serif text-3xl font-normal tracking-tight text-heading sm:text-4xl",
  title: "font-serif text-2xl font-normal tracking-tight text-heading sm:text-3xl",
  section: "font-serif text-xl font-semibold tracking-tight text-heading sm:text-2xl",
  subsection: "font-serif text-lg font-semibold tracking-tight text-heading sm:text-xl",
  card: "font-serif text-base font-semibold tracking-tight text-heading sm:text-lg",
};

/**
 * Encabezado editorial estandarizado con fuente `Newsreader` (`font-serif`) y
 * soporte nativo para foco accesible en `#main-heading`.
 */
export function Heading({
  as: Component = "h2",
  variant = "section",
  mainHeading = false,
  className = "",
  id,
  tabIndex,
  children,
  ...rest
}: HeadingProps) {
  return (
    <Component
      id={id ?? (mainHeading ? "main-heading" : undefined)}
      tabIndex={tabIndex ?? (mainHeading ? -1 : undefined)}
      className={`${HEADING_VARIANT_CLASSES[variant]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </Component>
  );
}

export type TextElement = "p" | "span" | "div";
export type TextVariant =
  | "editorial"
  | "lead"
  | "body"
  | "small"
  | "caption"
  | "meta";
export type TextTone =
  | "heading"
  | "body"
  | "muted"
  | "subtle"
  | "success"
  | "warning"
  | "danger"
  | "inverted";

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: TextElement;
  variant?: TextVariant;
  tone?: TextTone;
}

const TEXT_VARIANT_CLASSES: Record<TextVariant, string> = {
  editorial: "font-serif text-base leading-relaxed sm:text-lg sm:leading-8",
  lead: "font-sans text-sm leading-relaxed sm:text-base",
  body: "font-sans text-sm leading-relaxed",
  small: "font-sans text-xs leading-relaxed",
  caption: "font-sans text-[11px] leading-normal",
  meta: "font-mono text-[11px] font-semibold tracking-wider uppercase",
};

const TEXT_TONE_CLASSES: Record<TextTone, string> = {
  heading: "text-heading",
  body: "text-body",
  muted: "text-muted",
  subtle: "text-body-subtle",
  success: "text-fg-success",
  warning: "text-fg-warning",
  danger: "text-fg-danger",
  inverted: "text-white",
};

/**
 * Primitivo de texto editorial y de interfaz para mantener jerarquía tipográfica uniforme.
 */
export function Text({
  as: Component = "p",
  variant = "body",
  tone = "body",
  className = "",
  children,
  ...rest
}: TextProps) {
  return (
    <Component
      className={`${TEXT_VARIANT_CLASSES[variant]} ${TEXT_TONE_CLASSES[tone]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </Component>
  );
}

export interface EyebrowProps extends HTMLAttributes<HTMLParagraphElement> {
  tone?: "default" | "heading" | "muted";
  as?: "p" | "span";
}

/**
 * Etiqueta superior de sección o categoría técnica en mayúsculas (`01. IDIOMA META`,
 * `[EXPEDIENTE ACADÉMICO]`, `[ESPAÑOL] ACADÉMICO`).
 */
export function Eyebrow({
  tone = "default",
  as: Component = "p",
  className = "",
  children,
  ...rest
}: EyebrowProps) {
  const toneClass =
    tone === "heading"
      ? "text-heading"
      : tone === "muted"
        ? "text-muted"
        : "text-body-subtle";

  return (
    <Component
      className={`font-sans text-[11px] font-bold tracking-widest uppercase ${toneClass} ${className}`.trim()}
      {...rest}
    >
      {children}
    </Component>
  );
}

export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  /** Texto opcional centrado entre líneas divisorias. */
  label?: ReactNode;
}

/**
 * Separador horizontal simple o rotulado para tarjetas de autenticación y secciones.
 */
export function Divider({
  label,
  className = "",
  ...rest
}: DividerProps) {
  if (!label) {
    return (
      <div
        role="separator"
        className={`h-px w-full bg-border ${className}`.trim()}
        {...rest}
      />
    );
  }

  return (
    <div
      className={`flex items-center gap-3 ${className}`.trim()}
      aria-hidden="true"
      {...rest}
    >
      <span className="h-px flex-1 bg-border" />
      <span className="text-[10px] font-bold tracking-widest text-body-subtle uppercase">
        {label}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
