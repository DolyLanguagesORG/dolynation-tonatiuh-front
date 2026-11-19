"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { RegisterStepper } from "@/app/register/_components/register-stepper";
import { StepPlanSelection } from "@/app/register/_components/step-plan-selection";
import { AuthShell } from "@/components/auth";
import { FloatingLocaleSelector } from "@/components/layout/floating-locale-selector";
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Icon,
  SkeletonCard,
  Text,
} from "@/components/ui";
import { type SubscriptionPlanId, useAuth } from "@/context";
import { formatMessage, useLocale } from "@/i18n";
import { ApiClientError, subscriptionsService } from "@/lib";

/**
 * Vista dedicada para `/select-plan`: selección obligatoria de suscripción
 * o solicitud en lista de espera tras confirmar el correo electrónico.
 */
export function SelectPlanView() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const {
    isLoading,
    accessPhase,
    isAuthenticated,
    onboarding,
    user,
    accessRequests,
    accessRequestsEnabled = false,
    selectPlan,
    submitAccessRequest,
    cancelAccessRequest,
    reloadAccountState,
  } = useAuth();

  const [pickedPlan, setPickedPlan] = useState<SubscriptionPlanId | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [planError, setPlanError] = useState<string | null>(null);
  const [requestNotice, setRequestNotice] = useState<string | null>(null);
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Precargamos el catálogo público para comprobar disponibilidad en segundo plano.
  useEffect(() => {
    subscriptionsService.getPlans().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (accessPhase === "ready" && user?.subscriptionTier) {
      router.replace(
        onboarding.canGenerateReadings ? "/" : "/setup-preferences",
      );
    }
  }, [accessPhase, onboarding.canGenerateReadings, router, user?.subscriptionTier]);

  if (
    isLoading ||
    (accessPhase !== "plan_required" && accessPhase !== "ready")
  ) {
    return (
      <Container size="none" className="w-full max-w-5xl px-0">
        <SkeletonCard
          lines={6}
          label={t.auth.stepper.step3Plan.loadingLabel}
        />
      </Container>
    );
  }

  const s3 = t.auth.stepper.step3Plan;
  const pendingSubRequest = accessRequests?.pendingSubscriptionRequest ?? null;
  const latestRejectedSub =
    !pendingSubRequest
      ? (accessRequests?.requests.find(
          (item) =>
            item.requestType === "subscription" && item.status === "rejected",
        ) ?? null)
      : null;

  const effectivePlan: SubscriptionPlanId =
    pickedPlan ??
    pendingSubRequest?.requestedTier ??
    user?.subscriptionTier ??
    onboarding.subscriptionPlan ??
    "dolly_plus";

  const formatTierLabel = (tier: SubscriptionPlanId | null): string =>
    tier ? t.plans.tiers[tier].name : "-";

  const handleSubmitPlan = async (): Promise<void> => {
    if (!effectivePlan) {
      setPlanError(s3.selectPlanRequired);
      return;
    }
    if (isSubmittingPlan || pendingSubRequest) return;

    setPlanError(null);
    setRequestNotice(null);
    setIsSubmittingPlan(true);
    try {
      if (accessRequestsEnabled) {
        const trimmed = requestMessage.trim();
        await submitAccessRequest({
          type: "subscription",
          tier: effectivePlan,
          ...(trimmed ? { message: trimmed } : {}),
        });
        setRequestMessage("");
        setRequestNotice(s3.requestSuccessNotice);
      } else {
        await selectPlan(effectivePlan);
        router.replace("/setup-preferences");
      }
    } catch (error) {
      if (error instanceof ApiClientError) {
        setPlanError(error.getUserMessage(locale));
      } else {
        setPlanError(s3.saveErrorFallback);
      }
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  const handleRefreshStatus = async (): Promise<void> => {
    if (isRefreshingStatus) return;
    setIsRefreshingStatus(true);
    setPlanError(null);
    try {
      await reloadAccountState();
    } finally {
      setIsRefreshingStatus(false);
    }
  };

  const handleCancelPendingRequest = async (): Promise<void> => {
    if (!pendingSubRequest || isCancelling) return;
    setIsCancelling(true);
    setPlanError(null);
    try {
      await cancelAccessRequest(pendingSubRequest.id);
      setConfirmingCancel(false);
      setRequestNotice(s3.requestCancelledNotice);
    } catch (error) {
      setPlanError(
        error instanceof ApiClientError
          ? error.getUserMessage(locale)
          : s3.cancelErrorFallback,
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const stepBadge = s3.stepBadge;
  const sectionLabel = s3.sectionBadge;

  return (
    <AuthShell
      title={s3.title}
      subtitle={accessRequestsEnabled ? s3.waitlistSubtitle : s3.subtitle}
      maxWidthClass="max-w-5xl"
      headerAction={<FloatingLocaleSelector />}
      topSlot={
        <div className="flex flex-col gap-3">
          <RegisterStepper
            activeStep={3}
            isAuthenticated={isAuthenticated}
            onboarding={onboarding}
            stepsLabels={t.auth.stepper.steps}
            ariaLabel={t.meta.stepperAriaLabel}
          />
          <div className="flex items-center justify-between gap-2 px-1">
            <Badge variant="outline">{stepBadge}</Badge>
            <Badge variant="secondary">{sectionLabel}</Badge>
          </div>
        </div>
      }
      copyrightText={t.auth.register.copyrightNotice}
    >
      <div className="flex flex-col gap-5">
        {requestNotice && (
          <Alert
            variant="success"
            title={s3.pendingTitle}
            onDismiss={() => setRequestNotice(null)}
          >
            {requestNotice}
          </Alert>
        )}

        {accessRequestsEnabled && pendingSubRequest && (
          <Card
            padding="md"
            variant="subtle"
            className="flex flex-col gap-3 border-2 border-brand"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Icon name="clock" size="md" className="text-heading" />
                <Text variant="body" className="font-bold text-heading">
                  {s3.pendingTitle}
                </Text>
              </div>
              <Badge variant="warning">{s3.statusPendingBadge}</Badge>
            </div>

            <Text variant="small" tone="muted">
              {formatMessage(s3.pendingDescription, {
                plan: formatTierLabel(pendingSubRequest.requestedTier),
              })}
            </Text>

            {pendingSubRequest.userMessage && (
              <div className="rounded-base border border-default bg-surface px-3 py-2">
                <Text variant="caption" tone="muted" className="font-semibold">
                  {s3.pendingMessageLabel}
                </Text>
                <Text variant="small" className="mt-0.5 text-heading">
                  {pendingSubRequest.userMessage}
                </Text>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                isLoading={isRefreshingStatus}
                leftIcon={<Icon name="refresh" size="xs" />}
                onClick={() => {
                  void handleRefreshStatus();
                }}
              >
                {s3.refreshStatusButton}
              </Button>

              {!confirmingCancel ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isCancelling}
                  onClick={() => setConfirmingCancel(true)}
                >
                  {s3.cancelRequestButton}
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    isLoading={isCancelling}
                    onClick={() => {
                      void handleCancelPendingRequest();
                    }}
                  >
                    {s3.cancelConfirmButton}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isCancelling}
                    onClick={() => setConfirmingCancel(false)}
                  >
                    {t.profile.cancelButton}
                  </Button>
                </>
              )}
            </div>
          </Card>
        )}

        {accessRequestsEnabled &&
          latestRejectedSub &&
          latestRejectedSub.rejectionReason && (
            <Alert variant="warning" title={s3.rejectedTitle}>
              {formatMessage(s3.rejectedDescription, {
                plan: formatTierLabel(latestRejectedSub.requestedTier),
                reason: latestRejectedSub.rejectionReason,
              })}
            </Alert>
          )}

        <StepPlanSelection
          t={t}
          selectedPlan={effectivePlan}
          planError={planError}
          isSubmittingPlan={isSubmittingPlan}
          disabled={Boolean(accessRequestsEnabled && pendingSubRequest)}
          showMessageInput={accessRequestsEnabled}
          messageValue={requestMessage}
          onMessageChange={setRequestMessage}
          submitLabel={
            accessRequestsEnabled ? s3.requestSubmitButton : undefined
          }
          onDismissError={() => setPlanError(null)}
          onSelectPlan={(plan) => {
            setPickedPlan(plan);
            setPlanError(null);
          }}
          onSubmit={handleSubmitPlan}
        />
      </div>
    </AuthShell>
  );
}
