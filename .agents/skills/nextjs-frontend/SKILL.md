---
name: nextjs-frontend
description: Cómo trabajar en el frontend DolyNation (repo dolynation-tonatiuh-front). Stack Next.js 16.4 (App Router) + React 19 + Tailwind 4 + TypeScript. Úsala al crear o modificar páginas, layouts, componentes, estilos, al configurar el proyecto, al consumir la API del backend o al subir cambios (rama, commit, PR) de este repositorio.
---

# Frontend DolyNation — `dolynation-tonatiuh-front`

Guía para trabajar en este repositorio. Todo lo específico de este repo está
aquí; el flujo global de la organización vive en el repo de docs
(`dolynation-ehecatl-docs`).

## Stack y versiones

| Pieza      | Versión |
| ---------- | ------- |
| Next.js    | 16.4.0 (App Router, Turbopack) |
| React      | 19.3.0 |
| Tailwind   | 4 |
| TypeScript | 5 |
| Node       | >= 22 |

- Se creó con `create-next-app` **sin** Cache Components / PPR
  (`--no-cache-components`). No uses esa feature sin acordarlo antes.
- Gestor de paquetes: **npm** (hay `package-lock.json`; no mezclar con pnpm/yarn).

## Estructura

```
src/
└── app/
    ├── layout.tsx      # layout raíz (RootLayout)
    ├── page.tsx        # página "/"
    ├── globals.css     # estilos globales (Tailwind)
    └── favicon.ico
```

- Alias `@/*` → `src/*` (configurado en `tsconfig.json`).
- Convención de Next: cada carpeta bajo `src/app/` es una ruta
  (`src/app/readings/page.tsx` → `/readings`).

## Comandos

```bash
npm run dev        # servidor de desarrollo (next dev)
npm run lint       # ESLint (eslint) — ignora .github/**
npm run typecheck  # next typegen && tsc --noEmit
npm run build      # build de producción (next build)
npm run verify     # lint + typecheck  ← córrelo antes de commitear
```

> `typecheck` corre **`next typegen`** antes de `tsc`. Es imprescindible: Next 16
> genera en `.next/` los tipos globales de rutas y layouts (p. ej. `LayoutProps`,
> `PageProps`). Sin generar esos tipos primero, `tsc` falla en CI aunque el
> código esté bien.

## Estilo de código

- TypeScript. Componentes en `PascalCase`, archivos y carpetas en `kebab-case`,
  hooks con prefijo `use`.
- Imports con el alias `@/` para `src/`.
- Tailwind para estilos; estilos globales en `src/app/globals.css`.
- El lint corre sobre todo el repo **excepto** `.github/**` (ahí viven scripts
  Node en CommonJS que no siguen las reglas del front).

## Consumir la API del backend

Todas las respuestas del backend (`dolynation-atl-back`) usan el **envelope**:

```ts
interface ApiResponse<T> {
  message: string;
  data: T;
  error?: { code: string; message: string; details?: Record<string, unknown> };
}
```

- Decide con `error.code` (string estable), **nunca** parseando `message`.
- En éxito, la carga útil está en `data`.

Detalle y ejemplos en `references/consuming-api.md`.

## Tests

Hoy **no** hay runner de tests en el frontend. El `verify` cubre `lint` +
`typecheck`, y el CI añade el `build`. Cuando se defina estrategia de tests
(unit con Vitest/Jest, e2e con Playwright, etc.), **actualiza esta skill**.

## Flujo de trabajo en este repo

Rama, commits, PR y checks → `references/workflow.md`. Resumen:

- Rama nueva desde `develop` (es la rama por defecto). **Nunca** push directo.
- `npm run verify` antes de commitear.
- Commits en **Conventional Commits**, subject en **español**, ≤72 chars.
- PR hacia `develop`, título conventional, **squash**, 1 aprobación.
- `Closes #N` en el cuerpo del PR (en su propia línea).

## Referencias

- `references/workflow.md` — ramas, commits, PR, plantilla y checks de CI de este repo.
- `references/consuming-api.md` — cómo llamar a la API y manejar el envelope.
