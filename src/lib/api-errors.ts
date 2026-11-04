/**
 * Contrato de respuestas y catálogo de errores del backend (`dolynation-atl-back`).
 *
 * Regla de arquitectura: el frontend toma decisiones usando `error.code` (string estable),
 * nunca inspeccionando ni parseando `error.message`.
 */

export const ErrorCode = {
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  AUTH_TOKEN_EXPIRED: "AUTH_TOKEN_EXPIRED",
  AUTH_TOKEN_INVALID: "AUTH_TOKEN_INVALID",
  AUTH_EMAIL_ALREADY_EXISTS: "AUTH_EMAIL_ALREADY_EXISTS",
  AUTH_PASSWORD_TOO_WEAK: "AUTH_PASSWORD_TOO_WEAK",
  AUTH_UNAUTHORIZED: "AUTH_UNAUTHORIZED",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  RESOURCE_FORBIDDEN: "RESOURCE_FORBIDDEN",
  READING_PENDING_LIMIT_REACHED: "READING_PENDING_LIMIT_REACHED",
  READING_ALREADY_EVALUATED: "READING_ALREADY_EVALUATED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  // Códigos de transporte del cliente HTTP
  NETWORK_ERROR: "NETWORK_ERROR",
  CONFIG_ERROR: "CONFIG_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export type KnownErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ValidationFieldIssue {
  field: string;
  message: string;
  rule?: string;
}

export interface ApiError {
  code: KnownErrorCode | (string & {});
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Envelope canónico devuelto por todos los endpoints de `dolynation-atl-back`.
 */
export interface ApiResponse<T = unknown> {
  message: string;
  data: T;
  error?: ApiError;
}

const ERROR_MESSAGES_ES: Record<KnownErrorCode, string> = {
  AUTH_INVALID_CREDENTIALS:
    "Las credenciales ingresadas no son válidas. Verifica tu correo y contraseña.",
  AUTH_TOKEN_EXPIRED:
    "Tu sesión académica ha expirado. Renovando credenciales o vuelve a iniciar sesión.",
  AUTH_TOKEN_INVALID:
    "La sesión actual no es válida. Inicia sesión nuevamente para continuar.",
  AUTH_EMAIL_ALREADY_EXISTS:
    "Ya existe una cuenta registrada con este correo electrónico.",
  AUTH_PASSWORD_TOO_WEAK:
    "La contraseña no cumple con los requisitos mínimos de seguridad.",
  AUTH_UNAUTHORIZED:
    "Necesitas iniciar sesión para acceder a este recurso académico.",
  RESOURCE_NOT_FOUND:
    "El recurso solicitado no fue encontrado o ya no está disponible.",
  RESOURCE_FORBIDDEN:
    "No cuentas con permisos suficientes para realizar esta acción.",
  READING_PENDING_LIMIT_REACHED:
    "Alcanzaste el límite de lecturas pendientes. Completa tus evaluaciones activas antes de generar un nuevo texto.",
  READING_ALREADY_EVALUATED:
    "Esta lectura ya fue evaluada previamente y su calificación está cerrada.",
  VALIDATION_ERROR:
    "Algunos campos del formulario contienen errores. Revisa los datos marcados.",
  INTERNAL_ERROR:
    "Ocurrió un error interno en el servidor. Intenta nuevamente en unos momentos.",
  SERVICE_UNAVAILABLE:
    "El servicio lingüístico no está disponible temporalmente. Intenta más tarde.",
  NETWORK_ERROR:
    "No fue posible conectar con el servidor. Verifica tu conexión o el estado del backend.",
  CONFIG_ERROR:
    "Falta configurar NEXT_PUBLIC_API_BASE_URL en las variables de entorno del proyecto.",
  UNKNOWN_ERROR:
    "Se produjo un error inesperado al procesar la solicitud.",
};

const ERROR_MESSAGES_EN: Record<KnownErrorCode, string> = {
  AUTH_INVALID_CREDENTIALS:
    "Invalid email or password. Please verify your academic credentials.",
  AUTH_TOKEN_EXPIRED:
    "Your academic session has expired. Please sign in again.",
  AUTH_TOKEN_INVALID:
    "Your current session token is invalid. Please sign in again.",
  AUTH_EMAIL_ALREADY_EXISTS:
    "An account with this email address is already registered.",
  AUTH_PASSWORD_TOO_WEAK:
    "The password does not meet the minimum security requirements.",
  AUTH_UNAUTHORIZED:
    "You must be signed in to access this academic resource.",
  RESOURCE_NOT_FOUND:
    "The requested resource could not be found.",
  RESOURCE_FORBIDDEN:
    "You do not have permission to perform this action.",
  READING_PENDING_LIMIT_REACHED:
    "You have reached the pending readings limit. Complete active evaluations before generating a new text.",
  READING_ALREADY_EVALUATED:
    "This reading has already been evaluated.",
  VALIDATION_ERROR:
    "Some form fields contain validation errors. Please check the highlighted inputs.",
  INTERNAL_ERROR:
    "An internal server error occurred. Please try again shortly.",
  SERVICE_UNAVAILABLE:
    "The linguistic service is temporarily unavailable. Please try again later.",
  NETWORK_ERROR:
    "Could not reach the backend server. Check your network connection.",
  CONFIG_ERROR:
    "NEXT_PUBLIC_API_BASE_URL is not configured in the environment variables.",
  UNKNOWN_ERROR:
    "An unexpected error occurred while processing the request.",
};

/**
 * Resuelve un mensaje legible para el usuario a partir de `error.code`.
 */
export function resolveErrorMessage(
  code: string | undefined,
  locale: "es" | "en" = "es",
): string {
  const dictionary = locale === "en" ? ERROR_MESSAGES_EN : ERROR_MESSAGES_ES;
  if (code && code in dictionary) {
    return dictionary[code as KnownErrorCode];
  }
  return dictionary.UNKNOWN_ERROR;
}

/**
 * Extrae el mapa de errores por campo cuando `error.code === 'VALIDATION_ERROR'`.
 */
export function extractValidationFields(
  details?: Record<string, unknown>,
): Record<string, string> {
  if (!details || !Array.isArray(details.fields)) {
    return {};
  }

  const fieldMap: Record<string, string> = {};
  for (const item of details.fields) {
    if (
      typeof item === "object" &&
      item !== null &&
      "field" in item &&
      "message" in item &&
      typeof (item as { field: unknown }).field === "string" &&
      typeof (item as { message: unknown }).message === "string"
    ) {
      const typed = item as ValidationFieldIssue;
      fieldMap[typed.field] = typed.message;
    }
  }
  return fieldMap;
}

/**
 * Error uniforme lanzado por el cliente HTTP del frontend.
 */
export class ApiClientError extends Error {
  public readonly code: KnownErrorCode | (string & {});
  public readonly status: number;
  public readonly details?: Record<string, unknown>;
  public readonly fieldErrors: Record<string, string>;

  constructor(params: {
    code: KnownErrorCode | (string & {});
    message?: string;
    status: number;
    details?: Record<string, unknown>;
  }) {
    const resolvedMessage =
      params.message ?? resolveErrorMessage(params.code, "es");
    super(resolvedMessage);
    this.name = "ApiClientError";
    this.code = params.code;
    this.status = params.status;
    this.details = params.details;
    this.fieldErrors = extractValidationFields(params.details);
  }

  /**
   * Devuelve el mensaje localizado seguro para mostrar en componentes `Alert` o formularios.
   */
  public getUserMessage(locale: "es" | "en" = "es"): string {
    return resolveErrorMessage(this.code, locale);
  }

  /**
   * Indica si el error corresponde a expiración o invalidez de sesión (HTTP 401).
   */
  public get isUnauthorized(): boolean {
    return (
      this.status === 401 ||
      this.code === ErrorCode.AUTH_UNAUTHORIZED ||
      this.code === ErrorCode.AUTH_TOKEN_EXPIRED ||
      this.code === ErrorCode.AUTH_TOKEN_INVALID
    );
  }
}
