import {
  type ApiRequestOptions,
  type ApiTransport,
  type ChatRequestInput,
  type ChatResponse,
} from "@/lib/api-contracts";
import { type ApiResponse } from "@/lib/api-errors";
import { httpClient } from "@/lib/http-client";
import { AI_TIMEOUT_MS } from "@/lib/http-core";

export type IaRequestOptions = Omit<ApiRequestOptions, "method" | "body">;

/**
 * Crea el servicio conversacional de asistencia con IA (`/ia`).
 */
export function createIaService(transport: ApiTransport) {
  return {
    /** Envía el historial de mensajes y un prompt opcional al tutor de IA. */
    chat(
      input: ChatRequestInput,
      options?: IaRequestOptions,
    ): Promise<ApiResponse<ChatResponse>> {
      return transport.post<ChatResponse>("/ia/chat", input, {
        timeoutMs: AI_TIMEOUT_MS,
        ...options,
      });
    },
  };
}

/** Instancia de cliente para consultas al tutor de IA en Client Components. */
export const iaService = createIaService(httpClient);
