import {
  type ApiRequestOptions,
  type ApiTransport,
  type CaptchaConfigResponse,
} from "@/lib/api-contracts";
import { type ApiResponse } from "@/lib/api-errors";
import { httpClient } from "@/lib/http-client";

export type SecurityRequestOptions = Omit<ApiRequestOptions, "method" | "body">;

const DISABLED_CAPTCHA_CONFIG: CaptchaConfigResponse = {
  enabled: false,
  provider: "disabled",
  siteKey: null,
  appearance: "interaction-only",
};

let cachedCaptchaConfig: CaptchaConfigResponse | null = null;
let inflightCaptchaConfig: Promise<CaptchaConfigResponse> | null = null;

/**
 * Crea el servicio público de seguridad en runtime (`/security/*`).
 */
export function createSecurityService(transport: ApiTransport) {
  return {
    /** Obtiene la configuración activa de Cloudflare Turnstile sin requerir sesión. */
    getCaptchaConfig(
      options?: SecurityRequestOptions,
    ): Promise<ApiResponse<CaptchaConfigResponse>> {
      return transport.get<CaptchaConfigResponse>("/security/captcha/config", {
        skipAuth: true,
        ...options,
      });
    },
  };
}

/** Instancia de cliente para configuración de seguridad en navegador. */
export const securityService = createSecurityService(httpClient);

/**
 * Obtiene y memoriza la configuración pública de CAPTCHA para evitar múltiples
 * consultas entre formularios. Ante fallos de transporte devuelve `disabled`
 * sin memorizar el error para permitir recuperación automática.
 */
export async function getCachedCaptchaConfig(): Promise<CaptchaConfigResponse> {
  if (cachedCaptchaConfig) {
    return cachedCaptchaConfig;
  }
  if (inflightCaptchaConfig) {
    return inflightCaptchaConfig;
  }

  inflightCaptchaConfig = securityService
    .getCaptchaConfig()
    .then((response) => {
      const data = response.data;
      if (data && typeof data.enabled === "boolean") {
        const normalized: CaptchaConfigResponse = {
          enabled: data.enabled && Boolean(data.siteKey),
          provider: data.provider === "turnstile" ? "turnstile" : "disabled",
          siteKey: data.siteKey ?? null,
          appearance: data.appearance ?? "interaction-only",
        };
        cachedCaptchaConfig = normalized;
        return normalized;
      }
      return DISABLED_CAPTCHA_CONFIG;
    })
    .catch(() => DISABLED_CAPTCHA_CONFIG)
    .finally(() => {
      inflightCaptchaConfig = null;
    });

  return inflightCaptchaConfig;
}

/** Limpia la caché en memoria de la configuración CAPTCHA (para pruebas). */
export function resetCaptchaConfigCache(): void {
  cachedCaptchaConfig = null;
  inflightCaptchaConfig = null;
}
