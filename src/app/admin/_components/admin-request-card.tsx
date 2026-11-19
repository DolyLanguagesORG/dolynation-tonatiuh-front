"use client";

import { useState } from "react";

import {
  ADMIN_REQUEST_STATUS_BADGE,
  formatAdminDateTime,
  formatAdminTierLabel,
} from "@/app/admin/_components/admin-formatters";
import {
  ActionLink,
  Badge,
  Button,
  Card,
  Icon,
  Text,
  Textarea,
} from "@/components/ui";
import { type Dictionary, type Locale } from "@/i18n";
import { type AdminAccessRequest } from "@/lib";

export interface AdminRequestCardProps {
  request: AdminAccessRequest;
  t: Dictionary;
  locale: Locale;
  reviewingId: number | null;
  showRequesterHeader?: boolean;
  showDetailLink?: boolean;
  onApprove: (request: AdminAccessRequest) => Promise<boolean>;
  onReject: (request: AdminAccessRequest, reason: string) => Promise<boolean>;
}

/**
 * Tarjeta reutilizable para visualizar y resolver una solicitud de acceso
 * (usada en `/admin/requests`, `/admin/users/[id]` y el modal de revisión rápida).
 */
export function AdminRequestCard({
  request,
  t,
  locale,
  reviewingId,
  showRequesterHeader = true,
  showDetailLink = false,
  onApprove,
  onReject,
}: AdminRequestCardProps) {
  const [isRejectingOpen, setIsRejectingOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const isPending = request.status === "pending";
  const isBusy = reviewingId === request.id;

  const requestedSummary =
    request.requestType === "subscription"
      ? `${t.accessRequests.type.subscription}: ${formatAdminTierLabel(request.requestedTier, t)}`
      : t.admin.requests.languageUnlockLabel;

  const handleConfirmReject = async (): Promise<void> => {
    if (rejectionReason.trim().length < 5) {
      setValidationError(t.admin.requests.reasonMinError);
      return;
    }
    setValidationError(null);
    const ok = await onReject(request, rejectionReason);
    if (ok) {
      setIsRejectingOpen(false);
      setRejectionReason("");
    }
  };

  return (
    <Card
      as="article"
      padding="md"
      data-testid={`admin-request-card-${request.id}`}
      className="flex flex-col gap-3.5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        {showRequesterHeader ? (
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-serif text-base font-bold text-heading">
                {request.userFullName || t.admin.requests.noName}
              </span>
              <Badge
                variant={request.userEmailVerifiedAt ? "success" : "warning"}
              >
                {request.userEmailVerifiedAt
                  ? t.admin.requests.verifiedBadge
                  : t.admin.requests.unverifiedBadge}
              </Badge>
              <Badge variant="outline">
                {formatAdminTierLabel(request.userCurrentTier, t)}
              </Badge>
            </div>

            <Text variant="caption" className="font-mono text-muted">
              {request.userEmail} · {t.admin.requests.submittedAtPrefix}{" "}
              {formatAdminDateTime(request.createdAt, locale)}
            </Text>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-heading">
              {requestedSummary}
            </span>
            <Text variant="caption" tone="muted">
              {t.admin.requests.submittedAtPrefix}{" "}
              {formatAdminDateTime(request.createdAt, locale)}
            </Text>
          </div>
        )}

        <div className="flex items-center gap-2">
          {showDetailLink && (
            <ActionLink
              href={`/admin/users/${request.userId}`}
              variant="ghost"
              size="xs"
            >
              {t.admin.requests.requesterLinkLabel}
            </ActionLink>
          )}
          <Badge variant={ADMIN_REQUEST_STATUS_BADGE[request.status]}>
            {t.accessRequests.status[request.status]}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-base border border-default bg-neutral-primary-soft p-3">
        {showRequesterHeader && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-heading">
              {requestedSummary}
            </span>
            <span className="font-mono text-[11px] uppercase text-muted">
              ID #{request.id}
            </span>
          </div>
        )}

        <div className="text-xs text-body">
          <span className="font-semibold text-heading">
            {t.admin.requests.userMessagePrefix}{" "}
          </span>
          {request.userMessage ? (
            <span>{request.userMessage}</span>
          ) : (
            <span className="italic text-muted">
              {t.admin.requests.noMessage}
            </span>
          )}
        </div>

        {request.rejectionReason && (
          <div className="border-t border-default pt-2 text-xs text-status-error">
            <span className="font-semibold">
              {t.admin.requests.rejectionReasonPrefix}{" "}
            </span>
            <span>{request.rejectionReason}</span>
          </div>
        )}

        {request.reviewedAt && (
          <Text variant="caption" tone="subtle">
            {t.admin.requests.reviewedAtPrefix}{" "}
            {formatAdminDateTime(request.reviewedAt, locale)}
          </Text>
        )}
      </div>

      {isPending && (
        <div className="flex flex-col gap-3 border-t border-default pt-3">
          {!isRejectingOpen ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                isLoading={isBusy}
                disabled={reviewingId !== null}
                leftIcon={<Icon name="check" size="xs" />}
                onClick={() => {
                  void onApprove(request);
                }}
              >
                {isBusy
                  ? t.admin.requests.approvingButton
                  : t.admin.requests.approveButton}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={reviewingId !== null}
                onClick={() => {
                  setIsRejectingOpen(true);
                  setRejectionReason("");
                  setValidationError(null);
                }}
              >
                {t.admin.requests.rejectButton}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-base border border-default bg-surface p-3">
              <Textarea
                label={t.admin.requests.reasonLabel}
                placeholder={t.admin.requests.reasonPlaceholder}
                value={rejectionReason}
                error={validationError ?? undefined}
                maxLength={1000}
                rows={3}
                onChange={(event) => {
                  setRejectionReason(event.target.value);
                  if (validationError) {
                    setValidationError(null);
                  }
                }}
              />

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  isLoading={isBusy}
                  disabled={reviewingId !== null}
                  onClick={() => {
                    void handleConfirmReject();
                  }}
                >
                  {isBusy
                    ? t.admin.requests.rejectingButton
                    : t.admin.requests.confirmRejectButton}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => {
                    setIsRejectingOpen(false);
                    setRejectionReason("");
                    setValidationError(null);
                  }}
                >
                  {t.admin.requests.cancelRejectButton}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
