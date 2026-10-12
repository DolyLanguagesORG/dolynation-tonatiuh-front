# DolyNation Frontend — `dolynation-tonatiuh-front`

Aplicación web de DolyNation, construida con **Next.js 16.4.0** (App Router),
**React 19** y **Tailwind CSS 4**.

> El backend vive en
> [`dolynation-atl-back`](https://github.com/DolyLanguagesORG/dolynation-atl-back),
> la infraestructura y el schema en
> [`dolynation-tlalli-infra`](https://github.com/DolyLanguagesORG/dolynation-tlalli-infra)
> y la documentación de proyecto en
> [`dolynation-ehecatl-docs`](https://github.com/DolyLanguagesORG/dolynation-ehecatl-docs).

## Stack

- **Framework**: Next.js 16.4 (App Router, Turbopack)
- **UI**: React 19 + Tailwind CSS 4
- **Lenguaje**: TypeScript (estricto)
- **Linter**: ESLint (`eslint-config-next`)

## Requisitos

- Node ≥ 22
- npm ≥ 11

## Empezar

```bash
npm ci
npm run dev
```

Abre <http://localhost:3000>.

## Scripts

| Script              | Qué hace                                  |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Servidor de desarrollo con hot-reload     |
| `npm run build`     | Build de producción                       |
| `npm run start`     | Sirve el build de producción              |
| `npm run lint`      | ESLint                                    |
| `npm run typecheck` | `tsc --noEmit`                            |
| `npm run verify`    | lint + typecheck (todo en uno)            |

## Estructura

```
src/
└── app/            # App Router: layouts, pages, route handlers
    ├── layout.tsx
    ├── page.tsx
    └── globals.css
```

> La UI heredada de `mobile/` (Expo/React Native) se portará a Next.js por
> sprints; ver los issues `area:frontend`.

## CI/CD

Workflows en `.github/workflows/`:

| Workflow | Checks | Qué valida |
| --- | --- | --- |
| `ci-frontend.yml` | `lint`, `typecheck`, `build` | lint, tipos y compilación |
| `pr-title.yml` | `pr-title`, `pr-target` | el título del PR y las ramas base y origen |
| `pr-labels.yml` | `pr-labels` | copia al PR las etiquetas `sprint-*` y `area:*` del issue |

`release.yml` corre al mergear en `main` y publica el tag.

## Convenciones

Ver [`docs/conventions/`](./docs/conventions/README.md) (pendiente de rellenar)
y las convenciones centrales en
[`dolynation-ehecatl-docs`](https://github.com/DolyLanguagesORG/dolynation-ehecatl-docs/tree/develop/conventions).

## License

`UNLICENSED`. El repositorio es público, pero no se ha definido una licencia
abierta, así que todos los derechos quedan reservados.
