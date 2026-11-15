export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "success"
  | "warning"
  | "danger";

export type ButtonSize = "xs" | "sm" | "md" | "lg";

/**
 * Clases editoriales sincronizadas con `dolyFlowbiteTheme.button` para compartir
 * exactamente la misma apariencia en botones reales (`Button`) y enlaces de acción (`ActionLink`).
 */
export const BUTTON_BASE_CLASSES =
  "relative inline-flex items-center justify-center gap-2 rounded-base font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

export const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white border border-brand hover:bg-brand-strong hover:border-brand-strong hover:text-white",
  secondary:
    "bg-neutral-primary-soft text-heading border border-default-medium hover:bg-neutral-secondary-medium hover:border-brand hover:text-heading",
  outline:
    "bg-neutral-primary-soft text-heading border border-brand hover:bg-brand hover:text-white hover:border-brand",
  ghost:
    "bg-transparent text-heading border border-transparent hover:bg-neutral-secondary-medium hover:text-heading",
  success:
    "bg-success text-white border border-success hover:bg-success-strong hover:border-success-strong",
  warning:
    "bg-warning text-white border border-warning hover:bg-warning-strong hover:border-warning-strong",
  danger:
    "bg-danger text-white border border-danger hover:bg-danger-strong hover:border-danger-strong",
};

export const BUTTON_SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: "min-h-7 px-2.5 py-1 text-[11px] tracking-wider uppercase",
  sm: "min-h-8 px-3 py-1.5 text-xs tracking-wider uppercase",
  md: "min-h-11 px-4 py-2.5 text-xs tracking-wider uppercase",
  lg: "min-h-12 px-6 py-3 text-sm tracking-wide",
};

/**
 * Compone la lista final de clases Tailwind para un control estilo botón.
 */
export function getButtonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}): string {
  return [
    BUTTON_BASE_CLASSES,
    BUTTON_VARIANT_CLASSES[variant],
    BUTTON_SIZE_CLASSES[size],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}
