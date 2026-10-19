# Consumir la API del backend

El frontend habla con `dolynation-atl-back` (NestJS). Todas sus respuestas usan
un **envelope único** y un **catálogo de códigos de error**.

## Envelope

```ts
interface ApiResponse<T = unknown> {
  message: string;              // texto legible (en inglés), para mostrar o loguear
  data: T;                      // carga útil en éxito; null en error
  error?: {
    code: string;               // string estable — decisiona con esto
    message: string;            // mensaje seguro (en inglés)
    details?: Record<string, unknown>;
  };
}
```

Regla: **decide siempre por `error.code`**, nunca parseando `message` (el
message puede cambiar; el code no).

```ts
const res = await fetch(`${API_URL}/api/v1/readings`, { /* ... */ });
const body = (await res.json()) as ApiResponse<Reading[]>;

if (body.error) {
  switch (body.error.code) {
    case 'AUTH_TOKEN_EXPIRED':
      // renovar token y reintentar
      break;
    default:
      // mensaje genérico
  }
} else {
  // usar body.data
}
```

## URL base y prefijo

- Prefijo global de rutas: **`/api/v1`**.
- En local, el backend corre en `http://localhost:3333`, así que una ruta real
  es `http://localhost:3333/api/v1/...`.
- Define la URL base por variable de entorno (p. ej. `NEXT_PUBLIC_API_URL`) en
  un `.env.local`; **nunca** hardcodees la URL de producción en el código.

## Errores más comunes

| `code` | HTTP | Qué hacer en el front |
| ------ | ---- | --------------------- |
| `VALIDATION_ERROR` | 400 | Mostrar `error.details.fields[]` junto a cada input. |
| `AUTH_INVALID_CREDENTIALS` | 401 | Mensaje genérico "credenciales incorrectas". |
| `AUTH_TOKEN_EXPIRED` | 401 | Renovar con refresh token y reintentar. |
| `AUTH_TOKEN_INVALID` | 401 | Forzar logout / re-login. |
| `AUTH_UNAUTHORIZED` | 401 | Ruta protegida sin sesión → redirigir a login. |
| `AUTH_EMAIL_ALREADY_EXISTS` | 409 | Avisar en el formulario de registro. |
| `RESOURCE_NOT_FOUND` | 404 | Estado "no encontrado" en la vista. |
| `RESOURCE_FORBIDDEN` | 403 | Estado "sin permiso". |
| `READING_PENDING_LIMIT_REACHED` | 400 | Bloquear generación; pedir completar lecturas. |
| `READING_ALREADY_EVALUATED` | 400 | Deshabilitar re-evaluación. |
| `INTERNAL_ERROR` | 500 | Mensaje genérico; loguear el `code`. |
| `SERVICE_UNAVAILABLE` | 503 | Reintentar / avisar que el servicio no está. |

(El catálogo completo es la fuente de verdad en el backend:
`src/common/errors/error-codes.ts`.)

## Autenticación

- El access token va en `Authorization: Bearer <token>`.
- El token va **firmado por el backend** (JWT). No lo inspecciones para tomar
  decisiones de negocio; usa los endpoints.
- La expiración se refleja en `AUTH_TOKEN_EXPIRED`; hay refresh.

## Notas

- En Next (App Router), prefiere hacer fetch en **Server Components** cuando los
  datos no dependen de interacción; usa Client Components + hooks solo para
  estado interactivo.
- No filtres datos sensibles solo en el front: el backend es la autoridad.
