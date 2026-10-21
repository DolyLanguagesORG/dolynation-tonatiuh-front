# Flujo de trabajo — `dolynation-tonatiuh-front`

Cómo subir cambios en **este** repositorio: rama, commits, PR, checks y
plantilla. Es la parte "de este repo" del flujo global (el global completo vive
en `dolynation-ehecatl-docs`).

## Ramas

| Rama | Qué es |
| ---- | ------ |
| `develop` | **Rama por defecto.** Integración diaria. Aquí apuntan los PR de trabajo. |
| `main` | Producción. Solo recibe PR desde `develop` o `hotfix/*`. |
| `hotfix/*` | Corrección urgente que sale de `main` y vuelve a `develop`. |

**Nunca** hagas push directo a `develop` ni a `main`: están protegidas y exigen
PR + 1 aprobación. Toda rama de trabajo **sale de `develop`**.

### Nombre de la rama

Formato: `tipo/issue-<n>-<módulo>-<detalle>`. Se aceptan dos variantes:

- Con prefijo (recomendado): `feat/issue-12-auth-login-page`,
  `fix/issue-45-header-overflow`, `docs/issue-20-readme`.
- Formato del botón *Create a branch* de GitHub: `12-auth-login-page`.
- Máximo 50 caracteres, kebab-case, sin espacios ni acentos.

El número de issue es obligatorio (`issue-<n>`) para trazar la tarea en el
tablero.

## Commits

**Conventional Commits.** Lo valida `commitlint` en local (husky). CI **no**
revisa los mensajes de commit, solo el título del PR: no confíes en `--no-verify`.

```
<tipo>(<scope>): <subject imperativo, español, ≤72>
```

Tipos: `feat` `fix` `refactor` `docs` `test` `chore` `build` `ci` `perf` `style`.
Breaking change: `feat(api)!: ...`.

Scopes usados: `auth` `readings` `ia` `users` `errors` `docs` `deps` `db` `prod`
`infra` `cleanup` `repo` (en front lo normal es `ui`/`repo`/`deps`; si necesitas
uno nuevo, documéntalo).

- **Un concern por commit** (commits pequeños): se revisan y se revierten mejor.
- Subject en **español**, imperativo, ≤72 caracteres.

Ejemplos:

```
feat(ui): agrega pantalla de login
fix(ui): corrige el logo en móvil
chore(deps): actualiza next a 16.4.1
```

## Verificar antes de commitear

```bash
npm run verify   # lint + typecheck
```

Cubre lo que CI va a revisar (menos el `build`, que también puedes correr con
`npm run build`). Si `verify` falla, no commitees.

## Abrir el PR

1. Sube la rama:

   ```bash
   git push -u origin feat/issue-12-login-page
   ```

2. Crea el PR **hacia `develop`**:

   ```bash
   gh pr create --base develop \
     --title "feat(ui): agrega pantalla de login" \
     --body "## Resumen
   - Pantalla de login con validación

   Closes #12"
   ```

3. La **plantilla** `.github/PULL_REQUEST_TEMPLATE.md` se rellena sola. Debe
   quedar así:
   - `## Resumen`: 1-3 bullets.
   - `## Tipo de cambio`: marca el checkbox que corresponda.
   - `## Issue / contexto`: `Closes #<n>` (en su **propia línea**).
   - `## Rama base`: marca que apunta a `develop`.
   - `## Checklist`: `verify` ✓, `build` ✓, tests (hoy N/A), rama al día, sin
     secretos/`.env`/generados, commits conventional.

## `Closes`, no `Refs`

- `Closes #12` en el **cuerpo** del PR: al mergear en `develop`, cierra el issue
  y el workflow `pr-labels` le **copia las etiquetas** `sprint-*` y `area:*` al PR.
- La palabra debe **empezar la línea** (sirve `- Closes #12` o `Closes #12`).
  Si aparece mencionada dentro de una frase, no cuenta.
- `Refs #12` **no** cierra ni copia etiquetas (solo menciona).
- El PR de release `develop` → `main` usa **`Refs`**, nunca `Closes` (apunta a
  `main`, y ahí la palabra de cierre se ignora).

## Checks de CI que bloquean el merge

Del workflow `frontend` (`.github/workflows/ci-frontend.yml`) y `pr-title`:

| Check | Qué valida |
| ----- | ---------- |
| `lint` | ESLint + el test del regex de `pr-labels` |
| `typecheck` | `next typegen && tsc --noEmit` |
| `build` | que Next compile (`next build`) |
| `pr-title` | que el título del PR sea Conventional Commits |
| `pr-target` | rama base (`develop`/`main`) y rama origen válidas |

Mientras un check esté rojo o en cola, GitHub **no** habilita el merge. Se
requiere además **1 aprobación** de otra persona (no puedes aprobar tu propio PR)
y que las conversaciones estén resueltas. El merge es **squash** siempre.

## Después de mergear

1. El issue se cierra solo (si usaste `Closes #N` y el PR apuntaba a `develop`).
2. La rama se borra sola.
3. La **tarjeta del tablero NO se mueve sola**: muévela tú de `In Review` a
   `Done` en el Project de la organización.
