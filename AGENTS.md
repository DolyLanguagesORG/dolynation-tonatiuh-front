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

## El carril de la PWA (`feat/issue-131-pwa`)

La **PWA / app offline-first** (la v2 del producto) se trabaja **fuera de
`develop`**, en su propia rama de larga vida: **`feat/issue-131-pwa`**.

| Regla | Detalle |
| --- | --- |
| **Solo entra por PR** | La rama tiene su propia ruleset: push directo bloqueado, squash, 1 aprobación y los 7 checks (`lint`, `typecheck`, `unit`, `e2e`, `build`, `pr-title`, `pr-target`). |
| **Cada cambio en su propia rama** | `feat/131-<que>` sale del carril, se abre PR **contra el carril** y se mergea squash. Nunca se empuja directo al carril. |
| **`develop` no se toca** | Hasta que la PWA esté lista, `develop` sigue siendo la v1. El merge final al carril es una decisión posterior. |
| **Traer `develop` al carril** | `git checkout feat/issue-131-pwa && git merge develop` → PR contra el carril → merge. Se hace **merge** y no rebase: así el diff final hacia `develop` es solo de la PWA. |
| **El backend va aparte** | La idempotencia de `evaluate` es una mejora del backend en sí misma (`back`): su PR va a `develop` normal, no al carril. |

El plan completo está en
[`plan/PLAN-PWA-OFFLINE.md`](https://github.com/DolyLanguagesORG/dolynation-ehecatl-docs/blob/develop/plan/PLAN-PWA-OFFLINE.md).
La issue con el detalle: [`front#131`](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/131).

## Skills generales de la organización

El flujo de trabajo global, el anteproyecto y la documentación oficial viven en
el repo de docs:

- https://github.com/DolyLanguagesORG/dolynation-ehecatl-docs

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
