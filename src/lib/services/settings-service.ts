import {
  type ApiRequestOptions,
  type ApiTransport,
  type CategoriesSettings,
  type LanguagesSettings,
  type UpdateCategoriesInput,
  type UpdateLanguagesInput,
} from "@/lib/api-contracts";
import { type ApiResponse } from "@/lib/api-errors";
import { httpClient } from "@/lib/http-client";

export type SettingsRequestOptions = Omit<ApiRequestOptions, "method" | "body">;

/**
 * Crea el servicio de preferencias de estudio (categorías e idiomas) sobre un transporte dado.
 */
export function createSettingsService(transport: ApiTransport) {
  return {
    /** Obtiene el catálogo predefinido y las categorías elegidas por el usuario. */
    getCategories(
      options?: SettingsRequestOptions,
    ): Promise<ApiResponse<CategoriesSettings>> {
      return transport.get<CategoriesSettings>("/settings/categories", options);
    },

    /** Reemplaza la lista de categorías favoritas respetando la cuota del plan. */
    updateCategories(
      input: UpdateCategoriesInput,
      options?: SettingsRequestOptions,
    ): Promise<ApiResponse<CategoriesSettings>> {
      return transport.put<CategoriesSettings>(
        "/settings/categories",
        input,
        options,
      );
    },

    /** Obtiene los idiomas elegidos, activos, bloqueos anuales y créditos disponibles. */
    getLanguages(
      options?: SettingsRequestOptions,
    ): Promise<ApiResponse<LanguagesSettings>> {
      return transport.get<LanguagesSettings>("/settings/languages", options);
    },

    /** Selecciona o modifica los idiomas objetivo respetando el cupo y bloqueo anual. */
    updateLanguages(
      input: UpdateLanguagesInput,
      options?: SettingsRequestOptions,
    ): Promise<ApiResponse<LanguagesSettings>> {
      return transport.put<LanguagesSettings>(
        "/settings/languages",
        input,
        options,
      );
    },

    /** Reordena la prioridad de los idiomas ya guardados sin agregar ni eliminar elementos. */
    reorderLanguages(
      input: UpdateLanguagesInput,
      options?: SettingsRequestOptions,
    ): Promise<ApiResponse<LanguagesSettings>> {
      return transport.put<LanguagesSettings>(
        "/settings/languages/reorder",
        input,
        options,
      );
    },

    /** Acredita un crédito de desbloqueo inmediato para cambiar idiomas antes de 365 días. */
    unlockLanguageChange(
      options?: SettingsRequestOptions,
    ): Promise<ApiResponse<LanguagesSettings>> {
      return transport.post<LanguagesSettings>(
        "/settings/languages/unlock-change",
        undefined,
        options,
      );
    },
  };
}

/** Instancia de cliente para preferencias de estudio en el navegador. */
export const settingsService = createSettingsService(httpClient);
