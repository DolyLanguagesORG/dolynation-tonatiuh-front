"use client";

import { useEffect, useId, useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  Eyebrow,
  Heading,
  Icon,
  IconButton,
  ProgressBar,
  SkeletonCard,
  Text,
  Textarea,
} from "@/components/ui";
import { type Dictionary, formatMessage, type Locale } from "@/i18n";
import {
  type AccessRequestItem,
  type BillingConfigResponse,
  type BillingInvoice,
  type BillingStatusResponse,
  formatBillingAmount,
  getDateLocale,
  type PaidSubscriptionTier,
  type SubscriptionPlanItem,
  type SubscriptionTier,
  type SubscriptionUsage,
  type UserSubscriptionResponse,
} from "@/lib";
import {
  formatPlanFromBackend,
  formatPlanPriceFromBillingConfig,
} from "@/lib/plan-presentation";

export interface SubscriptionPlanCardProps {
  t: Dictionary;
  locale: Locale;
  currentSubscription: UserSubscriptionResponse | null;
  billingConfig?: BillingConfigResponse | null;
  billingStatus?: BillingStatusResponse | null;
  invoices?: readonly BillingInvoice[];
  plans: readonly SubscriptionPlanItem[];
  isLoadingPlans: boolean;
  plansError: string | null;
  isSavingPlan: boolean;
  isManagingBilling?: boolean;
  isLoggingOutAll: boolean;
  accessRequestsEnabled?: boolean;
  pendingSubscriptionRequest?: AccessRequestItem | null;
  latestRejectedSubscriptionRequest?: AccessRequestItem | null;
  isCancellingRequest?: boolean;
  onSelectPlan: (tier: SubscriptionTier, message?: string) => Promise<boolean>;
  onChangePaidPlan?: (tier: PaidSubscriptionTier) => Promise<boolean>;
  onCancelSubscription?: () => Promise<boolean>;
  onResumeSubscription?: () => Promise<boolean>;
  onOpenUpdateCard?: () => Promise<void> | void;
  onOpenBillingPortal?: () => Promise<void> | void;
  onCancelAccessRequest?: (requestId: number) => Promise<boolean>;
  onRefreshAccessRequests?: () => Promise<void>;
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
 * Tarjeta de suscripción activa, consumo real diario/de plan, cambio de plan,
 * gestión de tarjeta/facturas con Stripe y cierre global de sesiones en `/profile#subscription`.
 */
export function SubscriptionPlanCard({
  t,
  locale,
  currentSubscription,
  billingConfig = null,
  billingStatus = null,
  invoices = [],
  plans,
  isLoadingPlans,
  plansError,
  isSavingPlan,
  isManagingBilling = false,
  isLoggingOutAll,
  accessRequestsEnabled = false,
  pendingSubscriptionRequest = null,
  latestRejectedSubscriptionRequest = null,
  isCancellingRequest = false,
  onSelectPlan,
  onChangePaidPlan,
  onCancelSubscription,
  onResumeSubscription,
  onOpenUpdateCard,
  onOpenBillingPortal,
  onCancelAccessRequest,
  onRefreshAccessRequests,
  onLogoutAll,
}: SubscriptionPlanCardProps) {
  const [confirmingLogoutAll, setConfirmingLogoutAll] = useState(false);
  const [confirmingCancelRequest, setConfirmingCancelRequest] = useState(false);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [requestingTier, setRequestingTier] = useState<SubscriptionTier | null>(
    null,
  );
  const [switchMessage, setSwitchMessage] = useState("");
  const [confirmingPaidChangeTier, setConfirmingPaidChangeTier] =
    useState<PaidSubscriptionTier | null>(null);
  const [showCancelSubscriptionModal, setShowCancelSubscriptionModal] =
    useState(false);

  const changePlanModalTitleId = useId();
  const cancelSubModalTitleId = useId();

  const activeTier = currentSubscription?.tier ?? billingStatus?.tier ?? null;
  const activePlan = currentSubscription?.plan ?? null;
  const usage: SubscriptionUsage | null = currentSubscription?.usage ?? null;
  const activeFormatted = activePlan
    ? formatPlanFromBackend(activePlan, locale, billingConfig)
    : null;

  const isStripeProvider =
    billingConfig?.provider === "stripe" || billingStatus?.provider === "stripe";
  const stripeSubscription = billingStatus?.subscription ?? null;
  const hasActiveStripeSubscription = Boolean(
    isStripeProvider &&
      stripeSubscription &&
      stripeSubscription.status !== "canceled",
  );
  const isPastDue = stripeSubscription?.status === "past_due";
  const isCancelAtPeriodEnd = Boolean(stripeSubscription?.cancelAtPeriodEnd);

  const periodEndLabel = stripeSubscription?.currentPeriodEnd
    ? new Date(stripeSubscription.currentPeriodEnd).toLocaleDateString(
        getDateLocale(locale),
        { day: "numeric", month: "short", year: "numeric" },
      )
    : currentSubscription?.billing?.currentPeriodEnd
      ? new Date(
          currentSubscription.billing.currentPeriodEnd,
        ).toLocaleDateString(getDateLocale(locale), {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null;

  const formatTierLabel = (tier: SubscriptionTier | null): string =>
    tier ? t.plans.tiers[tier].name : "-";

  useEffect(() => {
    if (!confirmingPaidChangeTier && !showCancelSubscriptionModal) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape" && !isSavingPlan && !isManagingBilling) {
        setConfirmingPaidChangeTier(null);
        setShowCancelSubscriptionModal(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    confirmingPaidChangeTier,
    isManagingBilling,
    isSavingPlan,
    showCancelSubscriptionModal,
  ]);

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

  const handlePlanCardClick = (targetTier: SubscriptionTier): void => {
    if (accessRequestsEnabled) {
      setRequestingTier(targetTier);
      return;
    }

    if (hasActiveStripeSubscription) {
      if (targetTier === "dolly") {
        setShowCancelSubscriptionModal(true);
        return;
      }
      if (
        (targetTier === "dolly_plus" || targetTier === "dolly_pro") &&
        onChangePaidPlan
      ) {
        setConfirmingPaidChangeTier(targetTier);
        return;
      }
    }

    void onSelectPlan(targetTier);
  };

  const handleConfirmPaidPlanChange = async (): Promise<void> => {
    if (!confirmingPaidChangeTier || !onChangePaidPlan) return;
    const ok = await onChangePaidPlan(confirmingPaidChangeTier);
    if (ok) {
      setConfirmingPaidChangeTier(null);
    }
  };

  const handleConfirmCancelSubscription = async (): Promise<void> => {
    if (!onCancelSubscription) return;
    const ok = await onCancelSubscription();
    if (ok) {
      setShowCancelSubscriptionModal(false);
    }
  };

  const tm = t.billing.subscriptionManage;

  const resolveStripeStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return { label: tm.statusActiveBadge, variant: "success" as const };
      case "trialing":
        return { label: tm.statusTrialingBadge, variant: "secondary" as const };
      case "past_due":
        return { label: tm.statusPastDueBadge, variant: "error" as const };
      case "canceled":
        return { label: tm.statusCanceledBadge, variant: "outline" as const };
      default:
        return { label: tm.statusIncompleteBadge, variant: "warning" as const };
    }
  };

  const resolveInvoiceStatusLabel = (status: string | null): string => {
    switch (status) {
      case "paid":
        return tm.invoiceStatusPaid;
      case "open":
        return tm.invoiceStatusOpen;
      case "draft":
        return tm.invoiceStatusDraft;
      case "void":
        return tm.invoiceStatusVoid;
      case "uncollectible":
        return tm.invoiceStatusUncollectible;
      default:
        return (status ?? "paid").toUpperCase();
    }
  };

  const paymentMethod = stripeSubscription?.paymentMethod ?? null;
  const cardSummaryLabel =
    paymentMethod && paymentMethod.last4
      ? formatMessage(tm.cardSummaryTemplate, {
          brand: (paymentMethod.brand ?? "CARD").toUpperCase(),
          last4: paymentMethod.last4,
          expMonth: String(paymentMethod.expMonth ?? "--").padStart(2, "0"),
          expYear: String(paymentMethod.expYear ?? "--").slice(-2),
        })
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
              {t.profile.subscription.title}
            </Heading>
            <Badge variant={activePlan ? "primary" : "warning"}>
              {activeFormatted
                ? activeFormatted.name
                : t.profile.subscription.noActivePlanBadge}
            </Badge>
            {activeFormatted?.priceLabel && (
              <Badge variant="outline">{activeFormatted.priceLabel}</Badge>
            )}
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

      {isStripeProvider && stripeSubscription && (
        <>
          <Divider />

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Eyebrow tone="muted" className="text-[10px]">
                {tm.billingSectionEyebrow}
              </Eyebrow>
              <Badge
                variant={resolveStripeStatusBadge(stripeSubscription.status).variant}
              >
                {resolveStripeStatusBadge(stripeSubscription.status).label}
              </Badge>
            </div>

            {isPastDue && (
              <Alert variant="error" title={tm.pastDueBannerTitle}>
                {tm.pastDueBannerDesc}
              </Alert>
            )}

            {isCancelAtPeriodEnd && (
              <Alert variant="warning" title={tm.cancelScheduledBannerTitle}>
                <div className="flex flex-col gap-2.5">
                  <span>
                    {formatMessage(tm.cancelScheduledBannerDesc, {
                      plan: formatTierLabel(stripeSubscription.tier),
                      date: periodEndLabel ?? "-",
                    })}
                  </span>
                  {onResumeSubscription && (
                    <div>
                      <Button
                        type="button"
                        variant="primary"
                        size="xs"
                        isLoading={isManagingBilling}
                        disabled={isManagingBilling}
                        onClick={() => {
                          void onResumeSubscription();
                        }}
                      >
                        {isManagingBilling
                          ? tm.resumingSubscriptionButton
                          : tm.resumeSubscriptionButton}
                      </Button>
                    </div>
                  )}
                </div>
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col justify-between gap-2 rounded-base border border-default bg-neutral-primary-soft p-3.5">
                <span className="font-mono text-[10px] font-bold tracking-wider text-muted uppercase">
                  {isCancelAtPeriodEnd
                    ? tm.accessUntilDateLabel
                    : tm.nextBillingDateLabel}
                </span>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold text-heading">
                    {periodEndLabel ?? "—"}
                  </span>
                  {!isCancelAtPeriodEnd &&
                    hasActiveStripeSubscription &&
                    onCancelSubscription && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        disabled={isManagingBilling}
                        onClick={() => setShowCancelSubscriptionModal(true)}
                      >
                        {tm.cancelAtPeriodEndButton}
                      </Button>
                    )}
                </div>
              </div>

              <div className="flex flex-col justify-between gap-2 rounded-base border border-default bg-neutral-primary-soft p-3.5">
                <span className="font-mono text-[10px] font-bold tracking-wider text-muted uppercase">
                  {tm.paymentMethodLabel}
                </span>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-heading">
                    {cardSummaryLabel ?? tm.noPaymentMethodLabel}
                  </span>
                  {onOpenUpdateCard && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="xs"
                      disabled={isManagingBilling}
                      onClick={() => {
                        void onOpenUpdateCard();
                      }}
                    >
                      {cardSummaryLabel ? tm.updateCardButton : tm.addCardButton}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
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
          <Alert
            variant="info"
            title={t.profile.subscription.pendingSwitchTitle}
          >
            <div className="flex flex-col gap-2">
              <span>
                {formatMessage(t.profile.subscription.pendingSwitchDesc, {
                  plan: formatTierLabel(
                    pendingSubscriptionRequest.requestedTier,
                  ),
                })}
              </span>
              {pendingSubscriptionRequest.userMessage && (
                <span className="italic">
                  “{pendingSubscriptionRequest.userMessage}”
                </span>
              )}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {onRefreshAccessRequests && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    isLoading={isRefreshingStatus}
                    leftIcon={<Icon name="refresh" size="xs" />}
                    onClick={() => {
                      if (isRefreshingStatus) return;
                      setIsRefreshingStatus(true);
                      void onRefreshAccessRequests().finally(() => {
                        setIsRefreshingStatus(false);
                      });
                    }}
                  >
                    {t.auth.stepper.step3Plan.refreshStatusButton}
                  </Button>
                )}
                {onCancelAccessRequest && (
                  !confirmingCancelRequest ? (
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
                  )
                )}
              </div>
            </div>
          </Alert>
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
              const summary = formatPlanFromBackend(plan, locale, billingConfig);
              const isCurrent = activeTier === plan.id;
              const isRequestedPending = Boolean(
                accessRequestsEnabled &&
                  pendingSubscriptionRequest?.requestedTier === plan.id,
              );
              const isDowngradeToFreeWithActiveStripe =
                hasActiveStripeSubscription && plan.id === "dolly";
              const isBlockedByPastDue =
                hasActiveStripeSubscription &&
                isPastDue &&
                plan.id !== "dolly" &&
                !isCurrent;

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

                    {summary.priceLabel && (
                      <span className="font-mono text-xs font-bold text-heading">
                        {summary.priceLabel}
                      </span>
                    )}

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
                      isManagingBilling ||
                      isBlockedByPastDue ||
                      (isDowngradeToFreeWithActiveStripe && isCancelAtPeriodEnd) ||
                      Boolean(
                        accessRequestsEnabled && pendingSubscriptionRequest,
                      )
                    }
                    isLoading={
                      (isSavingPlan || isManagingBilling) &&
                      !isCurrent &&
                      !accessRequestsEnabled
                    }
                    onClick={() => handlePlanCardClick(plan.id)}
                  >
                    {isCurrent
                      ? t.profile.subscription.activePlanButton
                      : isRequestedPending
                        ? t.profile.subscription.pendingPlanButton
                        : isDowngradeToFreeWithActiveStripe
                          ? tm.cancelAtPeriodEndButton
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

      {isStripeProvider && (invoices.length > 0 || hasActiveStripeSubscription) && (
        <>
          <Divider />

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Eyebrow tone="muted" className="text-[10px]">
                {tm.invoicesEyebrow}
              </Eyebrow>
              {hasActiveStripeSubscription && onOpenBillingPortal && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={isManagingBilling}
                  onClick={() => {
                    void onOpenBillingPortal();
                  }}
                >
                  {tm.portalFallbackButton}
                </Button>
              )}
            </div>

            {invoices.length === 0 ? (
              <Text variant="caption" tone="muted">
                {tm.invoicesEmpty}
              </Text>
            ) : (
              <div className="flex flex-col gap-2">
                {invoices.map((inv) => {
                  const dateLabel = new Date(inv.createdAt).toLocaleDateString(
                    getDateLocale(locale),
                    { day: "numeric", month: "short", year: "numeric" },
                  );
                  const amountLabel =
                    formatBillingAmount(
                      inv.amountPaidCents || inv.amountDueCents,
                      inv.currency,
                    ) ?? "$0.00 MXN";

                  return (
                    <div
                      key={inv.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-base border border-default bg-neutral-primary-soft px-3.5 py-2.5"
                    >
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Icon
                          name="file-text"
                          size="xs"
                          className="text-heading"
                        />
                        <span className="font-mono text-xs font-bold text-heading">
                          {inv.number ?? tm.invoiceNumberFallback}
                        </span>
                        <span className="text-xs text-muted">{dateLabel}</span>
                        <Badge variant="outline">
                          {resolveInvoiceStatusLabel(inv.status)}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-xs font-bold text-heading tabular-nums">
                          {amountLabel}
                        </span>
                        {inv.invoicePdfUrl ? (
                          <a
                            href={inv.invoicePdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-xs font-bold text-heading underline"
                          >
                            <span>{tm.downloadPdfButton}</span>
                          </a>
                        ) : inv.hostedInvoiceUrl ? (
                          <a
                            href={inv.hostedInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-xs font-bold text-heading underline"
                          >
                            <span>{tm.viewInvoiceButton}</span>
                          </a>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

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

      {/* Modal de confirmación de cambio entre planes pagados (dolly_plus <-> dolly_pro) */}
      {confirmingPaidChangeTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            aria-hidden="true"
            onClick={() => {
              if (!isSavingPlan && !isManagingBilling) {
                setConfirmingPaidChangeTier(null);
              }
            }}
            className="fixed inset-0 bg-brand/45 backdrop-blur-[1px]"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={changePlanModalTitleId}
            className="relative z-10 flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-base border border-default bg-surface shadow-xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-default bg-neutral-primary-soft px-5 py-4">
              <div className="flex flex-col gap-1">
                <Eyebrow tone="muted" className="text-[10px]">
                  {tm.changePlanModalEyebrow}
                </Eyebrow>
                <Heading
                  id={changePlanModalTitleId}
                  as="h2"
                  variant="subsection"
                >
                  {formatMessage(tm.changePlanModalTitle, {
                    plan: formatTierLabel(confirmingPaidChangeTier),
                    price:
                      formatPlanPriceFromBillingConfig(
                        confirmingPaidChangeTier,
                        billingConfig,
                        locale,
                      ) ?? "",
                  })}
                </Heading>
              </div>

              <IconButton
                icon="close"
                variant="ghost"
                size="sm"
                aria-label={t.billing.checkout.closeAria}
                disabled={isSavingPlan || isManagingBilling}
                onClick={() => setConfirmingPaidChangeTier(null)}
              />
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto p-5">
              <Text variant="small" tone="muted">
                {formatMessage(tm.changePlanModalDescription, {
                  plan: formatTierLabel(confirmingPaidChangeTier),
                })}
              </Text>

              <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-default pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  disabled={isSavingPlan || isManagingBilling}
                  onClick={() => setConfirmingPaidChangeTier(null)}
                >
                  {t.profile.cancelButton}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  isLoading={isSavingPlan || isManagingBilling}
                  leftIcon={<Icon name="check" size="xs" />}
                  onClick={() => {
                    void handleConfirmPaidPlanChange();
                  }}
                >
                  {isSavingPlan || isManagingBilling
                    ? tm.changingPlanButton
                    : formatMessage(tm.confirmChangePlanButton, {
                        plan: formatTierLabel(confirmingPaidChangeTier),
                      })}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de cancelación al cierre del ciclo (bajar a Dolly gratis) */}
      {showCancelSubscriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            aria-hidden="true"
            onClick={() => {
              if (!isManagingBilling) {
                setShowCancelSubscriptionModal(false);
              }
            }}
            className="fixed inset-0 bg-brand/45 backdrop-blur-[1px]"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={cancelSubModalTitleId}
            className="relative z-10 flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-base border border-default bg-surface shadow-xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-default bg-neutral-primary-soft px-5 py-4">
              <div className="flex flex-col gap-1">
                <Eyebrow tone="muted" className="text-[10px]">
                  {tm.cancelModalEyebrow}
                </Eyebrow>
                <Heading
                  id={cancelSubModalTitleId}
                  as="h2"
                  variant="subsection"
                >
                  {formatMessage(tm.cancelModalTitle, {
                    plan: formatTierLabel(activeTier),
                  })}
                </Heading>
              </div>

              <IconButton
                icon="close"
                variant="ghost"
                size="sm"
                aria-label={t.billing.checkout.closeAria}
                disabled={isManagingBilling}
                onClick={() => setShowCancelSubscriptionModal(false)}
              />
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto p-5">
              <Text variant="small" tone="muted">
                {formatMessage(tm.cancelModalDescription, {
                  plan: formatTierLabel(activeTier),
                  date: periodEndLabel ?? "—",
                })}
              </Text>

              <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-default pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  disabled={isManagingBilling}
                  onClick={() => setShowCancelSubscriptionModal(false)}
                >
                  {t.profile.cancelButton}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="md"
                  isLoading={isManagingBilling}
                  onClick={() => {
                    void handleConfirmCancelSubscription();
                  }}
                >
                  {isManagingBilling
                    ? tm.cancelingSubscriptionButton
                    : tm.confirmCancelSubscriptionButton}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
