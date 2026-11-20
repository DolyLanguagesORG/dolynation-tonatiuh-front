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
  Textarea,
} from "@/components/ui";
import { type Dictionary, formatMessage, type Locale } from "@/i18n";
import {
  type AccessRequestItem,
  type SubscriptionPlanItem,
  type SubscriptionTier,
  type SubscriptionUsage,
  type UserSubscriptionResponse,
} from "@/lib";
import { formatPlanFromBackend } from "@/lib/plan-presentation";

export interface SubscriptionPlanCardProps {
  t: Dictionary;
  locale: Locale;
  currentSubscription: UserSubscriptionResponse | null;
  plans: readonly SubscriptionPlanItem[];
  isLoadingPlans: boolean;
  plansError: string | null;
  isSavingPlan: boolean;
  isLoggingOutAll: boolean;
  accessRequestsEnabled?: boolean;
  pendingSubscriptionRequest?: AccessRequestItem | null;
  latestRejectedSubscriptionRequest?: AccessRequestItem | null;
  isCancellingRequest?: boolean;
  onSelectPlan: (tier: SubscriptionTier, message?: string) => Promise<boolean>;
  onCancelAccessRequest?: (requestId: number) => Promise<boolean>;
  onLogoutAll: () => Promise<void>;
}

interface QuotaRowProps {
  t: Dictionary;
  label: string;
  used: number;
  limit: number | null;
  remaining?: number | null;
}

function QuotaMeter({
  t,
  label,
  used,
  limit,
  remaining,
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
            ? t.profile.subscription.unlimitedBadge
            : formatMessage(t.profile.subscription.remainingBadge, {
                count: remaining ?? Math.max(0, limit - used),
              })}
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
            {t.profile.subscription.noDailyCap}
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
  t,
  locale,
  currentSubscription,
  plans,
  isLoadingPlans,
  plansError,
  isSavingPlan,
  isLoggingOutAll,
  accessRequestsEnabled = false,
  pendingSubscriptionRequest = null,
  latestRejectedSubscriptionRequest = null,
  isCancellingRequest = false,
  onSelectPlan,
  onCancelAccessRequest,
  onLogoutAll,
}: SubscriptionPlanCardProps) {
  const [confirmingLogoutAll, setConfirmingLogoutAll] = useState(false);
  const [confirmingCancelRequest, setConfirmingCancelRequest] = useState(false);
  const [requestingTier, setRequestingTier] = useState<SubscriptionTier | null>(
    null,
  );
  const [switchMessage, setSwitchMessage] = useState("");

  const activeTier = currentSubscription?.tier ?? null;
  const activePlan = currentSubscription?.plan ?? null;
  const usage: SubscriptionUsage | null = currentSubscription?.usage ?? null;
  const activeFormatted = activePlan
    ? formatPlanFromBackend(activePlan, locale)
    : null;

  const formatTierLabel = (tier: SubscriptionTier | null): string =>
    tier ? t.plans.tiers[tier].name : "-";

  const handleConfirmSwitchRequest = async (): Promise<void> => {
    if (!requestingTier) return;
    const ok = await onSelectPlan(
      requestingTier,
      switchMessage.trim() || undefined,
    );
    if (ok) {
      setRequestingTier(null);
      setSwitchMessage("");
    }
  };

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
              {t.profile.subscription.title}
            </Heading>
            <Badge variant={activePlan ? "primary" : "warning"}>
              {activeFormatted
                ? activeFormatted.name
                : t.profile.subscription.noActivePlanBadge}
            </Badge>
          </div>
          <Text variant="small" tone="muted">
            {activeFormatted
              ? activeFormatted.description
              : t.profile.subscription.choosePlanDesc}
          </Text>
        </div>

        {activeFormatted && (
          <Badge variant="outline">{activeFormatted.tierBadge}</Badge>
        )}
      </div>

      {usage && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuotaMeter
            t={t}
            label={t.profile.subscription.readingsToday}
            used={usage.readingsCreatedToday}
            limit={usage.readingsLimit}
            remaining={usage.readingsRemainingToday}
          />
          <QuotaMeter
            t={t}
            label={t.profile.subscription.aiQueriesToday}
            used={usage.questionsAskedToday}
            limit={usage.questionsLimit}
            remaining={usage.questionsRemainingToday}
          />
          <QuotaMeter
            t={t}
            label={t.profile.subscription.activeCategories}
            used={usage.categoriesCount}
            limit={usage.categoriesLimit}
          />
          <QuotaMeter
            t={t}
            label={t.profile.subscription.activeLanguages}
            used={usage.languagesCount}
            limit={usage.languagesLimit}
          />
        </div>
      )}

      <Divider />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Eyebrow tone="muted" className="text-[10px]">
            {t.profile.subscription.switchPlanEyebrow}
          </Eyebrow>
          <Text variant="caption" tone="subtle">
            {t.profile.subscription.switchPlanHint}
          </Text>
        </div>

        {accessRequestsEnabled && pendingSubscriptionRequest && (
          <div
            role="status"
            aria-live="polite"
            className="flex flex-col justify-between gap-2.5 rounded-base border border-default bg-neutral-primary-soft px-3.5 py-2.5 sm:flex-row sm:items-center"
          >
            <div className="flex items-center gap-2">
              <Icon
                name="clock"
                size="sm"
                className="shrink-0 text-heading"
              />
              <Text variant="small" className="text-heading">
                {formatMessage(t.profile.subscription.pendingSwitchDesc, {
                  plan: formatTierLabel(
                    pendingSubscriptionRequest.requestedTier,
                  ),
                })}
              </Text>
            </div>

            {onCancelAccessRequest && (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {!confirmingCancelRequest ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    disabled={isCancellingRequest}
                    onClick={() => setConfirmingCancelRequest(true)}
                  >
                    {t.auth.stepper.step3Plan.cancelRequestButton}
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="danger"
                      size="xs"
                      isLoading={isCancellingRequest}
                      onClick={() => {
                        void onCancelAccessRequest(
                          pendingSubscriptionRequest.id,
                        ).then((ok) => {
                          if (ok) {
                            setConfirmingCancelRequest(false);
                          }
                        });
                      }}
                    >
                      {t.auth.stepper.step3Plan.cancelConfirmButton}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      disabled={isCancellingRequest}
                      onClick={() => setConfirmingCancelRequest(false)}
                    >
                      {t.profile.cancelButton}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {accessRequestsEnabled &&
          !pendingSubscriptionRequest &&
          latestRejectedSubscriptionRequest?.rejectionReason && (
            <Alert variant="warning">
              {formatMessage(t.profile.subscription.rejectedSwitchNotice, {
                plan: formatTierLabel(
                  latestRejectedSubscriptionRequest.requestedTier,
                ),
                reason: latestRejectedSubscriptionRequest.rejectionReason,
              })}
            </Alert>
          )}

        {isLoadingPlans ? (
          <SkeletonCard
            lines={3}
            label={t.profile.subscription.loadingCatalog}
          />
        ) : plansError ? (
          <Alert
            variant="error"
            title={t.profile.subscription.loadCatalogErrorTitle}
          >
            {plansError}
          </Alert>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {plans.map((plan) => {
              const summary = formatPlanFromBackend(plan, locale);
              const isCurrent = activeTier === plan.id;
              const isRequestedPending = Boolean(
                accessRequestsEnabled &&
                  pendingSubscriptionRequest?.requestedTier === plan.id,
              );

              return (
                <div
                  key={plan.id}
                  className={[
                    "flex flex-col justify-between gap-4 rounded-base border p-4 transition-colors",
                    isCurrent
                      ? "border-2 border-brand bg-neutral-primary-soft shadow-xs"
                      : isRequestedPending
                        ? "border-2 border-brand/70 bg-neutral-primary-soft"
                        : "border-default bg-surface",
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold tracking-wider text-heading uppercase">
                        {summary.name}
                      </span>
                      <Badge
                        variant={
                          isCurrent
                            ? "primary"
                            : isRequestedPending
                              ? "warning"
                              : "secondary"
                        }
                      >
                        {isCurrent
                          ? t.profile.subscription.currentBadge
                          : isRequestedPending
                            ? t.profile.subscription.pendingBadge
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
                    disabled={
                      isCurrent ||
                      isSavingPlan ||
                      Boolean(
                        accessRequestsEnabled && pendingSubscriptionRequest,
                      )
                    }
                    isLoading={isSavingPlan && !isCurrent && !accessRequestsEnabled}
                    onClick={() => {
                      if (accessRequestsEnabled) {
                        setRequestingTier(plan.id);
                        return;
                      }
                      void onSelectPlan(plan.id);
                    }}
                  >
                    {isCurrent
                      ? t.profile.subscription.activePlanButton
                      : isRequestedPending
                        ? t.profile.subscription.pendingPlanButton
                        : accessRequestsEnabled
                          ? formatMessage(
                              t.profile.subscription.requestSwitchToPlanButton,
                              { name: summary.name },
                            )
                          : formatMessage(
                              t.profile.subscription.switchToPlanButton,
                              { name: summary.name },
                            )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {accessRequestsEnabled &&
          requestingTier &&
          !pendingSubscriptionRequest && (
            <div className="flex flex-col gap-3 rounded-base border border-strong bg-neutral-primary-soft p-4">
              <Textarea
                label={t.profile.subscription.switchMessageLabel}
                placeholder={t.profile.subscription.switchMessagePlaceholder}
                maxLength={1000}
                rows={2}
                value={switchMessage}
                onChange={(event) => setSwitchMessage(event.target.value)}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={isSavingPlan}
                  leftIcon={<Icon name="check" size="xs" />}
                  onClick={() => {
                    void handleConfirmSwitchRequest();
                  }}
                >
                  {formatMessage(
                    t.profile.subscription.submitSwitchRequestButton,
                    {
                      name: formatTierLabel(requestingTier),
                    },
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isSavingPlan}
                  onClick={() => {
                    setRequestingTier(null);
                    setSwitchMessage("");
                  }}
                >
                  {t.profile.cancelButton}
                </Button>
              </div>
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
              {t.profile.subscription.sessionSecurityTitle}
            </span>
            <Text variant="caption" tone="muted">
              {t.profile.subscription.sessionSecurityDesc}
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
              {t.profile.subscription.logoutAllButton}
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
                {t.profile.subscription.confirmLogoutAllButton}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isLoggingOutAll}
                onClick={() => setConfirmingLogoutAll(false)}
              >
                {t.profile.cancelButton}
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
