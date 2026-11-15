"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Button, Icon } from "@/components/ui";
import { UI_LOCALE_CATALOG, useLocale } from "@/i18n";

/**
 * Selector accesible de idioma de interfaz (`ES`, `EN`, `FR`, `IT`) en la barra superior.
 * Controla únicamente el idioma del esqueleto/aplicación sin alterar la inmersión por lectura o glosario.
 */
export function LocaleSelector() {
  const { locale, locales, t, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const currentDescriptor = UI_LOCALE_CATALOG[locale];

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <Button
        ref={triggerRef}
        type="button"
        variant="secondary"
        size="xs"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`${t.meta.languageSwitcherLabel}: ${currentDescriptor.nativeLabel} (${currentDescriptor.badge})`}
        title={t.meta.languageSwitcherLabel}
        className="gap-1.5 px-2.5 font-mono"
      >
        <Icon name="globe" size="xs" />
        <span>{t.meta.editionBadge}</span>
        <Icon
          name="chevron-down"
          size="xs"
          className={
            open
              ? "rotate-180 transition-transform duration-150"
              : "transition-transform duration-150"
          }
        />
      </Button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={t.meta.languageSwitcherLabel}
          className="absolute right-0 z-50 mt-2 w-48 rounded-base border border-default bg-surface py-1.5 shadow-lg"
        >
          <div className="border-b border-default px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest text-subtle uppercase">
            {t.meta.languageSwitcherLabel}
          </div>

          <div className="flex flex-col py-1">
            {locales.map((option) => {
              const isSelected = option.code === locale;
              return (
                <button
                  key={option.code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isSelected}
                  onClick={() => {
                    setLocale(option.code);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className={[
                    "flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors focus-visible:bg-neutral-secondary-medium focus-visible:outline-none",
                    isSelected
                      ? "bg-neutral-secondary-soft font-semibold text-heading"
                      : "text-body hover:bg-neutral-secondary-soft hover:text-heading",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={[
                        "inline-flex min-w-7 items-center justify-center rounded-xxs border px-1 py-0.5 font-mono text-[10px] font-bold",
                        isSelected
                          ? "border-brand bg-brand text-white"
                          : "border-default bg-neutral-primary-soft text-muted",
                      ].join(" ")}
                    >
                      {option.badge}
                    </span>
                    <span>{option.nativeLabel}</span>
                  </span>

                  {isSelected && (
                    <Icon name="check" size="xs" className="text-heading" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
