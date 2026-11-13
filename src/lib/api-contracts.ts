import { type ApiResponse } from "@/lib/api-errors";

/**
 * Niveles de suscripción oficiales definidos en `dolynation-atl-back`.
 */
export const SUBSCRIPTION_TIERS = ["dolly", "dolly_plus", "dolly_pro"] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

/**
 * Idiomas de estudio oficiales soportados por la plataforma.
 */
export const SUPPORTED_LANGUAGE_IDS = ["es", "en", "fr", "it"] as const;
export type TargetLanguageCode = (typeof SUPPORTED_LANGUAGE_IDS)[number];

/**
 * Catálogo base de categorías predefinidas en `dolynation-atl-back`.
 */
export const PREDEFINED_READING_CATEGORIES = [
  "technology",
  "history",
  "education",
  "programming",
  "culture",
  "pop_culture",
] as const;

export const READING_DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type ReadingDifficulty = (typeof READING_DIFFICULTIES)[number];

export const READING_TEXT_SIZES = ["short", "medium", "long"] as const;
export type ReadingSize = (typeof READING_TEXT_SIZES)[number];

export const READING_CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CefrLevel = (typeof READING_CEFR_LEVELS)[number];

/**
 * Parámetros de consulta serializables para endpoints GET.
 */
export type QueryParams = Record<
  string,
  string | number | boolean | undefined | null
>;

/**
 * Opciones compartidas por el transporte HTTP del navegador (`/api/v1/*`)
 * y el transporte directo para Server Components (`BACKEND_INTERNAL_URL`).
 */
export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  query?: QueryParams;
  body?: unknown;
  accessToken?: string | null;
  skipAuth?: boolean;
  _isRetryAfterRefresh?: boolean;
  timeoutMs?: number;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

/**
 * Contrato uniforme de transporte consumido por todas las fábricas de servicios.
 */
export interface ApiTransport {
  request<T>(
    path: string,
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<T>>;
  get<T>(
    path: string,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ): Promise<ApiResponse<T>>;
  post<T>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ): Promise<ApiResponse<T>>;
  put<T>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ): Promise<ApiResponse<T>>;
  patch<T>(
    path: string,
    body?: unknown,
    options?: Omit<ApiRequestOptions, "method" | "body">,
  ): Promise<ApiResponse<T>>;
  delete<T>(
    path: string,
    options?: Omit<ApiRequestOptions, "method">,
  ): Promise<ApiResponse<T>>;
}

// ============================================================================
// Autenticación (`/auth`)
// ============================================================================

/** Cantidad mínima de categorías temáticas requeridas para configurar el perfil y generar lecturas. */
export const MIN_USER_CATEGORIES = 3;

export interface AuthUser {
  id: number;
  email: string;
  fullName: string | null;
  subscriptionTier: SubscriptionTier | null;
  currentStreak: number;
  lastStreakDate: string | null;
  emailVerifiedAt: string | null;
  locale?: string;
  createdAt: string;
}

/**
 * En modo BFF seguro, el proxy almacena los JWT en cookies `HttpOnly` y redacta
 * las cadenas secretas antes de devolver la respuesta al navegador.
 */
export interface AuthSessionPayload {
  user: AuthUser;
  authenticated?: boolean;
  expiresIn?: number;
  emailVerificationRequired?: boolean;
}

export interface RefreshSessionResponse {
  authenticated: boolean;
  expiresIn?: number;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  locale?: "es" | "en";
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshTokenInput {
  refreshToken?: string;
}

export interface VerifyEmailInput {
  token: string;
}

export interface VerifyEmailResponse {
  emailVerified: boolean;
  user: AuthUser;
  authenticated?: boolean;
  expiresIn?: number;
}

export interface ResendVerificationInput {
  email: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface EmailSentResponse {
  emailSent: boolean;
}

// ============================================================================
// Usuario (`/user`)
// ============================================================================

export interface UserProfile extends AuthUser {
  selectedLanguages: TargetLanguageCode[];
}

export interface UpdateProfileInput {
  fullName?: string;
}

export interface StreakQuery {
  days: number;
}

export interface StreakResponse {
  days: number[];
  count: number;
}

// ============================================================================
// Suscripciones (`/subscriptions`, `/user/subscription`)
// ============================================================================

export interface SubscriptionPlanItem {
  id: SubscriptionTier;
  name: string;
  description: string;
  maxCategories: number | null;
  maxLanguages: number;
  allowedLanguages: TargetLanguageCode[];
  dailyReadingsLimit: number | null;
  dailyQuestionsLimit: number | null;
}

export interface SubscriptionUsage {
  categoriesCount: number;
  categoriesLimit: number | null;
  languagesCount: number;
  languagesLimit: number | null;
  readingsCreatedToday: number;
  readingsLimit: number | null;
  readingsRemainingToday: number | null;
  questionsAskedToday: number;
  questionsLimit: number | null;
  questionsRemainingToday: number | null;
}

export interface UserSubscriptionResponse {
  hasSubscription: boolean;
  tier: SubscriptionTier | null;
  plan: SubscriptionPlanItem | null;
  usage: SubscriptionUsage;
}

export interface SelectSubscriptionInput {
  tier: SubscriptionTier;
}

// ============================================================================
// Configuración (`/settings`)
// ============================================================================

export interface CatalogItem {
  id: string;
  name: string;
}

export interface CategoriesSettings {
  catalog: CatalogItem[];
  selected: string[];
}

export interface UpdateCategoriesInput {
  categories: string[];
}

export interface LanguagesSettings {
  catalog: { id: TargetLanguageCode; name: string }[];
  selected: TargetLanguageCode[];
  active: TargetLanguageCode[];
  maxLanguages: number;
  canChangeFree: boolean;
  nextFreeChangeAt: string | null;
  lastLanguageChangeAt: string | null;
  languageChangeCredits: number;
}

export interface UpdateLanguagesInput {
  languages: TargetLanguageCode[];
}

// ============================================================================
// Lecturas, Contenido y Evaluación (`/readings`, `/content`, `/evaluation`)
// ============================================================================

export interface ReadingSubcategory {
  id: string;
  name: string;
}

export interface ReadingCategoryOption {
  id: string;
  name: string;
  subcategories: ReadingSubcategory[];
  isCustom?: boolean;
}

export interface ReadingSizeOption {
  id: ReadingSize;
  label: string;
  wordRange: string;
  readingTime: string;
}

export interface ReadingOptionsResponse {
  categories: ReadingCategoryOption[];
  difficulties: ReadingDifficulty[];
  sizes: ReadingSizeOption[];
  cefrLevels: CefrLevel[];
}

export interface ReadingDto {
  id: number;
  userId: number;
  title: string;
  description: string;
  content: string;
  category: string | null;
  difficulty: ReadingDifficulty | null;
  language: TargetLanguageCode;
  wordCount: number | null;
  status: "pending" | "completed";
  score: number | null;
  feedback: string | null;
  userResponse: string | null;
  passed: boolean | null;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface GenerateReadingInput {
  category: string;
  language: TargetLanguageCode;
  difficulty?: ReadingDifficulty;
  size?: ReadingSize;
}

export interface GenerateContentInput {
  language: TargetLanguageCode;
  category?: string;
  difficulty?: ReadingDifficulty;
  size?: ReadingSize;
}

export interface EvaluateReadingInput {
  userResponse: string;
}

export interface SubmitEvaluationInput {
  readingId: number;
  userResponse: string;
}

export interface EvaluationResultDto {
  score: number;
  passed: boolean;
  feedback: string;
  userResponse: string;
  reading: ReadingDto;
}

export type ExplanationEntryType = "word" | "phrase";

export interface WordBreakdownItem {
  token: string;
  lemma: string;
  partOfSpeech: string;
  literalDefinition: string;
  roleInPhrase?: string;
}

export interface AlternativeExpressionItem {
  expression: string;
  register?: string;
  note: string;
}

export interface UsageContextItem {
  contextLabel: string;
  explanation: string;
  example: string;
}

export interface CreateExplanationInput {
  word: string;
  context?: string;
  forceRefresh?: boolean;
}

export interface GlossaryEntryDto {
  id: number;
  readingId: number;
  readingTitle: string;
  word: string;
  normalizedWord: string;
  entryType: ExplanationEntryType;
  language: TargetLanguageCode;
  difficulty: ReadingDifficulty;
  context: string | null;
  literalMeaning: string | null;
  explanation: string;
  wordBreakdown: WordBreakdownItem[];
  otherWaysToSay: AlternativeExpressionItem[];
  otherContexts: UsageContextItem[];
  isSaved: boolean;
  savedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GlossaryQuery extends QueryParams {
  entryType?: ExplanationEntryType;
  language?: TargetLanguageCode;
  savedOnly?: boolean;
  readingId?: number;
  search?: string;
}

export interface ToggleGlossarySaveInput {
  isSaved: boolean;
}

export interface ExplanationResultDto {
  id?: number | null;
  word: string;
  entryType: ExplanationEntryType;
  language: TargetLanguageCode;
  difficulty: ReadingDifficulty;
  literalMeaning: string | null;
  explanation: string;
  wordBreakdown: WordBreakdownItem[];
  otherWaysToSay: AlternativeExpressionItem[];
  otherContexts: UsageContextItem[];
  isSaved: boolean;
  cached: boolean;
  reading: ReadingDto;
}

// ============================================================================
// Historial (`/history`)
// ============================================================================

export interface HistoryReadingsSummary {
  total: number;
  pending: number;
  completed: number;
  passed: number;
  averageScore: number | null;
}

export interface HistoryScoreEntry {
  readingId: number;
  title: string;
  score: number | null;
  passed: boolean | null;
  evaluatedAt: string | null;
}

export interface HistorySummary {
  readings: HistoryReadingsSummary;
  recentScores: HistoryScoreEntry[];
  wordsLookedUp: number;
}

// ============================================================================
// Inteligencia Artificial (`/ia`)
// ============================================================================

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequestInput {
  messages: ChatMessage[];
  systemPrompt?: string;
}

export interface ChatResponse {
  text: string;
}

// ============================================================================
// Administración (`/admin`)
// ============================================================================

export interface AdminCategory {
  id: string;
  name: string;
  subcategories: string[];
}

export interface AdminUserRow {
  id: number;
  email: string;
  fullName: string | null;
  createdAt: string;
}

// ============================================================================
// Salud y Versión del Sistema (`/health`, `/version`)
// ============================================================================

export interface HealthIndicator {
  status: "up" | "down";
  [key: string]: unknown;
}

export interface HealthCheckResult {
  status: "up" | "down";
  info: Record<string, HealthIndicator>;
  error: Record<string, Record<string, unknown>> | null;
  details?: Record<string, HealthIndicator>;
}

export interface AppVersionInfo {
  appVersion: string;
  component: string;
  version: string;
  commit: string;
  builtAt: string;
}
