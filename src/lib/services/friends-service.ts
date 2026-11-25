import {
  type ApiRequestOptions,
  type ApiTransport,
  type BlockedUserDto,
  type CopyFriendCategoriesInput,
  type CopyFriendCategoriesResponseDto,
  type CreatedFriendInviteLinkDto,
  type CreateFriendInviteLinkInput,
  type CreateFriendRequestByEmailInput,
  type FriendCategoryDto,
  type FriendInviteLinkDto,
  type FriendInviteLinkPreviewDto,
  type FriendReadingDto,
  type FriendReadingsQuery,
  type FriendshipDto,
  type FriendshipRequestDto,
  type FriendStreakDto,
  type FriendSummaryDto,
  type ProposeFriendStreakInput,
  type ReadingDto,
  type StartFriendReadingResponseDto,
  type UpdateFriendStreakCategoriesInput,
} from "@/lib/api-contracts";
import { type ApiResponse } from "@/lib/api-errors";
import { httpClient } from "@/lib/http-client";

export type FriendsRequestOptions = Omit<ApiRequestOptions, "method" | "body">;

const PENDING_INVITE_REDIRECT_KEY = "doly.pending_invite_redirect";
const INITIATED_STREAKS_STORAGE_KEY = "doly.initiated_friend_streaks";
const MAX_INITIATED_STREAKS = 50;
const FRIEND_INVITE_BASE_PATH = "/friends/invite";
const FRIEND_INVITE_PREFIX = `${FRIEND_INVITE_BASE_PATH}/`;

export interface NormalizedPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Pagina de forma segura un arreglo en memoria ajustando el número de página al rango válido.
 */
export function paginateItems<T>(
  items: readonly T[],
  page: number,
  limit: number,
): NormalizedPaginatedResult<T> {
  const safeLimit =
    Number.isFinite(limit) && limit >= 1 ? Math.floor(limit) : 12;
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const clampedPage = Math.min(
    totalPages,
    Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1),
  );
  const start = (clampedPage - 1) * safeLimit;
  return {
    items: items.slice(start, start + safeLimit),
    total,
    page: clampedPage,
    limit: safeLimit,
    totalPages,
  };
}

/**
 * Normaliza respuestas que pueden llegar como arreglo directo o envelope paginado `{ items, total, page, limit, totalPages }`.
 */
export function normalizePaginatedList<T>(
  payload:
    | T[]
    | {
        items: T[];
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
      }
    | null
    | undefined,
  fallbackLimit = 20,
): NormalizedPaginatedResult<T> {
  if (!payload) {
    return { items: [], total: 0, page: 1, limit: fallbackLimit, totalPages: 1 };
  }

  if (Array.isArray(payload)) {
    const total = payload.length;
    return {
      items: payload,
      total,
      page: 1,
      limit: Math.max(fallbackLimit, total || 1),
      totalPages: 1,
    };
  }

  const items = Array.isArray(payload.items) ? payload.items : [];
  const limit =
    typeof payload.limit === "number" && payload.limit > 0
      ? payload.limit
      : fallbackLimit;
  const total =
    typeof payload.total === "number" && payload.total >= 0
      ? payload.total
      : items.length;
  const page =
    typeof payload.page === "number" && payload.page >= 1 ? payload.page : 1;
  const totalPages =
    typeof payload.totalPages === "number" && payload.totalPages >= 1
      ? payload.totalPages
      : Math.max(1, Math.ceil(total / limit));

  return { items, total, page, limit, totalPages };
}

/**
 * Construye la ruta canónica relativa hacia `/friends/invite?token=...`, idéntica a la generada por el backend.
 */
export function buildFriendInvitePath(token: string): string {
  const cleanToken = encodeURIComponent(token.trim());
  return `${FRIEND_INVITE_BASE_PATH}?token=${cleanToken}`;
}

/**
 * Construye la URL pública compartible hacia `/friends/invite?token=...`.
 */
export function buildFriendInviteUrl(token: string, origin?: string): string {
  const path = buildFriendInvitePath(token);
  const resolvedOrigin =
    origin?.trim() ||
    (typeof window !== "undefined" ? window.location.origin : "");
  if (!resolvedOrigin) {
    return path;
  }
  return `${resolvedOrigin.replace(/\/+$/, "")}${path}`;
}

/**
 * Construye un enlace directo compatible con WhatsApp Web y app móvil.
 */
export function buildWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Extrae el ID de la lectura propia creada o reutilizada por `POST /friends/:friendUserId/readings/:readingId/start`.
 */
export function resolveStartedReadingId(
  payload: StartFriendReadingResponseDto | ReadingDto | null | undefined,
): number | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if ("readingId" in payload && typeof payload.readingId === "number") {
    return payload.readingId;
  }
  if (
    "reading" in payload &&
    payload.reading &&
    typeof payload.reading.id === "number"
  ) {
    return payload.reading.id;
  }
  if ("id" in payload && typeof payload.id === "number") {
    return payload.id;
  }

  return null;
}

/**
 * Valida que una ruta de redirección pertenezca exclusivamente a `/friends/invite?token=<token>`
 * o a la variante heredada `/friends/invite/<token>`.
 */
export function isValidInviteRedirectPath(
  path: string | null | undefined,
): path is string {
  if (!path || typeof path !== "string") {
    return false;
  }
  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return false;
  }
  try {
    const parsed = new URL(trimmed, "http://localhost");
    if (parsed.origin !== "http://localhost") {
      return false;
    }
    if (parsed.pathname === FRIEND_INVITE_BASE_PATH) {
      return Boolean(parsed.searchParams.get("token")?.trim());
    }
    if (parsed.pathname.startsWith(FRIEND_INVITE_PREFIX)) {
      const tokenSegment = parsed.pathname.slice(FRIEND_INVITE_PREFIX.length);
      return tokenSegment.trim().length > 0 && !tokenSegment.includes("/");
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Guarda temporalmente la ruta de invitación (`/friends/invite?token=<token>` o `/friends/invite/<token>`)
 * en `sessionStorage` para completarla automáticamente después de registrarse o elegir plan.
 */
export function savePendingInviteRedirect(path: string): void {
  if (typeof window === "undefined" || !isValidInviteRedirectPath(path)) {
    return;
  }
  try {
    window.sessionStorage.setItem(PENDING_INVITE_REDIRECT_KEY, path.trim());
  } catch {
    // Almacenamiento bloqueado por entorno o navegador privado.
  }
}

export function peekPendingInviteRedirect(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(PENDING_INVITE_REDIRECT_KEY);
    return isValidInviteRedirectPath(raw) ? raw.trim() : null;
  } catch {
    return null;
  }
}

export function consumePendingInviteRedirect(): string | null {
  const pending = peekPendingInviteRedirect();
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(PENDING_INVITE_REDIRECT_KEY);
    } catch {
      // Sin acción.
    }
  }
  return pending;
}

function readInitiatedStreakIdsFromStorage(storage: Storage): number[] {
  const raw = storage.getItem(INITIATED_STREAKS_STORAGE_KEY);
  if (!raw) {
    return [];
  }
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.filter(
    (item): item is number =>
      typeof item === "number" && Number.isInteger(item) && item > 0,
  );
}

function readInitiatedStreakIds(): number[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    return readInitiatedStreakIdsFromStorage(window.localStorage);
  } catch {
    try {
      return readInitiatedStreakIdsFromStorage(window.sessionStorage);
    } catch {
      return [];
    }
  }
}

function writeInitiatedStreakIds(ids: number[]): void {
  if (typeof window === "undefined") {
    return;
  }
  const serialized = JSON.stringify(ids.slice(-MAX_INITIATED_STREAKS));
  try {
    window.localStorage.setItem(INITIATED_STREAKS_STORAGE_KEY, serialized);
  } catch {
    try {
      window.sessionStorage.setItem(INITIATED_STREAKS_STORAGE_KEY, serialized);
    } catch {
      // Almacenamiento bloqueado.
    }
  }
}

/**
 * Registra localmente una racha propuesta desde esta sesión para distinguirla de propuestas entrantes.
 */
export function markLocallyInitiatedStreak(streakId: number): void {
  if (!Number.isInteger(streakId) || streakId <= 0) {
    return;
  }
  const existing = readInitiatedStreakIds().filter((id) => id !== streakId);
  writeInitiatedStreakIds([...existing, streakId]);
}

export function hasLocallyInitiatedStreak(streakId: number): boolean {
  if (!Number.isInteger(streakId) || streakId <= 0) {
    return false;
  }
  return readInitiatedStreakIds().includes(streakId);
}

export function clearLocallyInitiatedStreak(streakId: number): void {
  if (!Number.isInteger(streakId) || streakId <= 0) {
    return;
  }
  const next = readInitiatedStreakIds().filter((id) => id !== streakId);
  writeInitiatedStreakIds(next);
}

/**
 * Convierte el DTO real `FriendshipDto` del backend en el resumen usado por la UI del hub.
 */
export function mapFriendshipToSummary(
  friendship: FriendshipDto,
  activeStreak?: FriendStreakDto | null,
): FriendSummaryDto {
  return {
    userId: friendship.friend.id,
    friendshipId: friendship.id,
    fullName: friendship.friend.fullName,
    since: friendship.friend.since,
    activeStreak: activeStreak
      ? {
          id: activeStreak.id,
          status: activeStreak.status,
          currentStreak: activeStreak.currentStreak,
          longestStreak: activeStreak.longestStreak,
          language: activeStreak.language,
          myCompletedToday: activeStreak.myCompletedToday,
          partnerCompletedToday: activeStreak.partnerCompletedToday,
          todayReadingId:
            activeStreak.todayReadingId ??
            activeStreak.today?.myReadingId ??
            null,
        }
      : null,
  };
}

/**
 * Determina si una racha en `pending_partner` espera confirmación del usuario actual.
 */
export function isStreakAwaitingMyAcceptance(
  streak: FriendStreakDto,
  currentUserId?: number | null,
): boolean {
  if (streak.status !== "pending_partner") {
    return false;
  }
  if (typeof streak.awaitingMyAcceptance === "boolean") {
    return streak.awaitingMyAcceptance;
  }
  if (typeof streak.isInitiator === "boolean") {
    return !streak.isInitiator;
  }
  const partnerId = streak.partnerUserId ?? streak.friendUserId;
  if (typeof streak.initiatedByUserId === "number") {
    if (typeof currentUserId === "number") {
      return streak.initiatedByUserId !== currentUserId;
    }
    return streak.initiatedByUserId === partnerId;
  }
  if (hasLocallyInitiatedStreak(streak.id)) {
    return false;
  }
  return true;
}

/**
 * Enriquece `FriendStreakDto[]` del backend con `partnerName`, `partnerUserId`, `categoryPool`
 * y la lectura diaria pendiente (`originType === "friend_streak"`) de `/readings/pending`.
 */
export function correlateStreakReadings(
  streaks: readonly FriendStreakDto[],
  pendingReadings: readonly ReadingDto[] = [],
  friendsById?: ReadonlyMap<number, FriendshipDto>,
): FriendStreakDto[] {
  const usedReadingIds = new Set<number>();
  for (const streak of streaks) {
    const explicitId = streak.todayReadingId ?? streak.today?.myReadingId;
    if (typeof explicitId === "number") {
      usedReadingIds.add(explicitId);
    }
  }

  const candidateReadings = pendingReadings
    .filter(
      (reading) =>
        reading.originType === "friend_streak" &&
        reading.status === "pending" &&
        !reading.deletedAt,
    )
    .sort((a, b) => {
      const timeDiff = Date.parse(b.createdAt) - Date.parse(a.createdAt);
      if (Number.isFinite(timeDiff) && timeDiff !== 0) {
        return timeDiff;
      }
      return b.id - a.id;
    });

  const readingsById = new Map(pendingReadings.map((r) => [r.id, r]));

  return streaks.map((streak) => {
    const friendUserId = streak.friendUserId;
    const partnerUserId = streak.partnerUserId ?? friendUserId;
    const partnerName =
      streak.partnerName ??
      friendsById?.get(friendUserId)?.friend.fullName ??
      null;
    const categoryPool =
      streak.categoryPool && streak.categoryPool.length > 0
        ? streak.categoryPool
        : Array.from(
            new Set([...streak.myCategories, ...streak.partnerCategories]),
          );

    const existingTodayId =
      streak.todayReadingId ?? streak.today?.myReadingId ?? null;
    if (typeof existingTodayId === "number") {
      const existingReading = readingsById.get(existingTodayId);
      return {
        ...streak,
        partnerUserId,
        partnerName,
        categoryPool,
        todayReadingId: existingTodayId,
        todayCategory:
          streak.todayCategory ??
          streak.today?.category ??
          existingReading?.category ??
          null,
        todayStatus: streak.todayStatus ?? streak.today?.status ?? "pending",
      };
    }

    let matchedReading: ReadingDto | undefined;
    if (streak.status === "active" && !streak.myCompletedToday) {
      const poolKeys = new Set(categoryPool.map((c) => c.trim().toLowerCase()));
      let bestScore = -1;
      for (const candidate of candidateReadings) {
        if (usedReadingIds.has(candidate.id)) {
          continue;
        }
        if (candidate.language !== streak.language) {
          continue;
        }
        let score = 0;
        if (
          candidate.category &&
          poolKeys.has(candidate.category.trim().toLowerCase())
        ) {
          score += 2;
        }
        if (candidate.difficulty === streak.difficulty) {
          score += 1;
        }
        if (score > bestScore) {
          bestScore = score;
          matchedReading = candidate;
        }
      }
      if (matchedReading) {
        usedReadingIds.add(matchedReading.id);
      }
    }

    return {
      ...streak,
      partnerUserId,
      partnerName,
      categoryPool,
      todayReadingId: matchedReading ? matchedReading.id : null,
      todayCategory:
        streak.todayCategory ??
        streak.today?.category ??
        matchedReading?.category ??
        null,
      todayStatus:
        streak.todayStatus ??
        streak.today?.status ??
        (matchedReading ? "pending" : null),
    };
  });
}

/**
 * Crea el servicio del módulo de amistades (`/api/v1/friends/*`).
 */
export function createFriendsService(transport: ApiTransport) {
  return {
    // ── Solicitudes por correo ───────────────────────────────────────────────

    /** Envía una solicitud de amistad por correo electrónico a otra cuenta estudiante verificada. */
    sendRequestByEmail(
      input: CreateFriendRequestByEmailInput,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<FriendshipRequestDto>> {
      return transport.post<FriendshipRequestDto>(
        "/friends/requests/by-email",
        input,
        options,
      );
    },

    /** Lista las solicitudes de amistad entrantes. */
    listIncomingRequests(
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<FriendshipRequestDto[]>> {
      return transport.get<FriendshipRequestDto[]>(
        "/friends/requests/incoming",
        options,
      );
    },

    /** Lista las solicitudes de amistad salientes enviadas por el usuario. */
    listOutgoingRequests(
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<FriendshipRequestDto[]>> {
      return transport.get<FriendshipRequestDto[]>(
        "/friends/requests/outgoing",
        options,
      );
    },

    /** Acepta una solicitud de amistad entrante pendiente. */
    acceptRequest(
      requestId: number,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<FriendshipDto>> {
      return transport.post<FriendshipDto>(
        `/friends/requests/${requestId}/accept`,
        undefined,
        options,
      );
    },

    /** Rechaza una solicitud de amistad entrante pendiente. */
    rejectRequest(
      requestId: number,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<null>> {
      return transport.post<null>(
        `/friends/requests/${requestId}/reject`,
        undefined,
        options,
      );
    },

    /** Cancela una solicitud de amistad saliente pendiente. */
    cancelRequest(
      requestId: number,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<null>> {
      return transport.delete<null>(`/friends/requests/${requestId}`, options);
    },

    // ── Enlaces de invitación compartibles ───────────────────────────────────

    /** Genera un enlace compartible de amistad (1 uso o multi-uso, vigencia 7 días por defecto). */
    createInviteLink(
      input: CreateFriendInviteLinkInput = {},
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<CreatedFriendInviteLinkDto>> {
      const payload: CreateFriendInviteLinkInput =
        input.maxUses !== undefined ? { maxUses: input.maxUses } : {};
      return transport.post<CreatedFriendInviteLinkDto>(
        "/friends/invite-links",
        payload,
        options,
      );
    },

    /** Lista los enlaces de invitación creados por el usuario actual. */
    listInviteLinks(
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<FriendInviteLinkDto[]>> {
      return transport.get<FriendInviteLinkDto[]>(
        "/friends/invite-links",
        options,
      );
    },

    /** Revoca un enlace de invitación propio para impedir futuros canjes. */
    revokeInviteLink(
      linkId: number,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<null>> {
      return transport.delete<null>(`/friends/invite-links/${linkId}`, options);
    },

    /**
     * Consulta la vista previa pública (`@OptionalAuth()`) de un link de invitación sin revelar datos sensibles.
     */
    previewInviteLink(
      token: string,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<FriendInviteLinkPreviewDto>> {
      return transport.get<FriendInviteLinkPreviewDto>(
        `/friends/invite-links/${encodeURIComponent(token.trim())}`,
        {
          skipAuth: true,
          ...options,
        },
      );
    },

    /** Acepta una invitación por token y establece la amistad. */
    acceptInviteLink(
      token: string,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<FriendshipDto>> {
      return transport.post<FriendshipDto>(
        `/friends/invite-links/${encodeURIComponent(token.trim())}/accept`,
        undefined,
        options,
      );
    },

    /** Declina explícitamente una invitación por token. */
    declineInviteLink(
      token: string,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<null>> {
      return transport.post<null>(
        `/friends/invite-links/${encodeURIComponent(token.trim())}/decline`,
        undefined,
        options,
      );
    },

    // ── Amigos y bloqueos ────────────────────────────────────────────────────

    /** Lista las amistades activas del usuario. */
    listFriends(
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<FriendshipDto[]>> {
      return transport.get<FriendshipDto[]>("/friends", options);
    },

    /** Elimina la amistad con otro usuario. */
    removeFriend(
      friendUserId: number,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<null>> {
      return transport.delete<null>(`/friends/${friendUserId}`, options);
    },

    /** Lista los usuarios bloqueados por el usuario actual. */
    listBlockedUsers(
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<BlockedUserDto[]>> {
      return transport.get<BlockedUserDto[]>("/friends/blocks", options);
    },

    /** Bloquea a un usuario (elimina amistad, solicitudes y racha compartida). */
    blockUser(
      userId: number,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<null>> {
      return transport.post<null>(`/friends/blocks/${userId}`, undefined, options);
    },

    /** Quita el bloqueo previo sobre un usuario. */
    unblockUser(
      userId: number,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<null>> {
      return transport.delete<null>(`/friends/blocks/${userId}`, options);
    },

    // ── Lecturas y categorías privadas de amigos ─────────────────────────────

    /** Lista las lecturas personales de un amigo sin exponer calificaciones ni estado (`limit` 1..50). */
    listFriendReadings(
      friendUserId: number,
      query?: FriendReadingsQuery,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<FriendReadingDto[]>> {
      const clampedLimit =
        typeof query?.limit === "number" && Number.isFinite(query.limit)
          ? Math.min(50, Math.max(1, Math.floor(query.limit)))
          : undefined;
      return transport.get<FriendReadingDto[]>(
        `/friends/${friendUserId}/readings`,
        {
          ...options,
          query: clampedLimit !== undefined ? { limit: clampedLimit } : undefined,
        },
      );
    },

    /** Obtiene el contenido completo de una lectura personal de un amigo (sin métricas privadas). */
    getFriendReading(
      friendUserId: number,
      readingId: number,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<FriendReadingDto>> {
      return transport.get<FriendReadingDto>(
        `/friends/${friendUserId}/readings/${readingId}`,
        options,
      );
    },

    /** Crea o recupera de forma idempotente la copia privada propia de la lectura de un amigo. */
    startFriendReading(
      friendUserId: number,
      readingId: number,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<StartFriendReadingResponseDto | ReadingDto>> {
      return transport.post<StartFriendReadingResponseDto | ReadingDto>(
        `/friends/${friendUserId}/readings/${readingId}/start`,
        undefined,
        options,
      );
    },

    /** Lista las categorías aprobadas disponibles en la biblioteca del amigo. */
    getFriendCategories(
      friendUserId: number,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<FriendCategoryDto[]>> {
      return transport.get<FriendCategoryDto[]>(
        `/friends/${friendUserId}/categories`,
        options,
      );
    },

    /** Copia categorías aprobadas de un amigo a la biblioteca/preferencias propias sin cuota IA. */
    copyFriendCategories(
      friendUserId: number,
      input: CopyFriendCategoriesInput,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<CopyFriendCategoriesResponseDto>> {
      return transport.post<CopyFriendCategoriesResponseDto>(
        `/friends/${friendUserId}/categories/copy`,
        input,
        options,
      );
    },

    // ── Rachas diarias entre amigos ──────────────────────────────────────────

    /** Propone una racha diaria compartida indicando 2 categorías propias y 2 del amigo. */
    proposeStreak(
      friendUserId: number,
      input: ProposeFriendStreakInput,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<FriendStreakDto>> {
      return transport.post<FriendStreakDto>(
        `/friends/${friendUserId}/streak`,
        input,
        options,
      );
    },

    /** Acepta una propuesta pendiente de racha compartida (sin cuerpo JSON). */
    acceptStreak(
      streakId: number,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<FriendStreakDto>> {
      return transport.post<FriendStreakDto>(
        `/friends/streaks/${streakId}/accept`,
        undefined,
        options,
      );
    },

    /** Rechaza una propuesta pendiente de racha compartida. */
    rejectStreak(
      streakId: number,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<null>> {
      return transport.post<null>(
        `/friends/streaks/${streakId}/reject`,
        undefined,
        options,
      );
    },

    /** Actualiza las 2 categorías aportadas por el usuario en la racha compartida. */
    updateStreakCategories(
      streakId: number,
      input: UpdateFriendStreakCategoriesInput,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<FriendStreakDto>> {
      return transport.patch<FriendStreakDto>(
        `/friends/streaks/${streakId}/categories`,
        input,
        options,
      );
    },

    /** Finaliza una racha compartida activa, pausada o pendiente. */
    endStreak(
      streakId: number,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<null>> {
      return transport.delete<null>(`/friends/streaks/${streakId}`, options);
    },

    /** Lista las rachas compartidas del usuario actual. */
    listStreaks(
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<FriendStreakDto[]>> {
      return transport.get<FriendStreakDto[]>("/friends/streaks", options);
    },

    /** Obtiene el detalle actual de una racha compartida. */
    getStreak(
      streakId: number,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<FriendStreakDto>> {
      return transport.get<FriendStreakDto>(
        `/friends/streaks/${streakId}`,
        options,
      );
    },
  };
}

/** Instancia lista para usar en Client Components vía `/api/v1/friends/*`. */
export const friendsService = createFriendsService(httpClient);
