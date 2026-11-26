"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { AuthShell } from "@/components/auth";
import { FloatingLocaleSelector } from "@/components/layout/floating-locale-selector";
import {
  Alert,
  Badge,
  Button,
  Card,
  Eyebrow,
  Icon,
  SkeletonCard,
} from "@/components/ui";
import { useAuth } from "@/context";
import { useNavigationGuard } from "@/hooks";
import { formatMessage, useLocale } from "@/i18n";
import {
  ApiClientError,
  type BillingStatusResponse,
  billingService,
  ErrorCode,
  resolveErrorMessage,
} from "@/lib";

type SyncViewState = "syncing" | "success" | "pending" | "error";

/**
 * Vista de retorno `/billing/return?session_id={CHECKOUT_SESSION_ID}` para reconciliar
 * pagos de suscripciones y créditos de desbloqueo de idioma tras 3DS, OXXO, SPEI o Checkout.
 */
export function BillingReturnView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, t } = useLocale();
  const { onboarding, reloadAccountState } = useAuth();

  const sessionId = searchParams.get("session_id")?.trim() ?? "";
  const tr = t.billing.returnPage;

  const [viewState, setViewState] = useState<SyncViewState>(() =>
    sessionId ? "syncing" : "error",
  );
  const [statusData, setStatusData] = useState<BillingStatusResponse | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(() =>
    sessionId ? null : tr.missingSessionBody,
  );
  const [isRetrying, setIsRetrying] = useState(false);
  const hasInitialSyncedRef = useRef(false);

  const { allowNextNavigation } = useNavigationGuard({
    active: viewState === "syncing" || isRetrying,
    message: t.navigationGuard.paymentInProgressMessage,
  });

  const navigateWithReplace = useCallback(
    (href: string) => {
      allowNextNavigation();
      router.replace(href);
    },
    [allowNextNavigation, router],
  );

  const executeSync = useCallback(
    async (targetSessionId: string, isManualRetry = false): Promise<void> => {
      if (!targetSessionId) {
        setViewState("error");
        setErrorMessage(tr.missingSessionBody);
        return;
      }

      if (isManualRetry) {
        setIsRetrying(true);
      } else {
        setViewState("syncing");
      }
      setErrorMessage(null);

      try {
        const res = await billingService.syncCheckoutSession(targetSessionId);
        setStatusData(res.data);
        await reloadAccountState();
        setViewState("success");
      } catch (err) {
        if (
          err instanceof ApiClientError &&
          err.code === ErrorCode.BILLING_PAYMENT_REQUIRED
        ) {
          setViewState("pending");
          setErrorMessage(err.getUserMessage(locale));
        } else {
          setViewState("error");
          setErrorMessage(
            err instanceof ApiClientError
              ? err.getUserMessage(locale)
              : resolveErrorMessage(ErrorCode.BILLING_CHECKOUT_INVALID, locale),
          );
        }
      } finally {
        if (isManualRetry) {
          setIsRetrying(false);
        }
      }
    },
    [locale, reloadAccountState, tr.missingSessionBody],
  );

  useEffect(() => {
    if (!sessionId || hasInitialSyncedRef.current) {
      return;
    }
    hasInitialSyncedRef.current = true;
    void executeSync(sessionId, false);
  }, [executeSync, sessionId]);

  const latestPayment = statusData?.recentPayments?.[0] ?? null;
  const isLanguageUnlockPayment = latestPayment?.kind === "language_unlock";
  const resolvedTier =
    statusData?.tier ??
    statusData?.subscription?.tier ??
    onboarding.subscriptionPlan;
  const tierDisplayName = resolvedTier
    ? t.plans.tiers[resolvedTier]?.name ?? resolvedTier
    : "Dolly";

  const badgeLabel =
    viewState === "syncing"
      ? tr.syncingBadge
      : viewState === "success"
        ? tr.successBadge
        : viewState === "pending"
          ? tr.pendingBadge
          : tr.errorBadge;

  const badgeVariant =
    viewState === "success"
      ? "success"
      : viewState === "pending"
        ? "warning"
        : viewState === "error"
          ? "error"
          : "outline";

  const headingTitle =
    viewState === "syncing"
      ? tr.syncingTitle
      : viewState === "success"
        ? tr.successTitle
        : viewState === "pending"
          ? tr.pendingTitle
          : tr.errorTitle;

  const headingSubtitle =
    viewState === "syncing"
      ? tr.syncingSubtitle
      : viewState === "pending"
        ? tr.pendingSubtitle
        : undefined;

  return (
    <AuthShell
      title={headingTitle}
      subtitle={headingSubtitle}
      maxWidthClass="max-w-2xl"
      headerAction={<FloatingLocaleSelector />}
      topSlot={
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <Eyebrow tone="muted">{tr.eyebrow}</Eyebrow>
          <Badge variant={badgeVariant}>{badgeLabel}</Badge>
        </div>
      }
      copyrightText={t.auth.register.copyrightNotice}
    >
      <div className="flex flex-col gap-5">
        {viewState === "syncing" && (
          <div className="flex flex-col gap-3">
            <Alert variant="info">{t.navigationGuard.billingSyncNotice}</Alert>
            <SkeletonCard lines={4} label={tr.syncingSubtitle} />
          </div>
        )}

        {viewState === "success" && (
          <Card padding="lg" className="flex flex-col gap-5">
            <Alert variant="success" title={tr.successTitle}>
              {isLanguageUnlockPayment
                ? tr.successUnlockBody
                : formatMessage(tr.successSubscriptionBody, {
                    plan: tierDisplayName,
                  })}
            </Alert>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => navigateWithReplace("/")}
              >
                {tr.goToHomeCta}
              </Button>

              {isLanguageUnlockPayment ? (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => navigateWithReplace("/profile")}
                >
                  {tr.goToProfilePreferencesCta}
                </Button>
              ) : !onboarding.canGenerateReadings ? (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => navigateWithReplace("/setup-preferences")}
                >
                  {tr.continueOnboardingCta}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => navigateWithReplace("/profile#subscription")}
                >
                  {tr.goToProfileSubscriptionCta}
                </Button>
              )}
            </div>
          </Card>
        )}

        {viewState === "pending" && (
          <Card padding="lg" className="flex flex-col gap-5">
            <Alert variant="warning" title={tr.pendingTitle}>
              {tr.pendingSubtitle}
            </Alert>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() =>
                  navigateWithReplace(
                    onboarding.hasSelectedPlan ? "/profile" : "/select-plan",
                  )
                }
              >
                {onboarding.hasSelectedPlan
                  ? tr.backToProfileCta
                  : tr.backToSelectPlanCta}
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                isLoading={isRetrying}
                leftIcon={<Icon name="refresh" size="xs" />}
                onClick={() => {
                  void executeSync(sessionId, true);
                }}
              >
                {isRetrying ? tr.retryingSyncButton : tr.retrySyncButton}
              </Button>
            </div>
          </Card>
        )}

        {viewState === "error" && (
          <Card padding="lg" className="flex flex-col gap-5">
            <Alert variant="error" title={tr.errorTitle}>
              {errorMessage ?? tr.missingSessionBody}
            </Alert>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() =>
                  navigateWithReplace(
                    onboarding.hasSelectedPlan ? "/profile" : "/select-plan",
                  )
                }
              >
                {onboarding.hasSelectedPlan
                  ? tr.backToProfileCta
                  : tr.backToSelectPlanCta}
              </Button>

              {sessionId && (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  isLoading={isRetrying}
                  leftIcon={<Icon name="refresh" size="xs" />}
                  onClick={() => {
                    void executeSync(sessionId, true);
                  }}
                >
                  {isRetrying ? tr.retryingSyncButton : tr.retrySyncButton}
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </AuthShell>
  );
}
