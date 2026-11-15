# Changelog

Todas las novedades relevantes de este repositorio se registran aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el
versionado es [SemVer](https://semver.org/lang/es/).

La **versión vive en `package.json`**: el tag de la release y el `CHANGELOG.md`
deben coincidir con ella. El versionado es automático: `release-please` mantiene
un PR de release contra `develop` que sube la versión y escribe esta sección; al
mergearlo se crean el tag anotado y la GitHub Release. Ver
[`conventions/versioning.md`](https://github.com/DolyLanguagesORG/dolynation-ehecatl-docs/blob/develop/conventions/versioning.md).

## [0.5.0](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/compare/v0.4.0...v0.5.0) (2026-11-13)


### Features

* **readings:** formulario de seleccion de parametros de estudio ([#83](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/83)) ([fb0f6ca](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/commit/fb0f6cab2ecc713e5ed692ef6d3b6cc9a3914987))

## [0.4.0](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/compare/v0.3.3...v0.4.0) (2026-11-12)


### Features

* **auth:** maquetar e integrar vistas de login y registro ([#70](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/70)) ([2e43c2f](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/commit/2e43c2fa61060a589aa9e74179bc771c3771c79e))
* **kanban:** las issues pasan a 'In Review' solas ([#75](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/75)) ([cf49b60](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/commit/cf49b605e3a33d99e31cf6e60cfe361274615073)), closes [#66](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/66)
* **kanban:** las issues pasan a 'In Review' solas ([#76](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/76)) ([9cd786f](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/commit/9cd786fbf9a20c8ceab77dc2bcd5b50973556233)), closes [#66](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/66)
* **kanban:** las issues pasan a 'In Review' solas ([#77](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/77)) ([ba80d67](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/commit/ba80d674d3148bf90a2846a894c2fe3fff68e901)), closes [#66](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/66)
* **kanban:** las issues pasan a 'In Review' solas ([#78](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/78)) ([5488a84](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/commit/5488a8413f2138f6bc117f90a5b777a6e1643ce2)), closes [#66](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/66)
* **kanban:** las issues pasan a 'In Review' solas ([#79](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/79)) ([433bb92](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/commit/433bb922d77f38b29fcdbf723ac1c340ed7eca7d)), closes [#66](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/66)
* **kanban:** las issues pasan a 'In Review' solas ([#80](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/80)) ([2967e99](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/commit/2967e99ed91e3dd504de853ccd992229135fcb84)), closes [#66](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/66)


### Bug Fixes

* **ci:** el .env del servidor se escribe con umask 077 y la llave del host se fija ([#73](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/73)) ([346f215](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/commit/346f2153c8bfd8c4472cea9d21b506cf503a723b)), closes [#6](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/6)
* **ci:** validar la rama normalizada (los acentos no bloquean el PR) ([#71](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/71)) ([17d139e](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/commit/17d139e777878193b3078187a6d2ed319c83aa36)), closes [#46](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/46)
* **ci:** validar los workflows con actionlint ([#81](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/81)) ([1bb4b4d](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/commit/1bb4b4d36c53aff98863184dafddf5b8f84ac9d1)), closes [#46](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/46)

## [0.3.3](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/compare/v0.3.2...v0.3.3) (2026-11-09)


### Bug Fixes

* **ci:** la APP_VERSION de la imagen sale del manifiesto cuando no hay tag ([#61](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/61)) ([1705e2c](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/commit/1705e2cedb81dea47f766fdbc3e7c8888da083ca)), closes [#43](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/43)

## [0.3.2](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/compare/v0.3.1...v0.3.2) (2026-11-09)


### Bug Fixes

* **ci:** autenticar en GHCR con el PAT ([#59](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/59)) ([b848b5b](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/commit/b848b5b5ea6cbdaded1abde125179c8b4918091b)), closes [#43](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/43)
* **ci:** construir la imagen multi-arquitectura (amd64 y arm64) ([#60](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/60)) ([6e5c4aa](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/commit/6e5c4aad06b8f6dfe8515f063870991d36d3aa75)), closes [#43](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/43)
* **ci:** escribir las etiquetas multi-linea con el delimitador de GITHUB_OUTPUT ([#57](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/57)) ([ad75f51](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/commit/ad75f51bb609697553a00808d8a5dec1f0a0425b)), closes [#43](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/43)

## [0.3.1](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/compare/v0.3.0...v0.3.1) (2026-11-09)


### Bug Fixes

* **ci:** construir la imagen con expresiones validas y etiquetas inmutables ([#56](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/56)) ([bb637ae](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/commit/bb637aea960d8abc5392accaae1885baf521b448)), closes [#43](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/43)
* **release:** activar el auto-merge aunque el PR de release ya exista ([#52](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/52)) ([ea6a8c8](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/commit/ea6a8c8f3783eb9fdfe7f247ead14b1634aa4106)), closes [#4](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/4)

## [0.3.0](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/compare/v0.2.1...v0.3.0) (2026-11-08)


### Features

* **docker:** imagen del frontend para staging y produccion ([#53](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/53)) ([8db9155](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/commit/8db9155e2a840073336e2f5c6e55f56f46da503e)), closes [#27](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/27)


### Bug Fixes

* **ci:** enviar el nombre del repositorio en el aviso al manifiesto ([#49](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/49)) ([a64b21a](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/commit/a64b21a3c7d14e1810a856ee0159ac8b50b9bde5))

## [0.2.1](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/compare/v0.2.0...v0.2.1) (2026-11-06)


### Bug Fixes

* **ci:** separar el checkout del paso que anota el tag ([#47](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/issues/47)) ([a93a280](https://github.com/DolyLanguagesORG/dolynation-tonatiuh-front/commit/a93a280d63c740f920f50d0c74e424861a5e1ba5))

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
