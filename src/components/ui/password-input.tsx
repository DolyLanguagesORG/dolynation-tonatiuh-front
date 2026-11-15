"use client";

import { forwardRef, useState } from "react";

import { IconButton } from "@/components/ui/icon-button";
import { Input, type InputProps } from "@/components/ui/input";

export interface PasswordInputProps
  extends Omit<InputProps, "type" | "rightElement"> {
  /** Etiqueta accesible cuando la contraseña está oculta. */
  showLabel?: string;
  /** Etiqueta accesible cuando la contraseña es visible. */
  hideLabel?: string;
  /** Modo visual del interruptor: ícono ojo o botón textual compacto (`MOSTRAR`). */
  toggleStyle?: "icon" | "text";
  /** Estado controlado opcional de visibilidad. */
  visible?: boolean;
  /** Callback controlado opcional al alternar visibilidad. */
  onVisibilityChange?: (nextVisible: boolean) => void;
}

/**
 * Campo estandarizado de contraseña construido sobre `Input` con alternancia
 * accesible de visibilidad para unificar inicio de sesión, registro y perfil.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    {
      showLabel = "Mostrar contraseña",
      hideLabel = "Ocultar contraseña",
      toggleStyle = "icon",
      visible,
      onVisibilityChange,
      disabled,
      className = "",
      ...rest
    },
    ref,
  ) {
    const [internalVisible, setInternalVisible] = useState(false);
    const isVisible = visible ?? internalVisible;

    const handleToggle = (): void => {
      const next = !isVisible;
      if (visible === undefined) {
        setInternalVisible(next);
      }
      onVisibilityChange?.(next);
    };

    const toggleElement =
      toggleStyle === "text" ? (
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          aria-pressed={isVisible}
          aria-label={isVisible ? hideLabel : showLabel}
          className="rounded-xs px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-muted uppercase transition-colors hover:text-heading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50"
        >
          {isVisible ? hideLabel : showLabel}
        </button>
      ) : (
        <IconButton
          icon={isVisible ? "eye-off" : "eye"}
          size="xs"
          variant="ghost"
          disabled={disabled}
          aria-pressed={isVisible}
          aria-label={isVisible ? hideLabel : showLabel}
          onClick={handleToggle}
        />
      );

    return (
      <Input
        ref={ref}
        type={isVisible ? "text" : "password"}
        disabled={disabled}
        className={`${toggleStyle === "text" ? "[&_input]:pr-20" : ""} ${className}`.trim()}
        rightElement={toggleElement}
        {...rest}
      />
    );
  },
);
