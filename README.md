# DolyNation Frontend — `dolynation-tonatiuh-front`

Aplicación web de **DolyNation**, plataforma académica de adquisición lingüística mediante lectura contextual asistida por inteligencia artificial y evaluación CEFR. Construida con **Next.js 16.4.0** (App Router), **React 19** y **Tailwind CSS 4**.

> El backend vive en
> [`dolynation-atl-back`](https://github.com/DolyLanguagesORG/dolynation-atl-back),
> la infraestructura y el schema en
> [`dolynation-tlalli-infra`](https://github.com/DolyLanguagesORG/dolynation-tlalli-infra)
> y la documentación de proyecto en
> [`dolynation-ehecatl-docs`](https://github.com/DolyLanguagesORG/dolynation-ehecatl-docs).

## Stack

- **Framework**: Next.js 16.4 (App Router, Turbopack)
- **UI & Tema**: React 19 + Tailwind CSS 4 + Flowbite (`flowbite-react` + tema `@theme` generado con Flowbite MCP y adaptado al estilo editorial de DolyNation)
- **Tipografía**: `Newsreader` (serif editorial), `Geist` (sans de interfaz) y `Geist Mono` (metadatos y códigos)
- **Lenguaje**: TypeScript 5 (modo estricto)
- **Linter**: ESLint 9 (`eslint-config-next`)

## Requisitos

- Node ≥ 22
- npm ≥ 11

## Variables de entorno y arranque local

1. **Copia la plantilla de variables de entorno:**

   ```bash
   cp .env.example .env.local
   ```

2. **Ajusta `BACKEND_INTERNAL_URL` en `.env.local`:**

   ```dotenv
   BACKEND_INTERNAL_URL=http://localhost:3333/api/v1
   ```

   | Variable               | Requerida | Ejemplo                        | Descripción                                                          |
   | ---------------------- | --------- | ------------------------------ | -------------------------------------------------------------------- |
   | `BACKEND_INTERNAL_URL` | Sí        | `http://localhost:3333/api/v1` | URL del backend NestJS (`dolynation-atl-back`), solo para el servidor |

   Esta variable la consume **únicamente** el proxy de Next.js
   (`src/app/api/v1/[...path]/route.ts`): el navegador nunca ve la dirección
   del backend, solo habla con `/api/v1/...` en su propio origen.

   - **Fuera de Docker** (este README): `http://localhost:3333/api/v1`, que es
     donde escucha el backend levantado con `npm run start:dev`.
   - **Dentro de Docker Compose** (`dolynation-tlalli-infra`): el valor de
     `.env.example`, `http://backend:3333/api/v1`, porque el backend es el
     servicio `backend` de la red `doly-dev-net`.

   Si dejas el valor de Docker y levantas el frontend en tu máquina, la
   página carga pero el proxy responde `503 SERVICE_UNAVAILABLE`: el nombre
   `backend` solo se resuelve dentro de la red de Compose.

3. **Instala dependencias e inicia el servidor de desarrollo:**

   ```bash
   npm ci
   npm run dev
   ```

   Abre <http://localhost:3000>.

4. **Verifica calidad y compilación antes de commitear:**

   ```bash
   npm run verify
   npm run build
   ```

## Scripts

| Script              | Qué hace                                                    |
| ------------------- | ----------------------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo con hot-reload (`next dev`)          |
| `npm run build`     | Build de producción (`next build`)                          |
| `npm run start`     | Sirve el build de producción (`next start`)                 |
| `npm run lint`      | Ejecuta ESLint sobre el proyecto                            |
| `npm run typecheck` | Genera tipos de rutas (`next typegen`) y corre `tsc --noEmit` |
| `npm run verify`    | Ejecuta `lint` + `typecheck` (validación previa a commit)   |

## Estructura del proyecto

```text
src/
├── app/                        # App Router: layouts, rutas y estados globales
│   ├── api/v1/[...path]/       # Proxy BFF hacia BACKEND_INTERNAL_URL + cookies HttpOnly de refresh
│   ├── login/page.tsx          # Vista de Inicio de Sesión (Reanudar DolySesion)
│   ├── register/page.tsx       # Vista de Registro de Usuario (Crear DolyCuenta)
│   ├── layout.tsx              # RootLayout con fuentes, LocaleProvider, AuthProvider y AppShell
│   ├── page.tsx                # Vista de Inicio (racha, generador IA, lecturas y kit UI)
│   ├── loading.tsx             # Skeleton accesible de carga de ruta
│   ├── error.tsx               # Error boundary global con recuperación
│   ├── not-found.tsx           # Vista 404 editorial
│   ├── globals.css             # Tokens de tema (:root + @theme inline) y utilidades a11y
│   └── favicon.ico
├── components/
│   ├── auth/                   # Protección de rutas privadas
│   │   ├── require-auth.tsx    # Guardia de sesión que redirige a /login?redirect=<ruta>
│   │   └── index.ts
│   ├── layout/                 # Shell responsivo de la aplicación
│   │   ├── app-shell.tsx       # Estructura principal (SkipLink + Header + Sidebar + Main + Footer)
│   │   ├── header.tsx          # Barra superior con marca, selector de edición, racha y sesión
│   │   ├── sidebar.tsx         # Navegación lateral fija en escritorio y drawer en móvil/tablet
│   │   ├── footer.tsx          # Pie de página institucional
│   │   └── index.ts
│   └── ui/                     # Componentes base reutilizables y accesibles (Flowbite B&W)
│       ├── alert.tsx           # Alertas semánticas y bloques de observación con citas
│       ├── badge.tsx           # Clasificadores lingüísticos ([EN] INGLÉS, NIVEL MEDIO, etc.)
│       ├── button.tsx          # Botón con variantes, tamaños, carga y foco visible
│       ├── card.tsx            # Superficies editoriales (default, subtle, outline, dark)
│       ├── checkbox.tsx        # Casilla de verificación accesible en Blanco y Negro
│       ├── container.tsx       # Contenedor responsivo con anchos controlados (sm, md, lg, xl)
│       ├── flowbite-theme.ts   # Tema centralizado de flowbite-react (Blanco y Negro)
│       ├── input.tsx           # Input con label explícito, hint, error y estados accesibles
│       └── index.ts
├── context/                    # Contexto global de autenticación y sesión
│   ├── auth-context.tsx        # AuthProvider y hook useAuth() con accessToken en memoria
│   └── index.ts
├── hooks/                      # Hooks reutilizables de cliente
│   ├── use-api-request.ts      # Estado reactivo para peticiones al httpClient
│   ├── use-disclosure.ts       # Control de menús/drawers con cierre por tecla Escape
│   └── index.ts
├── i18n/                       # Internacionalización (Español Académico / English Academic)
│   ├── dictionaries.ts         # Diccionarios tipados ES/EN (incluye vistas auth)
│   ├── locale-context.tsx      # Proveedor y hook useLocale()
│   └── index.ts
└── lib/                        # Configuración de entorno, cliente HTTP y cliente Auth
    ├── env.ts                  # Resolución del proxy interno /api/v1
    ├── api-errors.ts           # Envelope ApiResponse<T>, ErrorCode y clase ApiClientError
    ├── auth-token-store.ts     # Almacén en memoria para accessToken y single-flight refresh
    ├── auth-client.ts          # Cliente para /auth/register, /auth/login, /auth/refresh, /auth/logout y /auth/me
    ├── http-client.ts          # Cliente fetch con Bearer automático e interceptor de 401 -> refresh
    └── index.ts
```

## Cómo agregar una vista nueva

1. **Crea la carpeta de la ruta bajo `src/app/<ruta>/page.tsx`:**
   El `RootLayout` (`src/app/layout.tsx`) ya envuelve todas las páginas dentro de `AppShell` (header, navegación lateral y footer).

2. **Estructura la vista con `Container` y los componentes de `@/components/ui`:**

   ```tsx
   import { Button, Card, Container, Input } from "@/components/ui";

   export default function ProfilePage() {
     return (
       <Container size="lg" className="flex flex-col gap-6">
         <h1
           id="main-heading"
           tabIndex={-1}
           className="font-serif text-3xl text-ink"
         >
           Perfil y Progreso
         </h1>
         <Card padding="lg">
           <Input
             label="Correo electrónico institucional"
             type="email"
             placeholder="elena.rostova@academica.edu"
           />
           <div className="mt-4">
             <Button variant="primary">Guardar cambios</Button>
           </div>
         </Card>
       </Container>
     );
   }
   ```

   > **Nota de accesibilidad:** Asigna `id="main-heading" tabIndex={-1}` al `<h1>` principal de cada página para que el enlace de salto (*"Saltar al contenido principal"*) dirija el foco directamente al encabezado.

3. **Consume el backend mediante `httpClient` (`@/lib`):**
   Nunca hardcodees la URL del backend ni parsees `error.message`; discrimina siempre por `error.code` (`ErrorCode`):

   ```ts
   import { ApiClientError, ErrorCode, httpClient } from "@/lib";

   try {
     const { data } = await httpClient.get<UserProfile>("/auth/me", {
       accessToken,
     });
     return data;
   } catch (error) {
     if (
       error instanceof ApiClientError &&
       error.code === ErrorCode.AUTH_TOKEN_EXPIRED
     ) {
       // Renovar sesión o redirigir a login
     }
     throw error;
   }
   ```

## CI/CD

Workflows en `.github/workflows/`:

| Workflow | Checks | Qué valida |
| --- | --- | --- |
| `ci-frontend.yml` | `lint`, `typecheck`, `build` | lint, tipos y compilación |
| `pr-title.yml` | `pr-title`, `pr-target` | el título del PR y las ramas base y origen |
| `pr-labels.yml` | `pr-labels` | copia al PR las etiquetas `sprint-*` y `area:*` del issue |

`release.yml` corre al mergear en `main` y publica el tag.

## Convenciones

Ver [`docs/conventions/README.md`](./docs/conventions/README.md) y las convenciones centrales en
[`dolynation-ehecatl-docs`](https://github.com/DolyLanguagesORG/dolynation-ehecatl-docs/tree/develop/conventions).

## License

`UNLICENSED`. El repositorio es público, pero no se ha definido una licencia
abierta, así que todos los derechos quedan reservados.
