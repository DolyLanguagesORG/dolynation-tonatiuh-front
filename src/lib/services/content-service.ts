import {
  type ApiRequestOptions,
  type ApiTransport,
  type GenerateContentInput,
  type ReadingDto,
} from "@/lib/api-contracts";
import { type ApiResponse } from "@/lib/api-errors";
import { httpClient } from "@/lib/http-client";
import { AI_TIMEOUT_MS } from "@/lib/http-core";

export type ContentRequestOptions = Omit<ApiRequestOptions, "method" | "body">;

/**
 * Crea el servicio dedicado de generación de contenido (`/content`).
 */
export function createContentService(transport: ApiTransport) {
  return {
    /** Genera una nueva lectura de práctica utilizando IA generativa. */
    generate(
      input: GenerateContentInput,
      options?: ContentRequestOptions,
    ): Promise<ApiResponse<ReadingDto>> {
      return transport.post<ReadingDto>("/content/generate", input, {
        timeoutMs: AI_TIMEOUT_MS,
        ...options,
      });
    },
  };
}

/** Instancia de cliente para generación de contenido en el navegador. */
export const contentService = createContentService(httpClient);
