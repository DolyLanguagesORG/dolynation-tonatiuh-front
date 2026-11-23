"use client";

import {
  CheckoutElementsProvider,
  PaymentElement as CheckoutPaymentElement,
  useCheckoutElements,
} from "@stripe/react-stripe-js/checkout";
import { type FormEvent, useEffect, useId, useMemo, useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Eyebrow,
  Heading,
  Icon,
  IconButton,
  SkeletonCard,
  Text,
} from "@/components/ui";
import { type Dictionary, formatMessage } from "@/i18n";
import {
  type CheckoutSessionResponse,
  dolyStripeAppearance,
  getStripePromise,
} from "@/lib";

export interface StripeCheckoutModalProps {
  session: CheckoutSessionResponse | null;
  productTitle: string;
  productDescription?: string;
  amountLabel: string | null;
  isRecurring: boolean;
  t: Dictionary;
  onClose: () => void;
  onSuccess: (sessionId: string) => void | Promise<void>;
}

interface InnerCheckoutFormProps {
  session: CheckoutSessionResponse;
  amountLabel: string | null;
  t: Dictionary;
  onClose: () => void;
  onSuccess: (sessionId: string) => void | Promise<void>;
}

function InnerCheckoutForm({
  session,
  amountLabel,
  t,
  onClose,
  onSuccess,
}: InnerCheckoutFormProps) {
  const checkoutState = useCheckoutElements();
  const [isConfirming, setIsConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const tc = t.billing.checkout;

  if (checkoutState.type === "loading") {
    return <SkeletonCard lines={4} label={tc.loadingForm} />;
  }

  if (checkoutState.type === "error") {
    return (
      <div className="flex flex-col gap-3">
        <Alert variant="error" title={tc.errorTitle}>
          {checkoutState.error.message}
        </Alert>
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            {tc.cancelButton}
          </Button>
        </div>
      </div>
    );
  }

  const { checkout } = checkoutState;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (isConfirming) return;

    setErrorMessage(null);
    setIsConfirming(true);
    try {
      const result = await checkout.confirm({
        redirect: "if_required",
      });

      if (result.type === "error") {
        setErrorMessage(result.error.message);
        return;
      }

      await onSuccess(session.sessionId);
    } catch (err) {
      setErrorMessage(
        err instanceof Error && err.message
          ? err.message
          : tc.errorTitle,
      );
    } finally {
      setIsConfirming(false);
    }
  };

  const confirmText = amountLabel
    ? formatMessage(tc.confirmButton, { amount: amountLabel })
    : tc.confirmButtonFallback;

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-5">
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
        <CheckoutPaymentElement options={{ layout: "tabs" }} />
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
          disabled={isConfirming}
          onClick={onClose}
        >
          {tc.cancelButton}
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isConfirming}
          disabled={isConfirming}
          leftIcon={<Icon name="lock" size="xs" />}
        >
          {isConfirming ? tc.processingButton : confirmText}
        </Button>
      </div>
    </form>
  );
}

/**
 * Modal editorial Blanco y Negro para Checkout custom de Stripe Elements
 * (`ui_mode: 'elements'`) con fallback automático a redirección `hosted`.
 */
export function StripeCheckoutModal({
  session,
  productTitle,
  productDescription,
  amountLabel,
  isRecurring,
  t,
  onClose,
  onSuccess,
}: StripeCheckoutModalProps) {
  const titleId = useId();
  const tc = t.billing.checkout;

  const stripePromise = useMemo(
    () => getStripePromise(session?.publishableKey),
    [session?.publishableKey],
  );

  const clientSecret = session?.clientSecret ?? null;

  const checkoutOptions = useMemo(
    () =>
      clientSecret
        ? {
            clientSecret,
            elementsOptions: {
              appearance: dolyStripeAppearance,
            },
          }
        : null,
    [clientSecret],
  );

  useEffect(() => {
    if (!session) return;
    if (session.uiMode === "hosted" && session.url) {
      if (typeof window !== "undefined") {
        window.location.assign(session.url);
      }
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, session]);

  if (!session) {
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
              {tc.modalEyebrow}
            </Eyebrow>
            <Heading id={titleId} as="h2" variant="subsection">
              {productTitle}
            </Heading>
            {productDescription && (
              <Text variant="caption" tone="muted">
                {productDescription}
              </Text>
            )}
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
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-base border border-strong bg-neutral-primary-soft p-3.5">
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[10px] font-bold tracking-wider text-muted uppercase">
                {tc.summaryEyebrow}
              </span>
              <span className="text-sm font-bold text-heading">
                {tc.totalLabel}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {isRecurring ? tc.recurringBadge : tc.oneTimeBadge}
              </Badge>
              {amountLabel && (
                <span className="font-mono text-base font-bold text-heading tabular-nums">
                  {amountLabel}
                </span>
              )}
            </div>
          </div>

          {session.uiMode === "hosted" && session.url ? (
            <Alert variant="info">{tc.hostedRedirectNotice}</Alert>
          ) : checkoutOptions && stripePromise ? (
            <CheckoutElementsProvider
              stripe={stripePromise}
              options={checkoutOptions}
            >
              <InnerCheckoutForm
                session={session}
                amountLabel={amountLabel}
                t={t}
                onClose={onClose}
                onSuccess={onSuccess}
              />
            </CheckoutElementsProvider>
          ) : (
            <Alert variant="error" title={tc.errorTitle}>
              {tc.loadingForm}
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
