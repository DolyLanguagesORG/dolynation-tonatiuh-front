# AGENTS.md — `dolynation-tonatiuh-front`

Instrucciones para agentes de código (Claude Code, Codex, OpenCode, Cursor, etc.)
que trabajen en este repositorio.

## Skills de este repo

Están en `.agents/skills/` y se cargan bajo demanda:

- **`nextjs-frontend`** — cómo trabajar aquí: Next.js 16.4 (App Router),
  comandos (`lint`, `typecheck`, `build`, `verify`), estructura, cómo consumir la
  API y cómo subir cambios (rama, commit, PR, checks).

Cuando la tarea encaje con una skill, léela antes de actuar.

## Reglas rápidas

- Rama nueva desde `develop` (es la rama por defecto). **Nunca** push directo a
  `develop` ni a `main`.
- Antes de commitear: `npm run verify` (lint + typecheck).
- Commits en **Conventional Commits**, subject en **español**, un concern por commit.
- PR hacia `develop`, título conventional, **squash**, 1 aprobación.
- `Closes #N` en el cuerpo del PR (en su propia línea).

## Skills generales de la organización

El flujo de trabajo global, el anteproyecto y la documentación oficial viven en
el repo de docs:

- https://github.com/DolyLanguagesORG/dolynation-ehecatl-docs

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
