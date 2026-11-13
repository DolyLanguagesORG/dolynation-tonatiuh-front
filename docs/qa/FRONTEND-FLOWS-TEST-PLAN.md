# Plan Maestro de Pruebas y Flujos del Frontend — DolyNation

> **Documento vivo de verificación funcional y de calidad (QA Frontend).**
>
> Espejo del plan crítico del backend ([`BACKEND-FLOWS-TEST-PLAN.md`](../../../dolynation-atl-back/docs/qa/BACKEND-FLOWS-TEST-PLAN.md)) adaptado al comportamiento real de navegación, guardias React/Next.js, formularios, BFF proxy e interacciones de usuario final en `dolynation-tonatiuh-front`.

---

## 1. Alcance y Reglas Verificadas en Frontend

- **Idiomas soportados:** `es` (Español), `en` (Inglés), `fr` (Francés), `it` (Italiano).
- **Planes de suscripción:**
  - `null` (sin plan): acceso restringido exclusivamente a `/select-plan` y acciones de cierre de sesión (`RequireSubscription`).
  - `dolly`: 1 idioma activo simultáneo, 10 lecturas/día, 1 cambio libre cada 365 días o mediante crédito (`unlock-change`).
  - `dolly_plus`: hasta 2 idiomas activos simultáneos, 20 lecturas/día. Elegir **1 idioma** ya habilita la generación de lecturas; agregar el **2.º idioma libre** en `/profile` muestra el indicador `1 CUPO LIBRE` y no consume bloqueo anual ni crédito (`T4-A`). El bloqueo anual de 365 días entra en vigor hasta completar ambos cupos (`2/2 CUPOS ACTIVOS`).
  - `dolly_pro`: 4 idiomas abiertos (`es, en, fr, it`), sin límite diario de lecturas ni bloqueo anual mientras permanezca en Pro.
- **Límite de lecturas pendientes:** máximo 3 pendientes (`status = "pending"`); eliminar o evaluar una lectura libera el cupo en UI y API.
- **Categorías:** mínimo **3** para guardar preferencias iniciales; las personalizadas pasan por moderación (con preservación de borrador ante rechazo `CATEGORY_MODERATION_REJECTED`) y tope diario (`CATEGORY_DAILY_LIMIT_REACHED`).

---

## 2. Matriz Resumen de Verificación

| ID | Flujo / Regla Crítica | Comportamiento Esperado en Frontend | Cobertura Jest / Playwright |
|---|---|---|---|
| **F1** | Usuario registrado **sin correo verificado** | Bloqueo en `/verify-email` (`VALIDACIÓN PENDIENTE`); intentar navegar a `/`, `/generate`, `/readings`, `/glossary`, `/profile`, `/select-plan` o `/setup-preferences` redirige de vuelta; login rechazado con `AUTH_EMAIL_NOT_VERIFIED`; token inválido muestra `ENLACE INVÁLIDO`; token válido autentica y redirige a `/select-plan` | `route-access-service.test.ts` · `route-guards.test.tsx` · `auth-context.test.tsx` · `onboarding-gating.spec.ts` |
| **F2** | Usuario verificado **sin plan seleccionado** (`T1`) | Redirección forzada a `/select-plan` desde cualquier vista operativa; shell mínimo oculta navegación del workspace; tras elegir plan avanza a `/setup-preferences` | `route-access-service.test.ts` · `route-guards.test.tsx` · `onboarding-gating.spec.ts` |
| **F3** | Plan elegido (`dolly` / `dolly_plus`) **sin idiomas configurados** | Banner de bloqueo en `/`; `/generate` muestra alerta de idioma faltante y deshabilita `"GENERAR Y COMENZAR LECTURA"` (0 peticiones `POST /readings`); elegir 1 idioma en `dolly_plus` habilita generar y deja el 2.º cupo libre en `/profile` | `study-parameters-form.test.tsx` · `learning-preferences-card.test.tsx` · `onboarding-gating.spec.ts` |
| **T2 / T2-A** | Máximo **3 lecturas pendientes** + liberación al borrar/evaluar | Al intentar generar la 4.ª muestra `READING_PENDING_LIMIT_REACHED` con enlace a `/readings`; confirmar borrado reduce a 2 y habilita nueva lectura | `study-parameters-form.test.tsx` · `subscription-language-flows.spec.ts` |
| **T3** | `dolly`: bloqueo de idioma y desbloqueo por crédito | `BLOQUEADO ANUAL` deshabilita selector alterno; pagar `+1 crédito` en modal habilita cambio, consume crédito al guardar y vuelve a bloquear | `subscription-language-flows.spec.ts` |
| **T4 / T4-A** | `dolly_plus`: reordenamiento gratis y cupo libre | Botón `Priorizar` reordena idiomas activos (`PUT /settings/languages/reorder`) sin gastar créditos; llenar el 2.º cupo libre funciona sin bloqueo anual | `learning-preferences-card.test.tsx` · `subscription-language-flows.spec.ts` |
| **T5** | Límite diario por plan (incl. soft-delete) | Muestra `READING_DAILY_LIMIT_REACHED` (`429`); eliminar una lectura del día en `/readings` NO reembolsa cuota diaria | `study-parameters-form.test.tsx` · `subscription-language-flows.spec.ts` |
| **T6 + Reset** | `logout-all` y restablecimiento de contraseña | Confirmar cierre global revoca sesión (`doly_session`), limpia contexto y redirige a `/login`; `/forgot-password` y `/reset-password` validan tokens válidos/inválidos (`AUTH_EMAIL_TOKEN_INVALID`) | `auth-readings-q1.spec.ts` |
| **T7-A / T7-B** | Downgrade desde `dolly_pro` a `dolly` | Con idiomas guardados recorta a 1 activo y bloquea el excedente; sin idiomas guardados (`[]`) bloquea `/generate` hasta seleccionar 1 | `subscription-language-flows.spec.ts` |
| **T8 / T9** | Moderación y tope diario de categorías personalizadas | Rechazo `CATEGORY_MODERATION_REJECTED` (`400`) y cuota `CATEGORY_DAILY_LIMIT_REACHED` (`429`) conservan el texto escrito para corrección; válida limpia y persiste | `learning-preferences-card.test.tsx` · `study-parameters-form.test.tsx` · `subscription-language-flows.spec.ts` |
| **Q1** | Ciclo completo 4 idiomas + glosario + evaluación + borrador | Pro expone `es/en/fr/it`; lectura genera explicación contextual IA y guarda en `/glossary`; resumen `<15` palabras bloqueado; borrador persiste tras reload; envío navega a `/readings/[id]/result` | `use-reading-evaluation.test.tsx` · `reading-utils.test.ts` · `auth-readings-q1.spec.ts` |

---

## 3. Arquitectura de Pruebas en Frontend

### Pruebas Unitarias y de Integración (`npm test` — Jest + RTL)

Ubicadas junto al código fuente (`src/**/*.test.{ts,tsx}`):

- [`src/lib/services/route-access-service.test.ts`](../../src/lib/services/route-access-service.test.ts)
- [`src/lib/api-errors.test.ts`](../../src/lib/api-errors.test.ts)
- [`src/lib/http-core.test.ts`](../../src/lib/http-core.test.ts)
- [`src/lib/plan-presentation.test.ts`](../../src/lib/plan-presentation.test.ts)
- [`src/lib/reading-utils.test.ts`](../../src/lib/reading-utils.test.ts)
- [`src/context/auth-context.test.tsx`](../../src/context/auth-context.test.tsx)
- [`src/components/auth/route-guards.test.tsx`](../../src/components/auth/route-guards.test.tsx)
- [`src/components/study/study-parameters-form.test.tsx`](../../src/components/study/study-parameters-form.test.tsx)
- [`src/app/profile/_components/learning-preferences-card.test.tsx`](../../src/app/profile/_components/learning-preferences-card.test.tsx)
- [`src/app/readings/[id]/evaluate/_hooks/use-reading-evaluation.test.tsx`](../../src/app/readings/[id]/evaluate/_hooks/use-reading-evaluation.test.tsx)

### Pruebas End-to-End en Navegador (`npm run test:e2e` — Playwright)

- [`e2e/support/mock-api.ts`](../../e2e/support/mock-api.ts): simulador stateful determinista de `/api/v1/*` con sincronización real de cookie `doly_session` para validar `middleware.ts`, guardias SSR/CSR y reglas T1–T9 / Q1.
- [`e2e/onboarding-gating.spec.ts`](../../e2e/onboarding-gating.spec.ts): flujos obligatorios F1, F2, F3 y T4-A (`dolly_plus` 1 vs 2 idiomas).
- [`e2e/subscription-language-flows.spec.ts`](../../e2e/subscription-language-flows.spec.ts): flujos T2, T2-A, T3, T4, T5, T7-A, T7-B, T8 y T9.
- [`e2e/auth-readings-q1.spec.ts`](../../e2e/auth-readings-q1.spec.ts): T6 (`logout-all`), forgot/reset password y circuito completo Q1.
- [`e2e/live-backend.spec.ts`](../../e2e/live-backend.spec.ts): suite smoke contra backend + PostgreSQL reales (`E2E_TARGET=backend`).

---

## 4. Comandos de Ejecución

```bash
# Chequeo estático (ESLint + TypeScript)
npm run verify

# Pruebas unitarias y de componentes (Jest + React Testing Library)
npm test

# Modo watch durante desarrollo
npm run test:watch

# Pruebas E2E deterministas en Chromium (levanta Next dev aislado en .next-playwright, puerto 3100)
npm run test:e2e

# Pruebas E2E contra backend real en ejecución
E2E_TARGET=backend npm run test:e2e:live
```
