"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Button, Icon } from "@/components/ui";
import { buildWhatsAppShareUrl } from "@/lib";

export interface CopyShareLinkActionsProps {
  url: string;
  shareText: string;
  copyLabel: string;
  copiedLabel: string;
  copyFailedLabel: string;
  whatsAppLabel: string;
  nativeShareLabel?: string;
}

const emptySubscribe = () => () => {};

function getCanNativeShare(): boolean {
  return (
    typeof navigator !== "undefined" && typeof navigator.share === "function"
  );
}

function legacyCopyText(value: string): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

/**
 * Controles accesibles para copiar un enlace de invitación o compartirlo por WhatsApp / Web Share.
 */
export function CopyShareLinkActions({
  url,
  shareText,
  copyLabel,
  copiedLabel,
  copyFailedLabel,
  whatsAppLabel,
  nativeShareLabel,
}: CopyShareLinkActionsProps) {
  const canNativeShare = useSyncExternalStore(
    emptySubscribe,
    getCanNativeShare,
    () => false,
  );
  const [feedback, setFeedback] = useState<{
    kind: "copied" | "error";
    liveText: string;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatToggleRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const announceFeedback = (kind: "copied" | "error", label: string) => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    repeatToggleRef.current = !repeatToggleRef.current;
    const liveText = repeatToggleRef.current ? label : `${label}\u00A0`;
    setFeedback({ kind, liveText });

    timerRef.current = setTimeout(() => {
      setFeedback(null);
      timerRef.current = null;
    }, 2400);
  };

  const handleCopy = async () => {
    let ok = false;
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      try {
        await navigator.clipboard.writeText(url);
        ok = true;
      } catch {
        ok = legacyCopyText(url);
      }
    } else {
      ok = legacyCopyText(url);
    }

    if (ok) {
      announceFeedback("copied", copiedLabel);
    } else {
      announceFeedback("error", copyFailedLabel);
    }
  };

  const handleNativeShare = async () => {
    if (!canNativeShare) {
      return;
    }
    try {
      await navigator.share({ url, text: shareText });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      await handleCopy();
    }
  };

  const buttonText =
    feedback?.kind === "copied"
      ? copiedLabel
      : feedback?.kind === "error"
        ? copyFailedLabel
        : copyLabel;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="min-h-9"
        leftIcon={
          <Icon
            name={feedback?.kind === "copied" ? "check" : "copy"}
            size="xs"
          />
        }
        onClick={() => {
          void handleCopy();
        }}
      >
        {buttonText}
      </Button>

      <a
        href={buildWhatsAppShareUrl(shareText)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-base border border-default-medium bg-neutral-primary-soft px-3 py-1.5 text-xs font-semibold text-heading transition-colors hover:border-brand hover:bg-neutral-secondary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        <Icon name="message-circle" size="xs" />
        <span>{whatsAppLabel}</span>
        <Icon name="external-link" size="xs" />
      </a>

      {canNativeShare && nativeShareLabel && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-9"
          leftIcon={<Icon name="share" size="xs" />}
          onClick={() => {
            void handleNativeShare();
          }}
        >
          {nativeShareLabel}
        </Button>
      )}

      <span
        role="status"
        aria-live="polite"
        className="font-mono text-xs font-semibold text-heading"
      >
        {feedback?.liveText ?? ""}
      </span>
    </div>
  );
}
