"use client";

import { useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  Eyebrow,
  Heading,
  Icon,
  ProgressBar,
  SkeletonCard,
  Text,
} from "@/components/ui";
import { type Locale } from "@/i18n";
import {
  type SubscriptionPlanItem,
  type SubscriptionTier,
  type SubscriptionUsage,
  type UserSubscriptionResponse,
} from "@/lib";
import { formatPlanFromBackend } from "@/lib/plan-presentation";

export interface SubscriptionPlanCardProps {
  locale: Locale;
  currentSubscription: UserSubscriptionResponse | null;
  plans: readonly SubscriptionPlanItem[];
  isLoadingPlans: boolean;
  plansError: string | null;
  isSavingPlan: boolean;
  isLoggingOutAll: boolean;
  onSelectPlan: (tier: SubscriptionTier) => Promise<boolean>;
  onLogoutAll: () => Promise<void>;
}

interface QuotaRowProps {
  label: string;
  used: number;
  limit: number | null;
  remaining?: number | null;
  locale: Locale;
}

function QuotaMeter({
  label,
  used,
  limit,
  remaining,
  locale,
}: QuotaRowProps) {
  const pct =
    limit !== null && limit > 0
      ? Math.min(100, Math.round((used / limit) * 100))
      : 0;
  const isExhausted =
    limit !== null && (remaining === 0 || (remaining == null && used >= limit));
  const valueLabel =
    limit === null
      ? `${used} / ∞`
      : `${used} / ${limit}`;

  return (
    <div className="flex flex-col gap-2 rounded-base border border-default bg-neutral-primary-soft p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-bold tracking-wider text-muted uppercase">
          {label}
        </span>
        <Badge variant={limit === null ? "secondary" : isExhausted ? "warning" : "outline"}>
          {limit === null
            ? locale === "es"
              ? "ILIMITADO"
              : "UNLIMITED"
            : locale === "es"
              ? `${remaining ?? Math.max(0, limit - used)} RESTANTES`
              : `${remaining ?? Math.max(0, limit - used)} LEFT`}
        </Badge>
      </div>

      {limit !== null ? (
        <ProgressBar
          value={pct}
          valueLabel={valueLabel}
          size="sm"
          color={isExhausted ? "yellow" : "default"}
        />
      ) : (
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-base font-bold text-heading tabular-nums">
            {used}
          </span>
          <span className="font-mono text-[11px] text-muted uppercase">
            {locale === "es" ? "Sin tope diario" : "No daily cap"}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Tarjeta de suscripción activa, consumo real diario/de plan, cambio de plan
 * y cierre global de sesiones en `/profile#subscription`.
 */
export function SubscriptionPlanCard({
  locale,
  currentSubscription,
  plans,
  isLoadingPlans,
  plansError,
  isSavingPlan,
  isLoggingOutAll,
  onSelectPlan,
  onLogoutAll,
}: SubscriptionPlanCardProps) {
  const [confirmingLogoutAll, setConfirmingLogoutAll] = useState(false);

  const activeTier = currentSubscription?.tier ?? null;
  const activePlan = currentSubscription?.plan ?? null;
  const usage: SubscriptionUsage | null = currentSubscription?.usage ?? null;
  const activeFormatted = activePlan
    ? formatPlanFromBackend(activePlan, locale)
    : null;

  return (
    <Card
      id="subscription"
      padding="lg"
      as="section"
      className="flex flex-col gap-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Icon name="layers" size="md" className="text-heading" />
            <Heading as="h2" variant="subsection">
              {locale === "es"
                ? "Suscripción Activa y Consumo del Plan"
                : "Active Subscription & Plan Usage"}
            </Heading>
            <Badge variant={activePlan ? "primary" : "warning"}>
              {activeFormatted
                ? activeFormatted.name
                : locale === "es"
                  ? "SIN PLAN ACTIVO"
                  : "NO ACTIVE PLAN"}
            </Badge>
          </div>
          <Text variant="small" tone="muted">
            {activeFormatted
              ? activeFormatted.description
              : locale === "es"
                ? "Selecciona uno de los planes oficiales para habilitar lecturas IA y gestión de idiomas."
                : "Choose an official plan below to enable AI readings and language settings."}
          </Text>
        </div>

        {activeFormatted && (
          <Badge variant="outline">{activeFormatted.tierBadge}</Badge>
        )}
      </div>

      {usage && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuotaMeter
            locale={locale}
            label={locale === "es" ? "Lecturas hoy" : "Readings today"}
            used={usage.readingsCreatedToday}
            limit={usage.readingsLimit}
            remaining={usage.readingsRemainingToday}
          />
          <QuotaMeter
            locale={locale}
            label={locale === "es" ? "Consultas IA hoy" : "AI queries today"}
            used={usage.questionsAskedToday}
            limit={usage.questionsLimit}
            remaining={usage.questionsRemainingToday}
          />
          <QuotaMeter
            locale={locale}
            label={locale === "es" ? "Categorías activas" : "Active categories"}
            used={usage.categoriesCount}
            limit={usage.categoriesLimit}
          />
          <QuotaMeter
            locale={locale}
            label={locale === "es" ? "Idiomas activos" : "Active languages"}
            used={usage.languagesCount}
            limit={usage.languagesLimit}
          />
        </div>
      )}

      <Divider />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Eyebrow tone="muted" className="text-[10px]">
            {locale === "es"
              ? "CAMBIAR PLAN DISPONIBLE (CATÁLOGO DEL SERVIDOR)"
              : "SWITCH AVAILABLE PLAN (SERVER CATALOG)"}
          </Eyebrow>
          <Text variant="caption" tone="subtle">
            {locale === "es"
              ? "Los cupos de idiomas y categorías activas se ajustan automáticamente al plan seleccionado."
              : "Active language and category quotas adjust automatically to the selected plan."}
          </Text>
        </div>

        {isLoadingPlans ? (
          <SkeletonCard
            lines={3}
            label={
              locale === "es"
                ? "Cargando catálogo de planes..."
                : "Loading plan catalog..."
            }
          />
        ) : plansError ? (
          <Alert
            variant="error"
            title={
              locale === "es"
                ? "No se pudo cargar el catálogo de planes"
                : "Could not load plan catalog"
            }
          >
            {plansError}
          </Alert>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {plans.map((plan) => {
              const summary = formatPlanFromBackend(plan, locale);
              const isCurrent = activeTier === plan.id;

              return (
                <div
                  key={plan.id}
                  className={[
                    "flex flex-col justify-between gap-4 rounded-base border p-4 transition-colors",
                    isCurrent
                      ? "border-2 border-brand bg-neutral-primary-soft shadow-xs"
                      : "border-default bg-surface",
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold tracking-wider text-heading uppercase">
                        {summary.name}
                      </span>
                      <Badge variant={isCurrent ? "primary" : "secondary"}>
                        {isCurrent
                          ? locale === "es"
                            ? "ACTUAL"
                            : "CURRENT"
                          : summary.quotaHeadline}
                      </Badge>
                    </div>

                    <Text variant="caption" tone="muted">
                      {summary.description}
                    </Text>

                    <ul className="mt-1 flex flex-col gap-1.5 border-t border-default pt-2.5">
                      {summary.features.map((feat) => (
                        <li
                          key={feat}
                          className="flex items-start gap-1.5 text-xs text-body"
                        >
                          <Icon
                            name="check"
                            size="xs"
                            className="mt-0.5 shrink-0 text-heading"
                          />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    type="button"
                    variant={isCurrent ? "outline" : "primary"}
                    size="sm"
                    fullWidth
                    disabled={isCurrent || isSavingPlan}
                    isLoading={isSavingPlan && !isCurrent}
                    onClick={() => {
                      void onSelectPlan(plan.id);
                    }}
                  >
                    {isCurrent
                      ? locale === "es"
                        ? "Plan activo"
                        : "Active plan"
                      : locale === "es"
                        ? `Cambiar a ${summary.name}`
                        : `Switch to ${summary.name}`}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Divider />

      <div
        id="security"
        className="flex flex-col justify-between gap-4 rounded-base border border-default bg-neutral-primary-soft p-4 sm:flex-row sm:items-center"
      >
        <div className="flex items-start gap-3">
          <Icon name="shield" size="md" className="mt-0.5 shrink-0 text-heading" />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-heading">
              {locale === "es"
                ? "Seguridad de sesiones activas"
                : "Active session security"}
            </span>
            <Text variant="caption" tone="muted">
              {locale === "es"
                ? "Revoca tu sesión actual y cualquier otro dispositivo conectado de forma inmediata."
                : "Revoke your current session and every other signed-in device immediately."}
            </Text>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!confirmingLogoutAll ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoggingOutAll}
              leftIcon={<Icon name="log-out" size="xs" />}
              onClick={() => setConfirmingLogoutAll(true)}
            >
              {locale === "es"
                ? "Cerrar todas las sesiones"
                : "Sign out all devices"}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="danger"
                size="sm"
                isLoading={isLoggingOutAll}
                leftIcon={<Icon name="log-out" size="xs" />}
                onClick={() => {
                  void onLogoutAll();
                }}
              >
                {locale === "es"
                  ? "Confirmar cierre global"
                  : "Confirm global sign-out"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isLoggingOutAll}
                onClick={() => setConfirmingLogoutAll(false)}
              >
                {locale === "es" ? "Cancelar" : "Cancel"}
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
