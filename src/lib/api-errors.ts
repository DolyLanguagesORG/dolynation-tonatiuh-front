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

  // Solicitudes de acceso y lista de espera (4xx)
  ACCESS_REQUEST_REQUIRED: "ACCESS_REQUEST_REQUIRED",
  ACCESS_REQUESTS_DISABLED: "ACCESS_REQUESTS_DISABLED",
  ACCESS_REQUEST_ALREADY_PENDING: "ACCESS_REQUEST_ALREADY_PENDING",
  ACCESS_REQUEST_ALREADY_REVIEWED: "ACCESS_REQUEST_ALREADY_REVIEWED",

  // Validación (4xx)
  VALIDATION_ERROR: "VALIDATION_ERROR",

  // Alta demanda (429)
  AI_RATE_LIMITED: "AI_RATE_LIMITED",

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
    "El correo o la contraseña no son correctos. Verifica tus datos e intenta de nuevo.",
  AUTH_TOKEN_EXPIRED:
    "Tu sesión ha expirado. Inicia sesión nuevamente para continuar.",
  AUTH_TOKEN_INVALID:
    "Tu sesión actual ya no es válida. Inicia sesión nuevamente para continuar.",
  AUTH_EMAIL_ALREADY_EXISTS:
    "Ya existe una cuenta registrada con este correo electrónico.",
  AUTH_PASSWORD_TOO_WEAK:
    "La contraseña no cumple con los requisitos mínimos de seguridad.",
  AUTH_UNAUTHORIZED:
    "Necesitas iniciar sesión para acceder a esta sección.",
  AUTH_EMAIL_NOT_VERIFIED:
    "Debes confirmar tu correo electrónico antes de poder continuar.",
  AUTH_EMAIL_TOKEN_INVALID:
    "Este enlace no es válido, ya fue utilizado o expiró. Solicita uno nuevo.",
  RESOURCE_NOT_FOUND:
    "No encontramos el contenido solicitado o ya no está disponible.",
  RESOURCE_FORBIDDEN:
    "No tienes permisos para realizar esta acción.",
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
    "El plan de suscripción seleccionado no es válido. Elige Dolly, Dolly Plus o Dolly Pro.",
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
    "Una o más categorías propuestas no superaron nuestras políticas de contenido.",
  CATEGORY_DAILY_LIMIT_REACHED:
    "Alcanzaste el límite diario para evaluar o añadir nuevas categorías personalizadas. Intenta mañana.",
  ACCESS_REQUEST_REQUIRED:
    "El acceso manual está activo: debes enviar una solicitud y esperar la aprobación del equipo administrador.",
  ACCESS_REQUESTS_DISABLED:
    "Las solicitudes de acceso no están disponibles en este momento.",
  ACCESS_REQUEST_ALREADY_PENDING:
    "Ya tienes una solicitud pendiente en revisión para este tipo de acceso.",
  ACCESS_REQUEST_ALREADY_REVIEWED:
    "Esta solicitud de acceso ya fue revisada anteriormente.",
  VALIDATION_ERROR:
    "Algunos campos del formulario contienen errores. Revisa los datos marcados.",
  AI_RATE_LIMITED:
    "Estamos atendiendo muchas solicitudes en este momento. Intenta nuevamente en unos minutos.",
  INTERNAL_ERROR:
    "Ocurrió un problema inesperado. Por favor, intenta nuevamente en unos momentos.",
  SERVICE_UNAVAILABLE:
    "El servicio no está disponible temporalmente. Por favor, intenta más tarde.",
  NETWORK_ERROR:
    "No pudimos conectarnos en este momento. Verifica tu conexión a internet e intenta de nuevo.",
  CONFIG_ERROR:
    "El servicio no está disponible en este momento. Por favor, intenta más tarde.",
  UNKNOWN_ERROR:
    "No pudimos completar tu solicitud en este momento. Intenta nuevamente.",
};

const ERROR_MESSAGES_EN: Record<KnownErrorCode, string> = {
  AUTH_INVALID_CREDENTIALS:
    "Incorrect email or password. Please check your details and try again.",
  AUTH_TOKEN_EXPIRED:
    "Your session has expired. Please sign in again to continue.",
  AUTH_TOKEN_INVALID:
    "Your current session is no longer valid. Please sign in again.",
  AUTH_EMAIL_ALREADY_EXISTS:
    "An account with this email address is already registered.",
  AUTH_PASSWORD_TOO_WEAK:
    "The password does not meet the minimum security requirements.",
  AUTH_UNAUTHORIZED:
    "You must be signed in to access this section.",
  AUTH_EMAIL_NOT_VERIFIED:
    "Please confirm your email address before continuing.",
  AUTH_EMAIL_TOKEN_INVALID:
    "This link is invalid, has already been used, or has expired. Please request a new one.",
  RESOURCE_NOT_FOUND:
    "The requested content could not be found or is no longer available.",
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
    "One or more custom categories did not meet our content guidelines.",
  CATEGORY_DAILY_LIMIT_REACHED:
    "Daily limit for adding or evaluating new custom categories has been reached. Try again tomorrow.",
  ACCESS_REQUEST_REQUIRED:
    "Waitlist review is active: submit an access request and wait for admin approval.",
  ACCESS_REQUESTS_DISABLED:
    "Access requests are not available at this time.",
  ACCESS_REQUEST_ALREADY_PENDING:
    "You already have a pending access request of this type awaiting review.",
  ACCESS_REQUEST_ALREADY_REVIEWED:
    "This access request has already been reviewed.",
  VALIDATION_ERROR:
    "Some form fields contain validation errors. Please check the highlighted inputs.",
  AI_RATE_LIMITED:
    "We are handling a high volume of requests right now. Please try again in a few minutes.",
  INTERNAL_ERROR:
    "Something unexpected happened. Please try again shortly.",
  SERVICE_UNAVAILABLE:
    "The service is temporarily unavailable. Please try again later.",
  NETWORK_ERROR:
    "Could not connect right now. Please check your internet connection and try again.",
  CONFIG_ERROR:
    "The service is currently unavailable. Please try again later.",
  UNKNOWN_ERROR:
    "We could not complete your request right now. Please try again.",
};

const ERROR_MESSAGES_FR: Record<KnownErrorCode, string> = {
  AUTH_INVALID_CREDENTIALS:
    "L'adresse e-mail ou le mot de passe est incorrect. Vérifiez vos informations et réessayez.",
  AUTH_TOKEN_EXPIRED:
    "Votre session a expiré. Veuillez vous reconnecter pour continuer.",
  AUTH_TOKEN_INVALID:
    "Votre session actuelle n'est plus valide. Veuillez vous reconnecter.",
  AUTH_EMAIL_ALREADY_EXISTS:
    "Un compte est déjà enregistré avec cette adresse e-mail.",
  AUTH_PASSWORD_TOO_WEAK:
    "Le mot de passe ne respecte pas les exigences minimales de sécurité.",
  AUTH_UNAUTHORIZED:
    "Vous devez vous connecter pour accéder à cette section.",
  AUTH_EMAIL_NOT_VERIFIED:
    "Veuillez confirmer votre adresse e-mail avant de continuer.",
  AUTH_EMAIL_TOKEN_INVALID:
    "Ce lien n'est pas valide, a déjà été utilisé ou a expiré. Demandez-en un nouveau.",
  RESOURCE_NOT_FOUND:
    "Le contenu demandé est introuvable ou n'est plus disponible.",
  RESOURCE_FORBIDDEN:
    "Vous ne disposez pas des autorisations nécessaires pour effectuer cette action.",
  READING_PENDING_LIMIT_REACHED:
    "Vous avez atteint la limite de lectures en attente. Terminez vos évaluations actives avant de générer un nouveau texte.",
  READING_ALREADY_EVALUATED:
    "Cette lecture a déjà été évaluée et sa note est clôturée.",
  READING_DAILY_LIMIT_REACHED:
    "Vous avez atteint la limite quotidienne de génération de lectures pour votre forfait actuel.",
  EXPLANATION_DAILY_LIMIT_REACHED:
    "Vous avez atteint la limite quotidienne d'aides et d'explications lexicales pour votre forfait actuel.",
  SUBSCRIPTION_REQUIRED:
    "Vous devez sélectionner un abonnement actif avant d'utiliser les outils d'étude.",
  SUBSCRIPTION_INVALID_TIER:
    "Le forfait d'abonnement indiqué n'est pas valide. Choisissez Dolly, Dolly Plus ou Dolly Pro.",
  SUBSCRIPTION_CATEGORY_LIMIT_EXCEEDED:
    "Vous avez dépassé le nombre maximal de catégories autorisé par votre abonnement.",
  SUBSCRIPTION_LANGUAGE_LIMIT_EXCEEDED:
    "Vous avez dépassé le nombre maximal de langues simultanées autorisé par votre forfait.",
  SUBSCRIPTION_LANGUAGE_NOT_ALLOWED:
    "La langue demandée n'est pas activée dans les emplacements de votre abonnement actuel.",
  LANGUAGE_NOT_SELECTED:
    "Vous devez sélectionner au moins une langue d'étude dans vos préférences avant de générer des lectures.",
  LANGUAGE_CHANGE_LOCKED:
    "Votre sélection de langues est verrouillée. Vous pouvez la modifier une fois par an ou débloquer un changement immédiat.",
  CATEGORY_MODERATION_REJECTED:
    "Une ou plusieurs catégories proposées ne respectent pas nos règles de contenu.",
  CATEGORY_DAILY_LIMIT_REACHED:
    "Limite quotidienne atteinte pour évaluer ou ajouter de nouvelles catégories. Réessayez demain.",
  ACCESS_REQUEST_REQUIRED:
    "La liste d'attente est active : soumettez une demande d'accès et attendez la validation d'un administrateur.",
  ACCESS_REQUESTS_DISABLED:
    "Les demandes d'accès ne sont pas disponibles pour le moment.",
  ACCESS_REQUEST_ALREADY_PENDING:
    "Vous avez déjà une demande d'accès de ce type en attente de validation.",
  ACCESS_REQUEST_ALREADY_REVIEWED:
    "Cette demande d'accès a déjà été examinée.",
  VALIDATION_ERROR:
    "Certains champs du formulaire contiennent des erreurs. Vérifiez les données saisies.",
  AI_RATE_LIMITED:
    "Nous recevons beaucoup de demandes en ce moment. Veuillez réessayer dans quelques minutes.",
  INTERNAL_ERROR:
    "Un problème inattendu est survenu. Veuillez réessayer dans quelques instants.",
  SERVICE_UNAVAILABLE:
    "Le service est temporairement indisponible. Veuillez réessayer plus tard.",
  NETWORK_ERROR:
    "Impossible d'établir la connexion pour le moment. Vérifiez votre connexion internet et réessayez.",
  CONFIG_ERROR:
    "Le service est momentanément indisponible. Veuillez réessayer plus tard.",
  UNKNOWN_ERROR:
    "Nous n'avons pas pu traiter votre demande pour le moment. Veuillez réessayer.",
};

const ERROR_MESSAGES_IT: Record<KnownErrorCode, string> = {
  AUTH_INVALID_CREDENTIALS:
    "L'e-mail o la password non sono corretti. Verifica i dati inseriti e riprova.",
  AUTH_TOKEN_EXPIRED:
    "La tua sessione è scaduta. Accedi nuovamente per continuare.",
  AUTH_TOKEN_INVALID:
    "La tua sessione attuale non è più valida. Accedi di nuovo.",
  AUTH_EMAIL_ALREADY_EXISTS:
    "Esiste già un account registrato con questo indirizzo e-mail.",
  AUTH_PASSWORD_TOO_WEAK:
    "La password non soddisfa i requisiti minimi di sicurezza.",
  AUTH_UNAUTHORIZED:
    "Devi accedere per poter consultare questa sezione.",
  AUTH_EMAIL_NOT_VERIFIED:
    "Conferma il tuo indirizzo e-mail prima di continuare.",
  AUTH_EMAIL_TOKEN_INVALID:
    "Questo link non è valido, è già stato utilizzato o è scaduto. Richiedine uno nuovo.",
  RESOURCE_NOT_FOUND:
    "Il contenuto richiesto non è stato trovato o non è più disponibile.",
  RESOURCE_FORBIDDEN:
    "Non disponi dei permessi necessari per eseguire questa operazione.",
  READING_PENDING_LIMIT_REACHED:
    "Hai raggiunto il limite di letture in sospeso. Completa le valutazioni attive prima di generare un nuovo testo.",
  READING_ALREADY_EVALUATED:
    "Questa lettura è già stata valutata e il risultato è definitivo.",
  READING_DAILY_LIMIT_REACHED:
    "Hai raggiunto il limite giornaliero di generazione di letture previsto dal tuo piano.",
  EXPLANATION_DAILY_LIMIT_REACHED:
    "Hai raggiunto il limite giornaliero di spiegazioni e aiuti lessicali del tuo piano attuale.",
  SUBSCRIPTION_REQUIRED:
    "È necessario un piano di abbonamento attivo prima di accedere agli strumenti di studio.",
  SUBSCRIPTION_INVALID_TIER:
    "Il piano di abbonamento selezionato non è valido. Scegli Dolly, Dolly Plus o Dolly Pro.",
  SUBSCRIPTION_CATEGORY_LIMIT_EXCEEDED:
    "Hai superato il numero massimo di categorie consentito dal tuo abbonamento.",
  SUBSCRIPTION_LANGUAGE_LIMIT_EXCEEDED:
    "Hai superato il numero massimo di lingue simultanee consentito dal tuo piano.",
  SUBSCRIPTION_LANGUAGE_NOT_ALLOWED:
    "La lingua richiesta non è abilitata tra quelle attive nel tuo piano.",
  LANGUAGE_NOT_SELECTED:
    "Devi selezionare almeno una lingua di studio nelle preferenze prima di generare letture.",
  LANGUAGE_CHANGE_LOCKED:
    "La selezione delle lingue è bloccata. Puoi modificarla una volta all'anno o sbloccare una modifica immediata.",
  CATEGORY_MODERATION_REJECTED:
    "Una o più categorie inserite non rispettano le nostre linee guida sui contenuti.",
  CATEGORY_DAILY_LIMIT_REACHED:
    "Hai raggiunto il limite giornaliero per valutare o aggiungere nuove categorie. Riprova domani.",
  ACCESS_REQUEST_REQUIRED:
    "La lista d'attesa è attiva: invia una richiesta di accesso e attendi l'approvazione dell'amministratore.",
  ACCESS_REQUESTS_DISABLED:
    "Le richieste di accesso non sono disponibili al momento.",
  ACCESS_REQUEST_ALREADY_PENDING:
    "Hai già una richiesta di accesso di questo tipo in attesa di revisione.",
  ACCESS_REQUEST_ALREADY_REVIEWED:
    "Questa richiesta di accesso è già stata esaminata.",
  VALIDATION_ERROR:
    "Alcuni campi del modulo contengono errori. Controlla i dati evidenziati.",
  AI_RATE_LIMITED:
    "Stiamo gestendo molte richieste in questo momento. Riprova tra qualche minuto.",
  INTERNAL_ERROR:
    "Si è verificato un problema imprevisto. Riprova tra qualche istante.",
  SERVICE_UNAVAILABLE:
    "Il servizio è temporaneamente non disponibile. Riprova più tardi.",
  NETWORK_ERROR:
    "Impossibile connettersi al momento. Verifica la tua connessione internet e riprova.",
  CONFIG_ERROR:
    "Il servizio non è al momento disponibile. Riprova più tardi.",
  UNKNOWN_ERROR:
    "Non è stato possibile completare la richiesta al momento. Riprova.",
};

export type ErrorMessageLanguage = "es" | "en" | "fr" | "it";

const ERROR_MESSAGES_BY_LANGUAGE: Record<
  ErrorMessageLanguage,
  Record<KnownErrorCode, string>
> = {
  es: ERROR_MESSAGES_ES,
  en: ERROR_MESSAGES_EN,
  fr: ERROR_MESSAGES_FR,
  it: ERROR_MESSAGES_IT,
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
  locale: ErrorMessageLanguage = "es",
): string {
  const dictionary = ERROR_MESSAGES_BY_LANGUAGE[locale] ?? ERROR_MESSAGES_ES;
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
export interface RejectedCategoryDetail {
  category: string;
  layer?: string;
  reason?: string;
}

export function extractRejectedCategories(
  details?: Record<string, unknown>,
): RejectedCategoryDetail[] {
  const raw = details?.rejected;
  if (!Array.isArray(raw)) {
    return [];
  }

  const seen = new Set<string>();
  const items: RejectedCategoryDetail[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    if (typeof record.category !== "string") continue;
    const category = record.category.trim();
    if (!category) continue;
    const key = category.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    items.push({
      category,
      ...(typeof record.layer === "string" && record.layer.trim()
        ? { layer: record.layer.trim() }
        : {}),
      ...(typeof record.reason === "string" && record.reason.trim()
        ? { reason: record.reason.trim() }
        : {}),
    });
  }

  return items;
}

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
   * Extrae las categorías rechazadas cuando el backend adjunta `details.rejected`.
   */
  public getRejectedCategories(): RejectedCategoryDetail[] {
    return extractRejectedCategories(this.details);
  }

  /**
   * Devuelve el mensaje localizado seguro para mostrar en componentes `Alert`, formularios o toasts.
   */
  public getUserMessage(locale: ErrorMessageLanguage = "es"): string {
    const base = resolveErrorMessage(this.code, locale);
    if (this.code === ErrorCode.CATEGORY_MODERATION_REJECTED) {
      const rejected = this.getRejectedCategories();
      if (rejected.length > 0) {
        const quoted = rejected.map((item) => `"${item.category}"`).join(", ");
        const prefixes: Record<ErrorMessageLanguage, string> = {
          es: `Categoría(s) rechazada(s): ${quoted}.`,
          en: `Rejected category(ies): ${quoted}.`,
          fr: `Catégorie(s) refusée(s) : ${quoted}.`,
          it: `Categoria/e rifiutata/e: ${quoted}.`,
        };
        return `${base} ${prefixes[locale] ?? prefixes.es}`;
      }
    }
    return base;
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
