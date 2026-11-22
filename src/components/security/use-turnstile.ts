"use client";

import { type RefObject, useCallback, useEffect, useRef, useState } from "react";

import { useLocale } from "@/i18n";
import {
  ApiClientError,
  type CaptchaAction,
  type CaptchaConfigResponse,
  ErrorCode,
  getCachedCaptchaConfig,
} from "@/lib";
import {
  loadTurnstileScript,
  type TurnstileApi,
} from "@/components/security/turnstile-loader";

const TURNSTILE_EXECUTE_TIMEOUT_MS = 30_000;

interface PendingExecution {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
}

export interface UseTurnstileResult {
  /** Contenedor donde Turnstile monta su iframe si requiere reto interactivo. */
  containerRef: RefObject<HTMLDivElement | null>;
  /** Indica si la verificación anti-bot está habilitada en el ambiente actual. */
  isEnabled: boolean;
  /** Indica si Turnstile está ejecutando un reto en curso. */
  isVerifying: boolean;
  /** Genera un token fresco (invisible por defecto) o devuelve `null` si está deshabilitado. */
  execute: (overrideAction?: CaptchaAction) => Promise<string | null>;
  /** Reinicia el widget para emitir un nuevo token tras un envío o error. */
  reset: () => void;
}

/**
 * Orquesta Cloudflare Turnstile en modo invisible por defecto (`execution: "execute"` +
 * `appearance: "interaction-only"`). Para humanos legítimos no ocupa espacio visual; si
 * Cloudflare detecta riesgo, escala automáticamente dentro de `<TurnstileField />`.
 */
export function useTurnstile(defaultAction: CaptchaAction): UseTurnstileResult {
  const { locale } = useLocale();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fallbackContainerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const renderedActionRef = useRef<CaptchaAction | null>(null);
  const renderedSiteKeyRef = useRef<string | null>(null);
  const renderedLocaleRef = useRef<string | null>(null);
  const pendingRef = useRef<PendingExecution | null>(null);

  const [isEnabled, setIsEnabled] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const settlePendingError = useCallback((error: unknown): void => {
    const pending = pendingRef.current;
    if (!pending) return;
    pendingRef.current = null;
    clearTimeout(pending.timer);
    setIsVerifying(false);
    pending.reject(error);
  }, []);

  const settlePendingToken = useCallback((token: string): void => {
    const pending = pendingRef.current;
    if (!pending) return;
    pendingRef.current = null;
    clearTimeout(pending.timer);
    setIsVerifying(false);
    pending.resolve(token);
  }, []);

  const cleanupWidget = useCallback((): void => {
    if (
      widgetIdRef.current !== null &&
      typeof window !== "undefined" &&
      window.turnstile
    ) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // Ignora fallos si el nodo del widget ya fue desmontado por React.
      }
    }
    widgetIdRef.current = null;
    renderedActionRef.current = null;
    renderedSiteKeyRef.current = null;
    renderedLocaleRef.current = null;
  }, []);

  useEffect(() => {
    let active = true;

    void getCachedCaptchaConfig().then((config) => {
      if (!active) return;
      const enabled = config.enabled && Boolean(config.siteKey);
      setIsEnabled(enabled);
      if (enabled) {
        void loadTurnstileScript().catch(() => undefined);
      }
    });

    return () => {
      active = false;
      settlePendingError(
        new ApiClientError({
          code: ErrorCode.CAPTCHA_VERIFICATION_FAILED,
          status: 403,
        }),
      );
      cleanupWidget();
      if (fallbackContainerRef.current) {
        fallbackContainerRef.current.remove();
        fallbackContainerRef.current = null;
      }
    };
  }, [cleanupWidget, settlePendingError]);

  const resolveMountTarget = useCallback((): HTMLElement => {
    if (containerRef.current) {
      return containerRef.current;
    }
    if (!fallbackContainerRef.current) {
      const host = document.createElement("div");
      host.setAttribute("data-turnstile-fallback", "true");
      host.style.position = "fixed";
      host.style.bottom = "16px";
      host.style.right = "16px";
      host.style.zIndex = "50";
      document.body.appendChild(host);
      fallbackContainerRef.current = host;
    }
    return fallbackContainerRef.current;
  }, []);

  const ensureWidget = useCallback(
    (
      turnstile: TurnstileApi,
      config: CaptchaConfigResponse,
      action: CaptchaAction,
    ): string => {
      const siteKey = config.siteKey ?? "";
      if (
        widgetIdRef.current !== null &&
        renderedActionRef.current === action &&
        renderedSiteKeyRef.current === siteKey &&
        renderedLocaleRef.current === locale
      ) {
        return widgetIdRef.current;
      }

      if (widgetIdRef.current !== null) {
        cleanupWidget();
      }

      const target = resolveMountTarget();
      const widgetId = turnstile.render(target, {
        sitekey: siteKey,
        action,
        theme: "light",
        language: locale,
        appearance: config.appearance ?? "interaction-only",
        execution: "execute",
        size: "flexible",
        callback: (token: string) => {
          settlePendingToken(token);
        },
        "error-callback": () => {
          settlePendingError(
            new ApiClientError({
              code: ErrorCode.CAPTCHA_VERIFICATION_FAILED,
              status: 403,
            }),
          );
        },
        "expired-callback": () => {
          settlePendingError(
            new ApiClientError({
              code: ErrorCode.CAPTCHA_VERIFICATION_FAILED,
              status: 403,
            }),
          );
        },
        "timeout-callback": () => {
          settlePendingError(
            new ApiClientError({
              code: ErrorCode.CAPTCHA_VERIFICATION_FAILED,
              status: 403,
            }),
          );
        },
      });

      widgetIdRef.current = widgetId;
      renderedActionRef.current = action;
      renderedSiteKeyRef.current = siteKey;
      renderedLocaleRef.current = locale;
      return widgetId;
    },
    [cleanupWidget, locale, resolveMountTarget, settlePendingError, settlePendingToken],
  );

  const execute = useCallback(
    async (overrideAction?: CaptchaAction): Promise<string | null> => {
      const config = await getCachedCaptchaConfig();
      if (!config.enabled || !config.siteKey) {
        setIsEnabled(false);
        return null;
      }
      setIsEnabled(true);

      let turnstile: TurnstileApi;
      try {
        turnstile = await loadTurnstileScript();
      } catch {
        throw new ApiClientError({
          code: ErrorCode.CAPTCHA_PROVIDER_UNAVAILABLE,
          status: 503,
        });
      }

      const actionToUse = overrideAction ?? defaultAction;
      const widgetId = ensureWidget(turnstile, config, actionToUse);

      if (pendingRef.current) {
        settlePendingError(
          new ApiClientError({
            code: ErrorCode.CAPTCHA_VERIFICATION_FAILED,
            status: 403,
          }),
        );
      }

      setIsVerifying(true);

      return new Promise<string>((resolve, reject) => {
        const timer = setTimeout(() => {
          if (pendingRef.current) {
            pendingRef.current = null;
            setIsVerifying(false);
            reject(
              new ApiClientError({
                code: ErrorCode.CAPTCHA_VERIFICATION_FAILED,
                status: 403,
              }),
            );
          }
        }, TURNSTILE_EXECUTE_TIMEOUT_MS);

        pendingRef.current = { resolve, reject, timer };

        try {
          turnstile.execute(widgetId);
        } catch {
          clearTimeout(timer);
          pendingRef.current = null;
          setIsVerifying(false);
          reject(
            new ApiClientError({
              code: ErrorCode.CAPTCHA_VERIFICATION_FAILED,
              status: 403,
            }),
          );
        }
      });
    },
    [defaultAction, ensureWidget, settlePendingError],
  );

  const reset = useCallback((): void => {
    setIsVerifying(false);
    if (
      widgetIdRef.current !== null &&
      typeof window !== "undefined" &&
      window.turnstile
    ) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        // Sin efecto si el widget fue desmontado antes del reset.
      }
    }
  }, []);

  return {
    containerRef,
    isEnabled,
    isVerifying,
    execute,
    reset,
  };
}
