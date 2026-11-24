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

export const READING_DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type ReadingDifficulty = (typeof READING_DIFFICULTIES)[number];

export const READING_TEXT_SIZES = ["short", "medium", "long"] as const;
export type ReadingSize = (typeof READING_TEXT_SIZES)[number];

export const READING_CEFR_LEVELS = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
] as const;
export type CefrLevel = (typeof READING_CEFR_LEVELS)[number];

/**
 * Parámetros de consulta serializables para endpoints GET.
 */
export type QueryParams = Record<
  string,
  string | number | boolean | undefined | null
>;

/** Cabecera HTTP estándar usada para enviar el token anti-bot de Cloudflare Turnstile. */
export const CAPTCHA_TOKEN_HEADER = "x-captcha-token";

export type CaptchaProvider = "disabled" | "turnstile";
export type CaptchaAppearance = "interaction-only" | "always" | "execute";
export type CaptchaAction =
  | "register"
  | "login"
  | "forgot_password"
  | "resend_verification"
  | "reset_password"
  | "billing_checkout"
  | "billing_setup_intent"
  | "subscription_select"
  | "access_request"
  | "reading_generate"
  | "ia_chat"
  | (string & {});

export interface CaptchaConfigResponse {
  enabled: boolean;
  provider: CaptchaProvider;
  siteKey: string | null;
  appearance: CaptchaAppearance;
}

/**
 * Opciones compartidas por el transporte HTTP del navegador (`/api/v1/*`)
 * y el transporte directo para Server Components (`BACKEND_INTERNAL_URL`).
 */
export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  query?: QueryParams;
  body?: unknown;
  accessToken?: string | null;
  captchaToken?: string | null;
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

export type UserRole = "student" | "admin";

export interface AuthUser {
  id: number;
  email: string;
  fullName: string | null;
  role?: UserRole;
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

export type AuthSessionStatus = "loading" | "authenticated" | "unauthenticated";

/**
 * Snapshot inicial serializable de sesión resuelto en SSR (`RootLayout`) para
 * hidratar `AuthProvider` sin parpadeos visuales de autenticación en el cliente.
 */
export interface InitialAuthState {
  status: AuthSessionStatus;
  user: AuthUser | null;
  subscription: UserSubscriptionResponse | null;
  languagesSettings: LanguagesSettings | null;
  categoriesSettings: CategoriesSettings | null;
  accessRequests: MyAccessRequestsResponse | null;
  subscriptionRequired: boolean;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  locale?: TargetLanguageCode;
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

export type OAuthProviderId = "google" | "microsoft";

export interface OAuthProviderConfig {
  provider: OAuthProviderId;
  enabled: boolean;
  authorizationEndpoint?: string;
  clientId?: string;
  redirectUri?: string;
  scopes?: string[];
}

export interface OAuthProvidersResponse {
  providers: OAuthProviderConfig[];
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

export interface SubscriptionPlanPricing {
  isFree: boolean;
  checkoutRequired: boolean;
  amountCents: number | null;
  currency: string;
  interval: string | null;
}

export interface SubscriptionPlanItem {
  id: SubscriptionTier;
  name: string;
  description: string;
  maxCategories: number | null;
  maxLanguages: number;
  allowedLanguages: TargetLanguageCode[];
  dailyReadingsLimit: number | null;
  dailyQuestionsLimit: number | null;
  pricing?: SubscriptionPlanPricing;
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

export type BillingProvider = "manual" | "stripe";
export type BillingUiMode = "custom" | "hosted";
export type PaidSubscriptionTier = "dolly_plus" | "dolly_pro";

export interface UserBillingInfo {
  provider: BillingProvider;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface UserSubscriptionResponse {
  hasSubscription: boolean;
  tier: SubscriptionTier | null;
  plan: SubscriptionPlanItem | null;
  usage: SubscriptionUsage;
  billing?: UserBillingInfo | null;
}

export interface SelectSubscriptionInput {
  tier: SubscriptionTier;
}

// ============================================================================
// Facturación y Pagos (`/billing`)
// ============================================================================

export interface BillingPlanPricing {
  tier: SubscriptionTier;
  isFree: boolean;
  checkoutRequired: boolean;
  amountCents: number | null;
  currency: string;
  interval: string | null;
}

export interface BillingOneTimePricing {
  checkoutRequired: boolean;
  amountCents: number | null;
  currency: string;
}

export interface BillingConfigResponse {
  provider: BillingProvider;
  publishableKey: string | null;
  currency: string;
  uiMode: BillingUiMode;
  plans: BillingPlanPricing[];
  languageUnlock: BillingOneTimePricing;
}

export interface CreateSubscriptionCheckoutInput {
  tier: PaidSubscriptionTier;
  uiMode?: BillingUiMode;
}

export interface CreateLanguageUnlockCheckoutInput {
  uiMode?: BillingUiMode;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  clientSecret: string | null;
  url: string | null;
  publishableKey: string;
  uiMode: BillingUiMode;
  tier: PaidSubscriptionTier | null;
}

export interface SetupIntentResponse {
  setupIntentId: string;
  clientSecret: string;
  publishableKey: string;
}

export interface SetDefaultPaymentMethodInput {
  paymentMethodId: string;
}

export interface ChangeSubscriptionPlanInput {
  tier: PaidSubscriptionTier;
}

export interface BillingPaymentMethodSummary {
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
}

export interface BillingSubscriptionSummary {
  status: string;
  tier: SubscriptionTier;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  paymentMethod: BillingPaymentMethodSummary | null;
}

export interface BillingRecentPayment {
  id: number;
  kind: string;
  tier: SubscriptionTier | null;
  amountCents: number;
  currency: string;
  status: string;
  fulfilledAt: string | null;
  createdAt: string;
}

export interface BillingStatusResponse {
  provider: BillingProvider;
  tier: SubscriptionTier | null;
  subscription: BillingSubscriptionSummary | null;
  recentPayments: BillingRecentPayment[];
}

export interface BillingInvoice {
  id: string;
  number: string | null;
  status: string | null;
  amountPaidCents: number;
  amountDueCents: number;
  currency: string;
  createdAt: string;
  invoicePdfUrl: string | null;
  hostedInvoiceUrl: string | null;
}

export interface BillingPortalResponse {
  url: string;
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

export type ReadingOriginType = "personal" | "friend_copy" | "friend_streak";

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
  originType?: ReadingOriginType;
  sourceReadingId?: number | null;
  friendStreakDayId?: number | null;
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

/** Cuerpo de `POST /readings/:id/explanations/deep`; el prompt lo arma el backend. */
export interface DeepExplanationInput {
  word: string;
  context?: string;
}

/** Respuesta de `POST /readings/:id/explanations/deep`. */
export interface DeepExplanationResultDto {
  text: string;
}

export interface GlossaryEntryDto {
  id: number;
  readingId: number;
  readingTitle: string;
  readingAvailable: boolean;
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
// Solicitudes de Acceso y Lista de Espera (`/access-requests`)
// ============================================================================

export type AccessRequestType = "subscription" | "language_unlock";
export type AccessRequestStatus =
  "pending" | "approved" | "rejected" | "cancelled";

export interface AccessRequestItem {
  id: number;
  userId: number;
  requestType: AccessRequestType;
  requestedTier: SubscriptionTier | null;
  currentTier: SubscriptionTier | null;
  userMessage: string | null;
  status: AccessRequestStatus;
  rejectionReason: string | null;
  reviewedByUserId: number | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MyAccessRequestsResponse {
  enabled: boolean;
  requests: AccessRequestItem[];
  pendingSubscriptionRequest: AccessRequestItem | null;
  pendingLanguageUnlockRequest: AccessRequestItem | null;
}

export interface CreateAccessRequestInput {
  type: AccessRequestType;
  tier?: SubscriptionTier;
  message?: string;
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
  role: UserRole;
  subscriptionTier: SubscriptionTier | null;
  emailVerifiedAt: string | null;
  locale: string;
  pendingRequestsCount: number;
  createdAt: string;
}

export interface AdminUsersQuery extends QueryParams {
  search?: string;
  role?: UserRole;
}

export interface AdminAccessRequest {
  id: number;
  userId: number;
  userEmail: string;
  userFullName: string | null;
  userLocale: string;
  userEmailVerifiedAt: string | null;
  userCurrentTier: SubscriptionTier | null;
  requestType: AccessRequestType;
  requestedTier: SubscriptionTier | null;
  currentTier: SubscriptionTier | null;
  userMessage: string | null;
  status: AccessRequestStatus;
  rejectionReason: string | null;
  reviewedByUserId: number | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRequestsQuery extends QueryParams {
  status?: AccessRequestStatus;
  type?: AccessRequestType;
  search?: string;
}

export interface ApproveAccessRequestInput {
  note?: string;
}

export interface RejectAccessRequestInput {
  reason: string;
}

export interface ReviewAccessRequestResponse {
  request: AdminAccessRequest;
  emailSent: boolean;
}

export interface AdminUserDetail {
  user: AdminUserRow;
  requests: AdminAccessRequest[];
}

// ============================================================================
// Amistades, Invitaciones, Lecturas/Categorías de Amigos y Rachas (`/friends`)
// ============================================================================

export type FriendshipStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled";

export type FriendshipOrigin = "email" | "invite_link";

export type FriendStreakStatus =
  | "pending_partner"
  | "active"
  | "paused"
  | "ended";

export type FriendStreakDayStatus =
  | "pending"
  | "completed"
  | "missed"
  | "generation_failed";

export interface FriendActiveStreakBadgeDto {
  id: number;
  status: FriendStreakStatus;
  currentStreak: number;
  longestStreak: number;
  language: TargetLanguageCode;
  myCompletedToday?: boolean;
  partnerCompletedToday?: boolean;
  todayReadingId?: number | null;
}

export interface FriendSummaryDto {
  userId: number;
  friendshipId: number;
  fullName: string | null;
  email?: string | null;
  since: string;
  activeStreak?: FriendActiveStreakBadgeDto | null;
}

export interface FriendsPaginationQuery extends QueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface FriendsListResponseDto {
  items: FriendSummaryDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FriendRequestDto {
  id: number;
  status: FriendshipStatus;
  origin: FriendshipOrigin;
  direction?: "incoming" | "outgoing";
  requesterId: number;
  addresseeId: number;
  requesterName: string | null;
  requesterEmail?: string | null;
  addresseeName: string | null;
  addresseeEmail?: string | null;
  createdAt: string;
  respondedAt: string | null;
}

export interface CreateFriendRequestByEmailInput {
  email: string;
}

export interface FriendInviteLinkDto {
  id: number;
  token?: string;
  url?: string;
  maxUses: number | null;
  usesCount: number;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
}

export interface CreateFriendInviteLinkInput {
  maxUses?: number | null;
  expiresInDays?: number;
}

export interface FriendInviteLinkPreviewDto {
  inviterName: string;
  valid: boolean;
  expiresAt: string | null;
  alreadyFriends: boolean;
  isOwnLink?: boolean;
  reason?: "expired" | "revoked" | "exhausted" | "not_found" | null;
}

export interface AcceptFriendInviteLinkResponseDto {
  friendshipId: number;
  friendUserId: number;
  friendName: string | null;
  status: FriendshipStatus;
}

export interface BlockedUserDto {
  userId: number;
  fullName: string | null;
  email?: string | null;
  blockedAt: string;
}

/**
 * Vista privada de lectura de un amigo: nunca expone estado, calificación, respuesta ni feedback.
 */
export interface FriendReadingListItemDto {
  id: number;
  title: string;
  description: string;
  category: string | null;
  difficulty: ReadingDifficulty | null;
  language: TargetLanguageCode;
  wordCount: number | null;
  createdAt: string;
}

export interface FriendReadingDetailDto extends FriendReadingListItemDto {
  content: string;
}

export interface FriendReadingsListResponseDto {
  items: FriendReadingListItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StartFriendReadingResponseDto {
  readingId?: number;
  id?: number;
  reading?: ReadingDto;
  alreadyExisted?: boolean;
}

export interface FriendCategoriesDto {
  friendUserId: number;
  friendName: string | null;
  categories: string[];
  activeCategories?: string[];
  savedCategories?: string[];
}

export interface CopyFriendCategoriesInput {
  categories: string[];
}

export interface CopyFriendCategoriesResponseDto {
  copied: string[];
  activated: string[];
  savedOnly: string[];
  skipped: string[];
}

export interface FriendStreakDayDto {
  id: number;
  streakId: number;
  streakDate: string;
  category: string;
  status: FriendStreakDayStatus;
  myReadingId: number | null;
  myCompletedToday: boolean;
  partnerCompletedToday: boolean;
}

export interface FriendStreakDto {
  id: number;
  friendshipId: number;
  partnerUserId: number;
  partnerName: string | null;
  initiatedByUserId: number;
  isInitiator?: boolean;
  awaitingMyAcceptance?: boolean;
  status: FriendStreakStatus;
  myCategories: string[];
  partnerCategories: string[];
  categoryPool: string[];
  language: TargetLanguageCode;
  difficulty: ReadingDifficulty;
  size: ReadingSize;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  startedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  myCompletedToday: boolean;
  partnerCompletedToday: boolean;
  todayReadingId: number | null;
  todayCategory?: string | null;
  todayStatus?: FriendStreakDayStatus | null;
  today?: FriendStreakDayDto | null;
}

export interface ProposeFriendStreakInput {
  categories: string[];
  language: TargetLanguageCode;
  difficulty: ReadingDifficulty;
  size: ReadingSize;
}

export interface AcceptFriendStreakInput {
  categories: string[];
}

export interface UpdateFriendStreakCategoriesInput {
  categories: string[];
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
