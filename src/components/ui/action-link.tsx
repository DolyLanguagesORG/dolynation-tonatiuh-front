import Link, { type LinkProps } from "next/link";
import { type AnchorHTMLAttributes, type ReactNode } from "react";

import {
  type ButtonSize,
  type ButtonVariant,
  getButtonClasses,
} from "@/components/ui/button-styles";

export interface ActionLinkProps
  extends LinkProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

/**
 * Enlace de navegación (`next/link`) estilizado con la misma jerarquía visual
 * que `Button` para evitar anidar `<Link><Button tabIndex={-1} /></Link>`.
 */
export function ActionLink({
  href,
  variant = "primary",
  size = "md",
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = "",
  children,
  ...rest
}: ActionLinkProps) {
  return (
    <Link
      href={href}
      className={getButtonClasses({ variant, size, fullWidth, className })}
      {...rest}
    >
      {leftIcon && (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {leftIcon}
        </span>
      )}
      <span>{children}</span>
      {rightIcon && (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {rightIcon}
        </span>
      )}
    </Link>
  );
}
