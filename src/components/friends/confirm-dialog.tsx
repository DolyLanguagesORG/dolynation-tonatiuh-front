"use client";

import { type PointerEvent as ReactPointerEvent, useEffect, useId, useRef } from "react";

import { Button, Heading, Icon, Text } from "@/components/ui";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

function isPointerOutsideDialog(
  dialog: HTMLDialogElement,
  clientX: number,
  clientY: number,
): boolean {
  const rect = dialog.getBoundingClientRect();
  return (
    clientX < rect.left ||
    clientX > rect.right ||
    clientY < rect.top ||
    clientY > rect.bottom
  );
}

/**
 * Diálogo de confirmación modal sobre `<dialog>` nativo (`showModal()`),
 * alineado con el sistema editorial Blanco y Negro de DolyNation.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const startedOutsideRef = useRef(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    dialog.setAttribute("closedby", isLoading ? "none" : "any");

    if (open) {
      if (typeof dialog.showModal === "function") {
        if (!dialog.open) {
          dialog.showModal();
        }
      } else {
        dialog.setAttribute("open", "");
      }

      if (destructive) {
        cancelButtonRef.current?.focus();
      }
      return;
    }

    if (typeof dialog.close === "function") {
      if (dialog.open) {
        dialog.close();
      }
    } else {
      dialog.removeAttribute("open");
    }
  }, [destructive, isLoading, open]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog || isLoading) {
      startedOutsideRef.current = false;
      return;
    }
    startedOutsideRef.current = isPointerOutsideDialog(
      dialog,
      event.clientX,
      event.clientY,
    );
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog || isLoading) {
      startedOutsideRef.current = false;
      return;
    }
    const supportsNativeClosedBy = "closedBy" in HTMLDialogElement.prototype;
    if (
      !supportsNativeClosedBy &&
      startedOutsideRef.current &&
      isPointerOutsideDialog(dialog, event.clientX, event.clientY)
    ) {
      startedOutsideRef.current = false;
      onCancel();
      return;
    }
    startedOutsideRef.current = false;
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!isLoading) {
          onCancel();
        }
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="m-auto w-[min(100%-2rem,28rem)] rounded-base border border-default bg-neutral-primary-soft p-0 text-heading shadow-xl"
    >
      <div className="flex flex-col gap-5 p-6">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className={[
              "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-base border",
              destructive
                ? "border-status-error-border bg-status-error-bg text-status-error"
                : "border-default-medium bg-neutral-secondary-soft text-heading",
            ].join(" ")}
          >
            <Icon
              name={destructive ? "alert-triangle" : "info"}
              size="sm"
            />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Heading id={titleId} as="h2" variant="subsection">
              {title}
            </Heading>
            <Text id={descriptionId} variant="small" tone="body">
              {description}
            </Text>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-default pt-4">
          <Button
            ref={cancelButtonRef}
            type="button"
            variant="secondary"
            size="sm"
            autoFocus={destructive}
            disabled={isLoading}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "danger" : "primary"}
            size="sm"
            isLoading={isLoading}
            onClick={() => {
              void onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
