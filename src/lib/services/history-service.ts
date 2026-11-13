import {
  type ApiRequestOptions,
  type ApiTransport,
  type HistoryScoreEntry,
  type HistorySummary,
} from "@/lib/api-contracts";
import { type ApiResponse } from "@/lib/api-errors";
import { httpClient } from "@/lib/http-client";

export type HistoryRequestOptions = Omit<ApiRequestOptions, "method" | "body">;

/**
 * Crea el servicio de historial agregado y calificaciones recientes (`/history`).
 */
export function createHistoryService(transport: ApiTransport) {
  return {
    /** Devuelve métricas agregadas de lecturas, aprobadas, promedio y palabras consultadas. */
    getSummary(
      options?: HistoryRequestOptions,
    ): Promise<ApiResponse<HistorySummary>> {
      return transport.get<HistorySummary>("/history", options);
    },

    /** Lista las lecturas evaluadas más recientes junto con su calificación. */
    getScores(
      options?: HistoryRequestOptions,
    ): Promise<ApiResponse<HistoryScoreEntry[]>> {
      return transport.get<HistoryScoreEntry[]>("/history/scores", options);
    },
  };
}

/** Instancia de cliente para consultar estadísticas de aprendizaje en el navegador. */
export const historyService = createHistoryService(httpClient);
