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
