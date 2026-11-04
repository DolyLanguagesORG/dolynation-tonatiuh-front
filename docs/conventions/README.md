# Convenciones del frontend — `dolynation-tonatiuh-front`

Guía de arquitectura, sistema visual y convenciones locales del frontend web de **DolyNation**.

Las reglas transversales del proyecto (git workflow, commits, versionado, entorno) viven en la documentación central:

- [Convenciones](https://github.com/DolyLanguagesORG/dolynation-ehecatl-docs/tree/develop/conventions)
- [Cómo hacer un PR](https://github.com/DolyLanguagesORG/dolynation-ehecatl-docs/blob/develop/FLUJO-DE-TRABAJO.md)

## 1. Estilo de componentes (Server vs Client Components)

- **Server Components por defecto**: Las páginas (`page.tsx`), layouts (`layout.tsx`) y contenedores estáticos se mantienen como Server Components salvo que requieran estado interactivo (`useState`, `useEffect`), eventos de navegador o contexto de cliente.
- **Client Components (`"use client"`)**: Se reservan para hojas interactivas, formularios con validación en vivo, el drawer móvil del shell y hooks (`src/hooks/`).
- **Nombres**:
  - Componentes y tipos en `PascalCase`.
  - Archivos y carpetas en `kebab-case` (p. ej. `app-shell.tsx`, `http-client.ts`).
  - Hooks con prefijo `use` (`useDisclosure`, `useApiRequest`).
  - Imports internos siempre mediante el alias `@/` (`@/components/ui`, `@/lib`, `@/i18n`, `@/hooks`).

## 2. Convenciones de carpetas dentro de `src/`

- `src/app/`: Rutas del App Router, `layout.tsx`, `globals.css`, `loading.tsx`, `error.tsx` y `not-found.tsx`.
- `src/components/layout/`: Estructura del shell responsivo (`AppShell`, `Header`, `Sidebar`, `Footer`).
- `src/components/ui/`: Componentes atómicos y compuestos del sistema de diseño (`Button`, `Input`, `Card`, `Alert`, `Container`, `Badge`).
- `src/hooks/`: Hooks reutilizables de interfaz y consumo de datos.
- `src/i18n/`: Diccionarios tipados (`es` / `en`) y contexto de idioma.
- `src/lib/`: Configuración de variables de entorno (`env.ts`), catálogo de errores (`api-errors.ts`) y cliente HTTP (`http-client.ts`).

## 3. Tokens de tema, Flowbite y estilos globales

Los tokens visuales se definen en `src/app/globals.css` sobre `:root` y `@theme inline` (generados a partir del esquema del MCP de Flowbite y personalizados para el sistema editorial blanco/negro de DolyNation), junto con el tema tipado `dolyFlowbiteTheme` (`src/components/ui/flowbite-theme.ts`) inyectado mediante `ThemeProvider` de `flowbite-react`:

- **Superficies Flowbite & DolyNation**: `--color-neutral-primary-soft` / `--surface` (`#ffffff`), `--color-neutral-secondary-soft` / `--background` (`#f8fafc`), `--color-neutral-secondary-medium` / `--surface-subtle` (`#f1f5f9`), `--color-neutral-tertiary` / `--surface-muted` (`#e2e8f0`).
- **Marca y tinta**: `--color-brand` / `--ink` (`#0a0a0a`), `--color-heading` / `--foreground` (`#0f172a`), `--color-body` / `--muted` (`#475569`), `--color-body-subtle` / `--subtle` (`#64748b`).
- **Semántica**: `--color-danger` / `--status-error`, `--color-success` / `--status-success`, `--color-warning` / `--status-warning` (con sus variantes `-soft` y `-subtle`).
- **Tipografía**: `--font-serif` (`Newsreader` para encabezados editoriales y extractos de lectura), `--font-sans` (`Geist` para controles UI) y `--font-mono` (`Geist Mono` para códigos y métricas).
- **Prohibido** hardcodear colores hexadecimales fuera de `globals.css`; usa siempre los componentes de `@/components/ui` y las clases de utilidad mapeadas a los tokens (`bg-brand`, `bg-neutral-primary-soft`, `text-heading`, `text-body`, `border-default`, etc.).

## 4. Manejo de datos y cliente HTTP

- Todas las peticiones al backend pasan por `httpClient` (`@/lib/http-client`).
- El backend envuelve toda respuesta en `ApiResponse<T>` (`{ message, data, error }`).
- Ante un fallo, `httpClient` lanza un `ApiClientError` tipado. La interfaz **siempre** decide en función de `error.code` (`ErrorCode`), nunca parseando `error.message`.

## 5. Variables de entorno (`NEXT_PUBLIC_*`)

- Toda variable expuesta al navegador lleva el prefijo `NEXT_PUBLIC_`.
- `NEXT_PUBLIC_API_BASE_URL` define la URL base del backend (documentada en `.env.example`).
- Nunca commitear archivos `.env` ni `.env.local` con secretos reales.
