"use client";

import { type RefObject } from "react";

export interface TurnstileFieldProps {
  containerRef: RefObject<HTMLDivElement | null>;
  className?: string;
}

/**
 * Contenedor editorial sin altura visible mientras Cloudflare Turnstile valida en
 * segundo plano (`appearance: "interaction-only"`). Solo se despliega inline si
 * Cloudflare solicita interacción explícita del visitante.
 */
export function TurnstileField({
  containerRef,
  className = "",
}: TurnstileFieldProps) {
  return (
    <div
      ref={containerRef}
      data-testid="turnstile-slot"
      className={`empty:hidden ${className}`.trim()}
    />
  );
}
