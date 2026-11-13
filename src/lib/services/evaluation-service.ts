import {
  type ApiRequestOptions,
  type ApiTransport,
  type EvaluationResultDto,
  type SubmitEvaluationInput,
} from "@/lib/api-contracts";
import { type ApiResponse } from "@/lib/api-errors";
import { httpClient } from "@/lib/http-client";
import { AI_TIMEOUT_MS } from "@/lib/http-core";

export type EvaluationRequestOptions = Omit<
  ApiRequestOptions,
  "method" | "body"
>;

/**
 * Crea el servicio dedicado de evaluación de resúmenes (`/evaluation`).
 */
export function createEvaluationService(transport: ApiTransport) {
  return {
    /** Envía el resumen de una lectura para calificación y retroalimentación con IA. */
    submit(
      input: SubmitEvaluationInput,
      options?: EvaluationRequestOptions,
    ): Promise<ApiResponse<EvaluationResultDto>> {
      return transport.post<EvaluationResultDto>("/evaluation/submit", input, {
        timeoutMs: AI_TIMEOUT_MS,
        ...options,
      });
    },
  };
}

/** Instancia de cliente para evaluación de comprensión en el navegador. */
export const evaluationService = createEvaluationService(httpClient);
