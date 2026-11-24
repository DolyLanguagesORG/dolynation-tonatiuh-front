import {
  type AcceptFriendInviteLinkResponseDto,
  type AcceptFriendStreakInput,
  type ApiRequestOptions,
  type ApiTransport,
  type BlockedUserDto,
  type CopyFriendCategoriesInput,
  type CopyFriendCategoriesResponseDto,
  type CreateFriendInviteLinkInput,
  type CreateFriendRequestByEmailInput,
  type FriendCategoriesDto,
  type FriendInviteLinkDto,
  type FriendInviteLinkPreviewDto,
  type FriendReadingDetailDto,
  type FriendReadingListItemDto,
  type FriendReadingsListResponseDto,
  type FriendRequestDto,
  type FriendsListResponseDto,
  type FriendsPaginationQuery,
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
const FRIEND_INVITE_PREFIX = "/friends/invite/";

export interface NormalizedPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
 * Construye la URL pública compartible hacia `/friends/invite/[token]`.
 */
export function buildFriendInviteUrl(token: string, origin?: string): string {
  const cleanToken = encodeURIComponent(token.trim());
  const path = `${FRIEND_INVITE_PREFIX}${cleanToken}`;
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

function isValidInviteRedirectPath(path: string | null | undefined): path is string {
  if (!path || typeof path !== "string") {
    return false;
  }
  const trimmed = path.trim();
  if (!trimmed.startsWith(FRIEND_INVITE_PREFIX) || trimmed.startsWith("//")) {
    return false;
  }
  return trimmed.length > FRIEND_INVITE_PREFIX.length;
}

/**
 * Guarda temporalmente la ruta de invitación (`/friends/invite/<token>`) en `sessionStorage`
 * para completarla automáticamente después de registrarse o elegir plan.
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
    ): Promise<ApiResponse<FriendRequestDto>> {
      return transport.post<FriendRequestDto>(
        "/friends/requests/by-email",
        input,
        options,
      );
    },

    /** Lista las solicitudes de amistad entrantes. */
    listIncomingRequests(
      query?: FriendsPaginationQuery,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<FriendRequestDto[]>> {
      return transport.get<FriendRequestDto[]>("/friends/requests/incoming", {
        ...options,
        query,
      });
    },

    /** Lista las solicitudes de amistad salientes enviadas por el usuario. */
    listOutgoingRequests(
      query?: FriendsPaginationQuery,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<FriendRequestDto[]>> {
      return transport.get<FriendRequestDto[]>("/friends/requests/outgoing", {
        ...options,
        query,
      });
    },

    /** Acepta una solicitud de amistad entrante pendiente. */
    acceptRequest(
      requestId: number,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<FriendRequestDto>> {
      return transport.post<FriendRequestDto>(
        `/friends/requests/${requestId}/accept`,
        undefined,
        options,
      );
    },

    /** Rechaza una solicitud de amistad entrante pendiente. */
    rejectRequest(
      requestId: number,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<FriendRequestDto>> {
      return transport.post<FriendRequestDto>(
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
    ): Promise<ApiResponse<FriendInviteLinkDto>> {
      return transport.post<FriendInviteLinkDto>(
        "/friends/invite-links",
        input,
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
     * Consulta la vista previa pública (`@Public()`) de un link de invitación sin revelar datos sensibles.
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
    ): Promise<ApiResponse<AcceptFriendInviteLinkResponseDto>> {
      return transport.post<AcceptFriendInviteLinkResponseDto>(
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

    /** Lista las amistades activas del usuario con soporte de paginación. */
    listFriends(
      query?: FriendsPaginationQuery,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<FriendsListResponseDto | FriendSummaryDto[]>> {
      return transport.get<FriendsListResponseDto | FriendSummaryDto[]>(
        "/friends",
        {
          ...options,
          query,
        },
      );
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

    /** Lista las lecturas personales de un amigo sin exponer calificaciones ni estado. */
    listFriendReadings(
      friendUserId: number,
      query?: FriendsPaginationQuery,
      options?: FriendsRequestOptions,
    ): Promise<
      ApiResponse<FriendReadingsListResponseDto | FriendReadingListItemDto[]>
    > {
      return transport.get<
        FriendReadingsListResponseDto | FriendReadingListItemDto[]
      >(`/friends/${friendUserId}/readings`, {
        ...options,
        query,
      });
    },

    /** Obtiene el contenido completo de una lectura personal de un amigo (sin métricas privadas). */
    getFriendReading(
      friendUserId: number,
      readingId: number,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<FriendReadingDetailDto>> {
      return transport.get<FriendReadingDetailDto>(
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
    ): Promise<ApiResponse<FriendCategoriesDto>> {
      return transport.get<FriendCategoriesDto>(
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

    /** Propone una racha diaria compartida con exactamente 2 categorías iniciales. */
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

    /** Acepta una propuesta de racha aportando 2 categorías propias. */
    acceptStreak(
      streakId: number,
      input: AcceptFriendStreakInput,
      options?: FriendsRequestOptions,
    ): Promise<ApiResponse<FriendStreakDto>> {
      return transport.post<FriendStreakDto>(
        `/friends/streaks/${streakId}/accept`,
        input,
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
