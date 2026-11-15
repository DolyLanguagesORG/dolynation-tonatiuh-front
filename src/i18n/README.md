# Sistema de Internacionalización (`src/i18n`)

DolyNation separa de forma estricta **dos capas de idioma**:

1. **Idioma de la interfaz (`Locale` / `useLocale()`)**: controla toda la estructura de la aplicación (barra superior, barra lateral, pie de página, perfil, formularios de autenticación, filtros, mensajes de error y páginas legales).
2. **Inmersión por contenido (`getReadingFlowDictionary(item.language)`)**: cada tarjeta de lectura, su flujo completo (`/readings/[id]`, `/evaluate`, `/result`) y cada tarjeta individual del glosario (`/glossary`) se renderizan siempre en el idioma propio de esa lectura o término consultado (`es`, `en`, `fr`, `it`), independientemente del idioma elegido en la interfaz.

## Estructura de archivos

- `src/i18n/locales.ts`: registro único de idiomas soportados (`SUPPORTED_UI_LOCALES`, `UI_LOCALE_CATALOG`) e helpers de interpolación (`formatMessage`, `formatCountMessage`).
- `src/i18n/locales/*.json`: un archivo JSON tipado por cada idioma de interfaz (`es.json`, `en.json`, `fr.json`, `it.json`). `es.json` define el esquema TypeScript `Dictionary` verificado en compilación y pruebas.
- `src/i18n/content/{terms,privacy,support}/*.md`: documentos legales e informativos en Markdown plano por idioma.
- `src/i18n/dictionaries.ts`: carga e indexa todos los diccionarios JSON (`Record<Locale, Dictionary>`).
- `src/i18n/reading-flow-dictionaries.ts`: proyecta los subconjuntos inmersivos para lecturas y glosario reutilizando directamente los diccionarios JSON centralizados.
- `src/i18n/dictionaries.test.ts`: verifica en Jest que todos los idiomas registrados tengan exactamente las mismas llaves que `es.json` y sin textos vacíos.

## Cómo agregar un nuevo idioma (por ejemplo, `de` — Alemán)

1. Registra `"de"` en `SUPPORTED_UI_LOCALES` y `UI_LOCALE_CATALOG` dentro de `src/i18n/locales.ts`.
2. Copia `src/i18n/locales/es.json` a `src/i18n/locales/de.json` y traduce todos los valores manteniendo intactas las variables `{...}` y la estructura de llaves.
3. Importa y registra `de` en `src/i18n/dictionaries.ts`.
4. Crea los tres archivos Markdown `src/i18n/content/terms/de.md`, `privacy/de.md` y `support/de.md`.
5. Si el backend también enviará correos en ese idioma, añade `"de"` a `SUPPORTED_UI_LOCALES` y `mail.templates.ts` en `dolynation-atl-back`, y añade mensajes de error en `src/lib/api-errors.ts`.
6. Ejecuta `npm test && npm run verify`: los tests validarán automáticamente la paridad completa de llaves y documentos Markdown.
