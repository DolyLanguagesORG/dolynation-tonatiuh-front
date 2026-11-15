import "server-only";

import fs from "node:fs";
import path from "node:path";

import {
  type LegalDocument,
  type LegalDocumentKind,
  parseLegalMarkdown,
} from "@/i18n/legal-types";
import { type Locale, SUPPORTED_UI_LOCALES } from "@/i18n/locales";

const CONTENT_ROOT = path.join(process.cwd(), "src/i18n/content");

/**
 * Carga y parsea un documento legal Markdown para un idioma de interfaz específico.
 */
export function loadLegalDocument(
  kind: LegalDocumentKind,
  locale: Locale,
): LegalDocument {
  const filePath = path.join(CONTENT_ROOT, kind, `${locale}.md`);
  const raw = fs.readFileSync(filePath, "utf8");
  return parseLegalMarkdown(raw);
}

/**
 * Carga el mapa completo `{ locale -> LegalDocument }` para todos los idiomas
 * soportados, permitiendo al cliente alternar idioma instantáneamente.
 */
export function loadLegalDocuments(
  kind: LegalDocumentKind,
): Record<Locale, LegalDocument> {
  const entries = SUPPORTED_UI_LOCALES.map((locale) => [
    locale,
    loadLegalDocument(kind, locale),
  ]);
  return Object.fromEntries(entries) as Record<Locale, LegalDocument>;
}
