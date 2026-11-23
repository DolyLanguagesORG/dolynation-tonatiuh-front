/**
 * Sanitiza las respuestas de error antes de devolverlas al navegador desde el proxy BFF:
 * - Preserva `error.code` para que el cliente muestre mensajes localizados amigables.
 * - Reemplaza mensajes crudos del backend por un mensaje neutro y seguro.
 * - Conserva únicamente los detalles mínimos requeridos por la UI (`fields` por campo
 *   y nombres de categorías rechazadas), eliminando metadatos internos (`layer`, `reason`,
 *   `hint`, `operation`, IDs internos, listas permitidas, etc.).
 */
export function sanitizeUpstreamErrorForBrowser(
  rawJson: string,
  status: number,
): string {
  const safeFallbackMessage = "No se pudo completar tu solicitud en este momento.";
  const fallbackCode = status >= 500 ? "INTERNAL_ERROR" : "UNKNOWN_ERROR";

  try {
    const parsed = JSON.parse(rawJson) as {
      error?: {
        code?: unknown;
        details?: unknown;
      } | null;
    };

    const rawCode = parsed?.error?.code;
    const code =
      typeof rawCode === "string" && rawCode.trim()
        ? rawCode.trim()
        : fallbackCode;

    const rawDetails =
      parsed?.error?.details &&
      typeof parsed.error.details === "object" &&
      !Array.isArray(parsed.error.details)
        ? (parsed.error.details as Record<string, unknown>)
        : null;

    let sanitizedDetails: Record<string, unknown> | undefined;

    if (
      code === "CATEGORY_MODERATION_REJECTED" &&
      rawDetails &&
      Array.isArray(rawDetails.rejected)
    ) {
      const rejected = rawDetails.rejected.flatMap((entry) => {
        if (!entry || typeof entry !== "object") return [];
        const category = (entry as { category?: unknown }).category;
        if (typeof category !== "string" || !category.trim()) return [];
        return [{ category: category.trim() }];
      });
      if (rejected.length > 0) {
        sanitizedDetails = { rejected };
      }
    } else if (
      code === "VALIDATION_ERROR" &&
      rawDetails &&
      Array.isArray(rawDetails.fields)
    ) {
      const fields = rawDetails.fields.flatMap((entry) => {
        if (!entry || typeof entry !== "object") return [];
        const field = (entry as { field?: unknown }).field;
        if (typeof field !== "string" || !field.trim()) return [];
        return [{ field: field.trim(), message: "Valor no válido." }];
      });
      if (fields.length > 0) {
        sanitizedDetails = { fields };
      }
    } else if (code === "BILLING_RATE_LIMITED" && rawDetails) {
      const retryAfterSeconds = rawDetails.retryAfterSeconds;
      if (
        typeof retryAfterSeconds === "number" &&
        Number.isFinite(retryAfterSeconds) &&
        retryAfterSeconds > 0
      ) {
        sanitizedDetails = { retryAfterSeconds: Math.ceil(retryAfterSeconds) };
      }
    } else if (code === "LANGUAGE_CHANGE_LOCKED" && rawDetails) {
      const nextDetails: Record<string, unknown> = {};
      const daysRemaining = rawDetails.daysRemaining;
      if (
        typeof daysRemaining === "number" &&
        Number.isFinite(daysRemaining) &&
        daysRemaining >= 0
      ) {
        nextDetails.daysRemaining = Math.ceil(daysRemaining);
      }
      const nextFreeChangeAt = rawDetails.nextFreeChangeAt;
      if (
        typeof nextFreeChangeAt === "string" &&
        nextFreeChangeAt.trim().length > 0
      ) {
        nextDetails.nextFreeChangeAt = nextFreeChangeAt.trim();
      } else if (nextFreeChangeAt === null) {
        nextDetails.nextFreeChangeAt = null;
      }
      if (Object.keys(nextDetails).length > 0) {
        sanitizedDetails = nextDetails;
      }
    }

    return JSON.stringify({
      message: safeFallbackMessage,
      data: null,
      error: {
        code,
        message: safeFallbackMessage,
        ...(sanitizedDetails ? { details: sanitizedDetails } : {}),
      },
    });
  } catch {
    return JSON.stringify({
      message: safeFallbackMessage,
      data: null,
      error: {
        code: fallbackCode,
        message: safeFallbackMessage,
      },
    });
  }
}
