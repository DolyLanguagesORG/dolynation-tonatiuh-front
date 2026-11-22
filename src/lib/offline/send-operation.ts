import { readingsService } from "@/lib";
import type { OutboxItem } from "@/lib/offline/types";

/**
 * Envia una operacion de la cola al backend.
 *
 * El `id` de la operacion viaja como **clave de idempotencia**
 * (`idempotency-key`): si el envio se corta a mitad y se reintenta, el
 * servidor ve que ya la recibio y no la repite (importa: la IA no evalua
 * dos veces la misma respuesta).
 *
 * El backend todavia no acepta esa clave (es el PR pendiente del backend);
 * mientras tanto, la cabecera viaja igualmente y no rompe nada.
 */
export async function sendOfflineOperation(item: OutboxItem): Promise<void> {
  const idempotencyKey = { headers: { "idempotency-key": item.id } };

  switch (item.type) {
    case "evaluate": {
      await readingsService.evaluate(
        item.readingId,
        { userResponse: String(item.payload.userResponse ?? "") },
        idempotencyKey,
      );
      return;
    }
    case "explanation": {
      await readingsService.explain(
        item.readingId,
        {
          word: String(item.payload.word ?? ""),
          context: item.payload.context
            ? String(item.payload.context)
            : undefined,
        },
        idempotencyKey,
      );
      return;
    }
    case "glossary": {
      // El identificador de la explicacion (no el de la lectura).
      await readingsService.toggleGlossarySave(
        Number(item.payload.explanationId ?? 0),
        { isSaved: Boolean(item.payload.isSaved) },
        idempotencyKey,
      );
      return;
    }
    default: {
      // Un tipo que no se conoce: se marca como fallido en vez de dejarlo
      // en la cola para siempre.
      throw new Error(`Operacion offline de tipo desconocido: ${item.type}`);
    }
  }
}
