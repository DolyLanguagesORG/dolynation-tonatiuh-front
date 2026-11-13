import {
  type ApiRequestOptions,
  type ApiTransport,
  type CreateExplanationInput,
  type EvaluateReadingInput,
  type EvaluationResultDto,
  type ExplanationResultDto,
  type GenerateReadingInput,
  type GlossaryEntryDto,
  type GlossaryQuery,
  type ReadingDto,
  type ReadingOptionsResponse,
  type ToggleGlossarySaveInput,
} from "@/lib/api-contracts";
import { type ApiResponse } from "@/lib/api-errors";
import { httpClient } from "@/lib/http-client";
import { AI_TIMEOUT_MS } from "@/lib/http-core";

export type ReadingsRequestOptions = Omit<ApiRequestOptions, "method" | "body">;

/**
 * Crea el servicio completo de lecturas, evaluaciones y explicaciones contextuales.
 */
export function createReadingsService(transport: ApiTransport) {
  return {
    /** Obtiene el catálogo filtrado de categorías, dificultades, tamaños y niveles CEFR. */
    getOptions(
      options?: ReadingsRequestOptions,
    ): Promise<ApiResponse<ReadingOptionsResponse>> {
      return transport.get<ReadingOptionsResponse>("/readings/options", options);
    },

    /** Genera con IA una lectura adaptada al idioma, tema y dificultad indicados. */
    generate(
      input: GenerateReadingInput,
      options?: ReadingsRequestOptions,
    ): Promise<ApiResponse<ReadingDto>> {
      return transport.post<ReadingDto>("/readings", input, {
        timeoutMs: AI_TIMEOUT_MS,
        ...options,
      });
    },

    /** Lista las lecturas pendientes del usuario autenticado. */
    listPending(
      options?: ReadingsRequestOptions,
    ): Promise<ApiResponse<ReadingDto[]>> {
      return transport.get<ReadingDto[]>("/readings/pending", options);
    },

    /** Lista las lecturas ya evaluadas o completadas del usuario autenticado. */
    listCompleted(
      options?: ReadingsRequestOptions,
    ): Promise<ApiResponse<ReadingDto[]>> {
      return transport.get<ReadingDto[]>("/readings/completed", options);
    },

    /** Obtiene el detalle de una lectura específica perteneciente al usuario. */
    getById(
      id: number,
      options?: ReadingsRequestOptions,
    ): Promise<ApiResponse<ReadingDto>> {
      return transport.get<ReadingDto>(
        `/readings/${encodeURIComponent(String(id))}`,
        options,
      );
    },

    /** Envía el resumen del usuario para que la IA lo evalúe y calcule la calificación. */
    evaluate(
      id: number,
      input: EvaluateReadingInput,
      options?: ReadingsRequestOptions,
    ): Promise<ApiResponse<EvaluationResultDto>> {
      return transport.post<EvaluationResultDto>(
        `/readings/${encodeURIComponent(String(id))}/evaluate`,
        input,
        {
          timeoutMs: AI_TIMEOUT_MS,
          ...options,
        },
      );
    },

    /** Lista las explicaciones contextuales previamente consultadas sobre una lectura. */
    listExplanations(
      id: number,
      options?: ReadingsRequestOptions,
    ): Promise<ApiResponse<GlossaryEntryDto[]>> {
      return transport.get<GlossaryEntryDto[]>(
        `/readings/${encodeURIComponent(String(id))}/explanations`,
        options,
      );
    },

    /** Consulta el glosario personal e historial de ayudas del usuario autenticado. */
    getGlossary(
      query?: GlossaryQuery,
      options?: ReadingsRequestOptions,
    ): Promise<ApiResponse<GlossaryEntryDto[]>> {
      return transport.get<GlossaryEntryDto[]>("/readings/glossary", {
        ...options,
        query,
      });
    },

    /** Guarda o retira una explicación existente en el glosario personal del usuario. */
    toggleGlossarySave(
      explanationId: number,
      input: ToggleGlossarySaveInput,
      options?: ReadingsRequestOptions,
    ): Promise<ApiResponse<GlossaryEntryDto>> {
      return transport.patch<GlossaryEntryDto>(
        `/readings/explanations/${encodeURIComponent(String(explanationId))}/glossary`,
        input,
        options,
      );
    },

    /** Solicita una explicación contextual con IA sobre una palabra o frase de la lectura. */
    explain(
      id: number,
      input: CreateExplanationInput,
      options?: ReadingsRequestOptions,
    ): Promise<ApiResponse<ExplanationResultDto>> {
      return transport.post<ExplanationResultDto>(
        `/readings/${encodeURIComponent(String(id))}/explanations`,
        input,
        {
          timeoutMs: AI_TIMEOUT_MS,
          ...options,
        },
      );
    },

    /** Realiza el borrado lógico de una lectura del usuario. */
    remove(
      id: number,
      options?: ReadingsRequestOptions,
    ): Promise<ApiResponse<null>> {
      return transport.delete<null>(
        `/readings/${encodeURIComponent(String(id))}`,
        options,
      );
    },
  };
}

/** Instancia de cliente para lecturas en Client Components. */
export const readingsService = createReadingsService(httpClient);
