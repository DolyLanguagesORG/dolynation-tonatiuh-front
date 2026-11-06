# Changelog

Todas las novedades relevantes de este repositorio se registran aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el
versionado es [SemVer](https://semver.org/lang/es/).

La **versión vive en `package.json`**: el tag de la release y el `CHANGELOG.md`
deben coincidir con ella, y el workflow `release.yml` lo verifica antes de
publicar. Ver [`conventions/versioning.md`](https://github.com/DolyLanguagesORG/dolynation-ehecatl-docs/blob/develop/conventions/versioning.md).

## [0.2.0](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/compare/v0.1.1...v0.2.0) (2026-11-06)


### Features

* **api:** proxear la API del backend desde Next.js ([#36](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/36)) ([9b2b15f](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/commit/9b2b15f4fefabbd1012302b9140a131e3cfa4cca))
* **ui:** configura layout base, tema blanco y negro y cliente http ([#31](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/31)) ([e07d88f](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/commit/e07d88fd1d2a458b3eb3434d4b86cada4155f242))


### Bug Fixes

* **ci:** compartir el agente SSH entre todos los pasos del workflow ([#38](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/38)) ([9dcc553](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/commit/9dcc5537755345b4c3dd98d9073ebdf31ffc92d7))
* **ci:** desplegar con la llave cifrada y escribir BACKEND_INTERNAL_URL ([#37](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/37)) ([f4a881d](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/commit/f4a881d6635ce32ff87dca8fa581d153458f9496))
* **ci:** eximir a Dependabot de la validacion y evitar majors incompatibles ([#35](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/35)) ([5d6e4af](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/commit/5d6e4af5b9b3f50832d947f223b7964c9e807684))
* **ci:** reportar el estado del deployment a GitHub ([#41](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/41)) ([0d15ffa](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/commit/0d15ffad17e92713ccf7c8b87faf73641455b923))

## [No publicado]

### Añadido
- Devcontainer para trabajar en Codespaces con Node 22, Docker y `gh`.

### Cambiado
- La versión de `package.json` pasa de `0.1.0` a `0.1.1`, que es la release
  real del repositorio.

## [0.1.1] - 2026-10-12

### Añadido
- Correcciones de CI y de configuración de la plantilla de pull request.

## [0.1.0] - 2026-10-12

### Añadido
- Estructura inicial del repositorio con Next.js 16, TypeScript y Tailwind CSS 4.

[No publicado]: https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/releases/tag/v0.1.1
[0.1.0]: https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/releases/tag/v0.1.0
