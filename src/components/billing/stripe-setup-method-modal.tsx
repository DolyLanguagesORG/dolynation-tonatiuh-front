"use client";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { type FormEvent, useEffect, useId, useMemo, useState } from "react";

import {
  Alert,
  Button,
  Eyebrow,
  Heading,
  Icon,
  IconButton,
  SkeletonCard,
  Text,
} from "@/components/ui";
import { type Dictionary, type Locale } from "@/i18n";
import {
  ApiClientError,
  type BillingPaymentMethodSummary,
  billingService,
  dolyStripeAppearance,
  getStripePromise,
  type SetupIntentResponse,
} from "@/lib";

export interface StripeSetupMethodModalProps {
  setupSession: SetupIntentResponse | null;
  t: Dictionary;
  locale: Locale;
  onClose: () => void;
  onSuccess: (summary: BillingPaymentMethodSummary) => void | Promise<void>;
}

interface InnerSetupFormProps {
  t: Dictionary;
  locale: Locale;
  onClose: () => void;
  onSuccess: (summary: BillingPaymentMethodSummary) => void | Promise<void>;
}

function InnerSetupForm({
  t,
  locale,
  onClose,
  onSuccess,
}: InnerSetupFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const tm = t.billing.subscriptionManage;
  const tc = t.billing.checkout;

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    if (!stripe || !elements || isSubmitting) return;

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const returnUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/profile#subscription`
          : "/profile#subscription";

      const result = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: "if_required",
      });

      if (result.error) {
        setErrorMessage(result.error.message ?? tc.errorTitle);
        return;
      }

      const rawPm = result.setupIntent?.payment_method;
      const paymentMethodId =
        typeof rawPm === "string"
          ? rawPm
          : rawPm && typeof rawPm === "object" && "id" in rawPm
            ? String((rawPm as { id: unknown }).id)
            : "";

      if (!paymentMethodId) {
        setErrorMessage(tc.errorTitle);
        return;
      }

      const defaultRes = await billingService.setDefaultPaymentMethod({
        paymentMethodId,
      });
      await onSuccess(defaultRes.data);
    } catch (err) {
      setErrorMessage(
        err instanceof ApiClientError
          ? err.getUserMessage(locale)
          : err instanceof Error && err.message
            ? err.message
            : tc.errorTitle,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex flex-col gap-5"
    >
      {errorMessage && (
        <Alert
          variant="error"
          title={tc.errorTitle}
          onDismiss={() => setErrorMessage(null)}
        >
          {errorMessage}
        </Alert>
      )}

      <div className="rounded-base border border-default bg-surface p-3.5">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      <div className="flex items-start gap-2 rounded-base border border-default bg-neutral-primary-soft px-3 py-2.5">
        <Icon name="lock" size="xs" className="mt-0.5 shrink-0 text-heading" />
        <Text variant="caption" tone="muted">
          {tc.secureNotice}
        </Text>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-default pt-4">
        <Button
          type="button"
          variant="outline"
          size="md"
          disabled={isSubmitting}
          onClick={onClose}
        >
          {tc.cancelButton}
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSubmitting}
          disabled={!stripe || !elements || isSubmitting}
          leftIcon={<Icon name="lock" size="xs" />}
        >
          {isSubmitting ? tm.savingCardButton : tm.saveCardButton}
        </Button>
      </div>
    </form>
  );
}

/**
 * Modal editorial Blanco y Negro para capturar o actualizar la tarjeta predeterminada
 * mediante `SetupIntent` + `<Elements>` + `<PaymentElement>` + `stripe.confirmSetup()`.
 */
export function StripeSetupMethodModal({
  setupSession,
  t,
  locale,
  onClose,
  onSuccess,
}: StripeSetupMethodModalProps) {
  const titleId = useId();
  const tm = t.billing.subscriptionManage;
  const tc = t.billing.checkout;

  const stripePromise = useMemo(
    () => getStripePromise(setupSession?.publishableKey),
    [setupSession?.publishableKey],
  );

  const clientSecret = setupSession?.clientSecret ?? null;

  const elementsOptions = useMemo(
    () =>
      clientSecret
        ? {
            clientSecret,
            appearance: dolyStripeAppearance,
          }
        : null,
    [clientSecret],
  );

  useEffect(() => {
    if (!setupSession) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, setupSession]);

  if (!setupSession) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-brand/45 backdrop-blur-[1px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-base border border-default bg-surface shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-default bg-neutral-primary-soft px-5 py-4">
          <div className="flex flex-col gap-1">
            <Eyebrow tone="muted" className="text-[10px]">
              {tm.setupModalEyebrow}
            </Eyebrow>
            <Heading id={titleId} as="h2" variant="subsection">
              {tm.setupModalTitle}
            </Heading>
            <Text variant="caption" tone="muted">
              {tm.setupModalSubtitle}
            </Text>
          </div>

          <IconButton
            icon="close"
            variant="ghost"
            size="sm"
            aria-label={tc.closeAria}
            onClick={onClose}
          />
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto p-5">
          {stripePromise && elementsOptions ? (
            <Elements stripe={stripePromise} options={elementsOptions}>
              <InnerSetupForm
                t={t}
                locale={locale}
                onClose={onClose}
                onSuccess={onSuccess}
              />
            </Elements>
          ) : (
            <SkeletonCard lines={4} label={tc.loadingForm} />
          )}
        </div>
      </div>
    </div>
  );
}
