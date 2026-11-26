"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

import { toBusinessCalendarDate } from "@/app/profile/_components/streak-calendar-utils";
import { Card, Container, Heading, Text } from "@/components/ui";
import { useAuth } from "@/context";
import { formatMessage, useLocale } from "@/i18n";

export interface AuthLegalLink {
  href: string;
  label: string;
}

export interface AuthShellProps {
  /** Título editorial de la tarjeta (`Reanudar DolySesion`, `Crear DolyCuenta`). */
  title: string;
  /** Subtítulo explicativo debajo del título. */
  subtitle?: string;
  /** Ancho máximo editorial de la vista (`max-w-[460px]` para login, `max-w-3xl`/`max-w-5xl` para registro). */
  maxWidthClass?: string;
  /** Muestra un enlace discreto de "Cerrar sesión" debajo de la tarjeta cuando exista sesión activa. */
  showSignOutWhenAuthenticated?: boolean;
  /** Contenido opcional sobre la tarjeta principal (p. ej. stepper de registro). */
  topSlot?: ReactNode;
  /**
   * Acción de utilidad flotante (p. ej. `<FloatingLocaleSelector />`) anclada a
   * la esquina superior derecha de la pantalla, **fuera** de la tarjeta.
   * El shell la renderiza tal cual y reserva holgura superior para que el
   * contenido nunca quede debajo. No se muestra si no se pasa.
   */
  headerAction?: ReactNode;
  /** Contenido principal de la tarjeta. */
  children: ReactNode;
  /** Mensaje y enlace debajo de la tarjeta (p. ej. "¿No tienes cuenta? Regístrate"). */
  footerPrompt?: ReactNode;
  /** Enlaces legales inferiores estándar. */
  legalLinks?: readonly AuthLegalLink[];
  /** Nota institucional opcional debajo de los enlaces. */
  copyrightText?: string;
}

/**
 * Contenedor estandarizado para pantallas de autenticación y onboarding,
 * garantizando simetría de tarjetas, cabeceras tipográficas y pie legal.
 */
export function AuthShell({
  title,
  subtitle,
  maxWidthClass = "max-w-[460px]",
  showSignOutWhenAuthenticated = true,
  topSlot,
  headerAction,
  children,
  footerPrompt,
  legalLinks,
  copyrightText,
}: AuthShellProps) {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();
  const { t } = useLocale();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const canShowSignOut = Boolean(isAuthenticated && showSignOutWhenAuthenticated);
  const resolvedCopyrightText = copyrightText
    ? copyrightText.includes("{year}")
      ? formatMessage(copyrightText, {
          year: toBusinessCalendarDate().getFullYear(),
        })
      : copyrightText
    : undefined;

  const handleSignOut = async (): Promise<void> => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <>
      {headerAction}

      <Container
        size="none"
        className={`flex w-full ${maxWidthClass} flex-col items-center gap-6 px-0`}
      >
        {/* Holgura superior: evita que la tarjeta quede bajo la acción flotante. */}
        {headerAction && <div aria-hidden="true" className="h-8 w-full shrink-0" />}

        {topSlot && <div className="w-full">{topSlot}</div>}

      <Card padding="lg" className="w-full border-default bg-surface sm:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Heading as="h1" variant="title" mainHeading>
              {title}
            </Heading>
            {subtitle && (
              <Text variant="small" tone="muted">
                {subtitle}
              </Text>
            )}
          </div>

          {children}
        </div>
      </Card>

      {(footerPrompt ||
        canShowSignOut ||
        (legalLinks && legalLinks.length > 0) ||
        copyrightText) && (
        <div className="flex flex-col items-center gap-3 text-center">
          {footerPrompt && <div className="text-xs text-muted">{footerPrompt}</div>}

          {canShowSignOut && (
            <button
              type="button"
              disabled={isSigningOut}
              onClick={() => void handleSignOut()}
              className="cursor-pointer text-xs font-medium text-muted underline underline-offset-4 transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSigningOut ? t.nav.signingOut : t.nav.signOut}
            </button>
          )}

          {legalLinks && legalLinks.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-semibold tracking-widest text-subtle uppercase">
              {legalLinks.map((item, idx) => (
                <span key={item.href + item.label} className="inline-flex items-center gap-2">
                  {idx > 0 && <span aria-hidden="true">/</span>}
                  <Link href={item.href} className="hover:text-ink">
                    {item.label}
                  </Link>
                </span>
              ))}
            </div>
          )}

          {resolvedCopyrightText && (
            <p className="text-[10px] font-medium tracking-widest text-subtle uppercase">
              {resolvedCopyrightText}
            </p>
          )}
        </div>
      )}
    </Container>
    </>
  );
}
