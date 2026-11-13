/**
 * Contrato de respuestas y catálogo completo de errores del backend (`dolynation-atl-back`).
 *
 * Regla de arquitectura: el frontend toma decisiones exclusivamente usando `error.code`
 * (string estable), nunca inspeccionando ni parseando `error.message`.
 */

export const ErrorCode = {
  // Autenticación (4xx)
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  AUTH_TOKEN_EXPIRED: "AUTH_TOKEN_EXPIRED",
  AUTH_TOKEN_INVALID: "AUTH_TOKEN_INVALID",
  AUTH_EMAIL_ALREADY_EXISTS: "AUTH_EMAIL_ALREADY_EXISTS",
  AUTH_PASSWORD_TOO_WEAK: "AUTH_PASSWORD_TOO_WEAK",
  AUTH_UNAUTHORIZED: "AUTH_UNAUTHORIZED",
  AUTH_EMAIL_NOT_VERIFIED: "AUTH_EMAIL_NOT_VERIFIED",
  AUTH_EMAIL_TOKEN_INVALID: "AUTH_EMAIL_TOKEN_INVALID",

  // Recursos (4xx)
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  RESOURCE_FORBIDDEN: "RESOURCE_FORBIDDEN",

  // Dominio de lecturas (4xx / 429)
  READING_PENDING_LIMIT_REACHED: "READING_PENDING_LIMIT_REACHED",
  READING_ALREADY_EVALUATED: "READING_ALREADY_EVALUATED",
  READING_DAILY_LIMIT_REACHED: "READING_DAILY_LIMIT_REACHED",
  EXPLANATION_DAILY_LIMIT_REACHED: "EXPLANATION_DAILY_LIMIT_REACHED",

  // Suscripciones e idiomas (4xx)
  SUBSCRIPTION_REQUIRED: "SUBSCRIPTION_REQUIRED",
  SUBSCRIPTION_INVALID_TIER: "SUBSCRIPTION_INVALID_TIER",
  SUBSCRIPTION_CATEGORY_LIMIT_EXCEEDED: "SUBSCRIPTION_CATEGORY_LIMIT_EXCEEDED",
  SUBSCRIPTION_LANGUAGE_LIMIT_EXCEEDED: "SUBSCRIPTION_LANGUAGE_LIMIT_EXCEEDED",
  SUBSCRIPTION_LANGUAGE_NOT_ALLOWED: "SUBSCRIPTION_LANGUAGE_NOT_ALLOWED",
  LANGUAGE_NOT_SELECTED: "LANGUAGE_NOT_SELECTED",
  LANGUAGE_CHANGE_LOCKED: "LANGUAGE_CHANGE_LOCKED",

  // Categorías y moderación (4xx / 429)
  CATEGORY_MODERATION_REJECTED: "CATEGORY_MODERATION_REJECTED",
  CATEGORY_DAILY_LIMIT_REACHED: "CATEGORY_DAILY_LIMIT_REACHED",

  // Validación (4xx)
  VALIDATION_ERROR: "VALIDATION_ERROR",

  // Servidor (5xx)
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
  error?: ApiError | null;
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
  AUTH_EMAIL_NOT_VERIFIED:
    "Debes confirmar tu correo electrónico antes de poder continuar.",
  AUTH_EMAIL_TOKEN_INVALID:
    "El enlace de verificación es inválido, ya fue usado o expiró. Solicita uno nuevo.",
  RESOURCE_NOT_FOUND:
    "El recurso solicitado no fue encontrado o ya no está disponible.",
  RESOURCE_FORBIDDEN:
    "No cuentas con permisos suficientes para realizar esta acción.",
  READING_PENDING_LIMIT_REACHED:
    "Alcanzaste el límite de lecturas pendientes. Completa tus evaluaciones activas antes de generar un nuevo texto.",
  READING_ALREADY_EVALUATED:
    "Esta lectura ya fue evaluada previamente y su calificación está cerrada.",
  READING_DAILY_LIMIT_REACHED:
    "Alcanzaste el límite diario de generación de lecturas permitido por tu plan actual.",
  EXPLANATION_DAILY_LIMIT_REACHED:
    "Alcanzaste el límite diario de preguntas y explicaciones permitido por tu plan actual.",
  SUBSCRIPTION_REQUIRED:
    "Necesitas seleccionar un plan de suscripción activo antes de usar las herramientas de estudio.",
  SUBSCRIPTION_INVALID_TIER:
    "El plan de suscripción especificado no es válido. Elige Dolly, Dolly Plus o Dolly Pro.",
  SUBSCRIPTION_CATEGORY_LIMIT_EXCEEDED:
    "Superaste el máximo de categorías de estudio permitido por tu plan de suscripción.",
  SUBSCRIPTION_LANGUAGE_LIMIT_EXCEEDED:
    "Superaste el máximo de idiomas simultáneos permitido por tu plan de suscripción.",
  SUBSCRIPTION_LANGUAGE_NOT_ALLOWED:
    "El idioma seleccionado no está habilitado dentro de los cupos activos de tu suscripción.",
  LANGUAGE_NOT_SELECTED:
    "Debes elegir al menos un idioma de estudio en configuración antes de generar lecturas.",
  LANGUAGE_CHANGE_LOCKED:
    "Tu selección de idiomas está bloqueada. Puedes modificarla una vez al año o adquirir un desbloqueo inmediato.",
  CATEGORY_MODERATION_REJECTED:
    "Una o más categorías propuestas no superaron las políticas de moderación de contenido.",
  CATEGORY_DAILY_LIMIT_REACHED:
    "Alcanzaste el límite diario para evaluar o añadir nuevas categorías personalizadas. Intenta mañana.",
  VALIDATION_ERROR:
    "Algunos campos del formulario contienen errores. Revisa los datos marcados.",
  INTERNAL_ERROR:
    "Ocurrió un error interno en el servidor. Intenta nuevamente en unos momentos.",
  SERVICE_UNAVAILABLE:
    "El servicio lingüístico no está disponible temporalmente. Intenta más tarde.",
  NETWORK_ERROR:
    "No fue posible conectar con el servidor. Verifica tu conexión o el estado del backend.",
  CONFIG_ERROR:
    "El proxy interno del servidor no está configurado correctamente en este entorno.",
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
  AUTH_EMAIL_NOT_VERIFIED:
    "Please confirm your email address before continuing.",
  AUTH_EMAIL_TOKEN_INVALID:
    "This verification link is invalid, already used, or expired. Request a new confirmation email.",
  RESOURCE_NOT_FOUND:
    "The requested resource could not be found.",
  RESOURCE_FORBIDDEN:
    "You do not have permission to perform this action.",
  READING_PENDING_LIMIT_REACHED:
    "You have reached the pending readings limit. Complete active evaluations before generating a new text.",
  READING_ALREADY_EVALUATED:
    "This reading has already been evaluated.",
  READING_DAILY_LIMIT_REACHED:
    "You have reached the daily reading generation limit for your current plan.",
  EXPLANATION_DAILY_LIMIT_REACHED:
    "You have reached the daily vocabulary explanation limit for your current plan.",
  SUBSCRIPTION_REQUIRED:
    "An active subscription plan is required before accessing study tools. Please select a plan.",
  SUBSCRIPTION_INVALID_TIER:
    "The selected subscription tier is invalid. Choose Dolly, Dolly Plus, or Dolly Pro.",
  SUBSCRIPTION_CATEGORY_LIMIT_EXCEEDED:
    "You have exceeded the maximum number of categories allowed by your subscription plan.",
  SUBSCRIPTION_LANGUAGE_LIMIT_EXCEEDED:
    "You have exceeded the maximum number of simultaneous languages allowed by your plan.",
  SUBSCRIPTION_LANGUAGE_NOT_ALLOWED:
    "The requested language is not enabled in your active subscription language selection.",
  LANGUAGE_NOT_SELECTED:
    "You must select your target study languages in settings before generating readings.",
  LANGUAGE_CHANGE_LOCKED:
    "Your selected languages are locked. You can change them once per year or unlock an immediate change.",
  CATEGORY_MODERATION_REJECTED:
    "One or more custom categories were rejected by content moderation.",
  CATEGORY_DAILY_LIMIT_REACHED:
    "Daily limit for adding or evaluating new custom categories has been reached. Try again tomorrow.",
  VALIDATION_ERROR:
    "Some form fields contain validation errors. Please check the highlighted inputs.",
  INTERNAL_ERROR:
    "An internal server error occurred. Please try again shortly.",
  SERVICE_UNAVAILABLE:
    "The linguistic service is temporarily unavailable. Please try again later.",
  NETWORK_ERROR:
    "Could not reach the backend server. Check your network connection.",
  CONFIG_ERROR:
    "The internal server proxy is not properly configured in this environment.",
  UNKNOWN_ERROR:
    "An unexpected error occurred while processing the request.",
};

const KNOWN_ERROR_CODE_SET = new Set<string>(Object.values(ErrorCode));

/**
 * Valida si una cadena desconocida pertenece al catálogo oficial de errores.
 */
export function isErrorCode(value: unknown): value is KnownErrorCode {
  return typeof value === "string" && KNOWN_ERROR_CODE_SET.has(value);
}

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
 * Error uniforme lanzado por el cliente HTTP y servicios del frontend.
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

  /**
   * Indica si el usuario debe elegir un plan de suscripción antes de operar (HTTP 403).
   */
  public get isSubscriptionRequired(): boolean {
    return this.code === ErrorCode.SUBSCRIPTION_REQUIRED;
  }

  /**
   * Indica si se alcanzó un límite diario de cuota o moderación (HTTP 429).
   */
  public get isRateLimited(): boolean {
    return (
      this.status === 429 ||
      this.code === ErrorCode.READING_DAILY_LIMIT_REACHED ||
      this.code === ErrorCode.EXPLANATION_DAILY_LIMIT_REACHED ||
      this.code === ErrorCode.CATEGORY_DAILY_LIMIT_REACHED
    );
  }

  /**
   * Indica si el bloqueo corresponde a idioma no seleccionado o candado anual.
   */
  public get isLanguageBlocked(): boolean {
    return (
      this.code === ErrorCode.LANGUAGE_CHANGE_LOCKED ||
      this.code === ErrorCode.LANGUAGE_NOT_SELECTED ||
      this.code === ErrorCode.SUBSCRIPTION_LANGUAGE_NOT_ALLOWED
    );
  }
}
