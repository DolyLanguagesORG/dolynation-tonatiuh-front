"use client";

import { useEffect, useId } from "react";

import { AdminRequestCard } from "@/app/admin/_components/admin-request-card";
import {
  ActionLink,
  Heading,
  Icon,
  IconButton,
  Text,
} from "@/components/ui";
import { formatMessage, type Dictionary, type Locale } from "@/i18n";
import { type AdminAccessRequest, type AdminUserRow } from "@/lib";

export interface RequestReviewModalProps {
  user: AdminUserRow | null;
  pendingRequests: readonly AdminAccessRequest[];
  t: Dictionary;
  locale: Locale;
  reviewingId: number | null;
  onClose: () => void;
  onApprove: (request: AdminAccessRequest) => Promise<boolean>;
  onReject: (request: AdminAccessRequest, reason: string) => Promise<boolean>;
}

/**
 * Modal de revisión rápida disparado desde una fila de la tabla de Usuarios
 * para aceptar o rechazar sus solicitudes pendientes sin salir del directorio.
 */
export function RequestReviewModal({
  user,
  pendingRequests,
  t,
  locale,
  reviewingId,
  onClose,
  onApprove,
  onReject,
}: RequestReviewModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!user) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape" && reviewingId === null) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, reviewingId, user]);

  if (!user) {
    return null;
  }

  const displayName = user.fullName?.trim() || user.email;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        onClick={() => {
          if (reviewingId === null) {
            onClose();
          }
        }}
        className="fixed inset-0 bg-brand/45 backdrop-blur-[1px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-base border border-default bg-surface shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-default bg-neutral-primary-soft px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <Heading id={titleId} as="h2" variant="subsection">
              {formatMessage(t.admin.users.modalTitle, { name: displayName })}
            </Heading>
            <Text variant="caption" tone="muted">
              {user.email} · {t.admin.users.modalSubtitle}
            </Text>
          </div>

          <IconButton
            icon="close"
            variant="ghost"
            size="sm"
            aria-label={t.admin.users.modalCloseAria}
            onClick={onClose}
            disabled={reviewingId !== null}
          />
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto p-5">
          {pendingRequests.map((req) => (
            <AdminRequestCard
              key={req.id}
              request={req}
              t={t}
              locale={locale}
              reviewingId={reviewingId}
              showRequesterHeader={false}
              onApprove={async (item) => {
                const ok = await onApprove(item);
                if (ok && pendingRequests.length <= 1) {
                  onClose();
                }
                return ok;
              }}
              onReject={async (item, reason) => {
                const ok = await onReject(item, reason);
                if (ok && pendingRequests.length <= 1) {
                  onClose();
                }
                return ok;
              }}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-default bg-neutral-primary-soft px-5 py-3">
          <ActionLink
            href={`/admin/users/${user.id}`}
            variant="ghost"
            size="xs"
            rightIcon={<Icon name="arrow-right" size="xs" />}
            onClick={onClose}
          >
            {t.admin.viewUserDetailButton}
          </ActionLink>
        </div>
      </div>
    </div>
  );
}
