"use client";

import { useCallback, useEffect, useState } from "react";

export interface UseDisclosureOptions {
  defaultOpen?: boolean;
  closeOnEscape?: boolean;
}

export interface UseDisclosureReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Hook para controlar paneles colapsables, menús móviles o diálogos con soporte
 * de cierre por teclado (`Escape`).
 */
export function useDisclosure(
  options: UseDisclosureOptions = {},
): UseDisclosureReturn {
  const { defaultOpen = false, closeOnEscape = true } = options;
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    if (!isOpen || !closeOnEscape) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeOnEscape]);

  return { isOpen, open, close, toggle };
}
