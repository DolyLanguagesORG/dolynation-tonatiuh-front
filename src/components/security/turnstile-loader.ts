import type { CaptchaAppearance } from "@/lib/api-contracts";

export const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export interface TurnstileRenderOptions {
  sitekey: string;
  action?: string;
  theme?: "light" | "dark" | "auto";
  language?: string;
  appearance?: CaptchaAppearance;
  execution?: "render" | "execute";
  size?: "normal" | "compact" | "flexible";
  callback?: (token: string) => void;
  "error-callback"?: (errorCode?: string) => void;
  "expired-callback"?: () => void;
  "timeout-callback"?: () => void;
}

export interface TurnstileApi {
  render: (
    container: HTMLElement | string,
    options: TurnstileRenderOptions,
  ) => string;
  execute: (widgetId?: string) => void;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
  getResponse: (widgetId?: string) => string | undefined;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

/**
 * Carga el script explícito de Cloudflare Turnstile una sola vez en el navegador.
 */
export function loadTurnstileScript(): Promise<TurnstileApi> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(
      new Error("Turnstile only runs in a browser environment."),
    );
  }

  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-turnstile-loader="true"], script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]',
    );

    const handleLoad = (): void => {
      if (window.turnstile) {
        resolve(window.turnstile);
      } else {
        scriptPromise = null;
        reject(new Error("Turnstile script loaded without window.turnstile."));
      }
    };

    const handleError = (): void => {
      scriptPromise = null;
      reject(new Error("Failed to load Cloudflare Turnstile script."));
    };

    if (existing) {
      if (window.turnstile) {
        resolve(window.turnstile);
        return;
      }
      existing.addEventListener("load", handleLoad, { once: true });
      existing.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.setAttribute("data-turnstile-loader", "true");
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/** Reinicia la promesa compartida de carga del script (útil en pruebas unitarias). */
export function resetTurnstileLoaderForTests(): void {
  scriptPromise = null;
}
