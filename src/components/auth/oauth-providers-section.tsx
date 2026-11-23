"use client";

import { type ReactNode, useEffect, useState } from "react";

import { Button, Divider } from "@/components/ui";
import { useLocale } from "@/i18n";
import {
  authService,
  type OAuthProviderConfig,
  type OAuthProviderId,
} from "@/lib";

export interface OAuthProvidersSectionProps {
  mode: "login" | "register";
  redirectTarget?: string;
  disabled?: boolean;
  onNavigate?: (url: string) => void;
}

function GoogleMarkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      fill="none"
    >
      <path
        d="M21.805 12.23c0-.72-.065-1.412-.185-2.077H12v3.93h5.497a4.7 4.7 0 0 1-2.038 3.084v2.564h3.299c1.93-1.777 3.047-4.395 3.047-7.501Z"
        fill="currentColor"
      />
      <path
        d="M12 22c2.755 0 5.066-.913 6.755-2.469l-3.299-2.564c-.914.613-2.083.975-3.456.975-2.658 0-4.909-1.795-5.713-4.208H2.878v2.643A10.197 10.197 0 0 0 12 22Z"
        fill="currentColor"
        opacity="0.82"
      />
      <path
        d="M6.287 13.734A6.135 6.135 0 0 1 5.966 12c0-.602.104-1.187.321-1.734V7.623H2.878A10.197 10.197 0 0 0 1.8 12c0 1.646.394 3.204 1.078 4.377l3.409-2.643Z"
        fill="currentColor"
        opacity="0.68"
      />
      <path
        d="M12 6.058c1.498 0 2.842.515 3.9 1.525l2.926-2.926C17.061 3.012 14.75 2 12 2A10.197 10.197 0 0 0 2.878 7.623l3.409 2.643C7.091 7.853 9.342 6.058 12 6.058Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

/**
 * Botones de inicio de sesión / registro con proveedores OAuth externos habilitados
 * en runtime por el backend. No renderiza nada si ningún proveedor está activo.
 */
function MicrosoftMarkIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
      viewBox="0 0 21 21"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

export function OAuthProvidersSection({
  mode,
  redirectTarget = "/",
  disabled = false,
  onNavigate,
}: OAuthProvidersSectionProps) {
  const { locale, t } = useLocale();
  const [providers, setProviders] = useState<OAuthProviderConfig[]>([]);
  const [redirectingProvider, setRedirectingProvider] =
    useState<OAuthProviderId | null>(null);

  useEffect(() => {
    let cancelled = false;
    authService
      .getOAuthProviders()
      .then((response) => {
        if (cancelled) return;
        const enabled = (response.data?.providers ?? []).filter(
          (item) => item.enabled,
        );
        setProviders(enabled);
      })
      .catch(() => {
        if (!cancelled) {
          setProviders([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const enabledProviders = providers.filter(
    (item) =>
      item.enabled &&
      (item.provider === "google" || item.provider === "microsoft"),
  );
  if (enabledProviders.length === 0) {
    return null;
  }

  const dividerLabel =
    mode === "login" ? t.auth.login.divider : t.auth.register.divider;
  const isAnyRedirecting = redirectingProvider !== null;

  const providerMeta: Record<
    OAuthProviderId,
    { label: string; icon: ReactNode }
  > = {
    google: {
      label:
        mode === "login"
          ? t.auth.login.googleButton
          : t.auth.register.googleButton,
      icon: <GoogleMarkIcon />,
    },
    microsoft: {
      label:
        mode === "login"
          ? t.auth.login.microsoftButton
          : t.auth.register.microsoftButton,
      icon: <MicrosoftMarkIcon />,
    },
  };

  const handleProviderClick = (provider: OAuthProviderId): void => {
    if (disabled || isAnyRedirecting) {
      return;
    }
    setRedirectingProvider(provider);
    const params = new URLSearchParams({
      origin: mode,
      locale,
      redirect: redirectTarget || "/",
    });
    const url = `/api/auth/oauth/${provider}?${params.toString()}`;
    if (onNavigate) {
      onNavigate(url);
    } else {
      window.location.assign(new URL(url, window.location.origin).href);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2.5">
        {enabledProviders.map((item) => {
          const meta = providerMeta[item.provider];
          return (
            <Button
              key={item.provider}
              type="button"
              variant="outline"
              size="lg"
              fullWidth
              isLoading={redirectingProvider === item.provider}
              disabled={disabled || isAnyRedirecting}
              leftIcon={meta.icon}
              onClick={() => handleProviderClick(item.provider)}
              className="normal-case tracking-normal"
            >
              {meta.label}
            </Button>
          );
        })}
      </div>

      <Divider label={dividerLabel} />
    </div>
  );
}
