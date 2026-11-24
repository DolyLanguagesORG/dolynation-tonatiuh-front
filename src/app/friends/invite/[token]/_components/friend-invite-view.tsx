"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AuthShell } from "@/components/auth";
import { FloatingLocaleSelector } from "@/components/layout/floating-locale-selector";
import {
  ActionLink,
  Alert,
  Badge,
  Button,
  Eyebrow,
  Icon,
  SkeletonCard,
  Text,
} from "@/components/ui";
import { useAuth } from "@/context";
import { useToast } from "@/context/toast-context";
import { formatMessage, useLocale } from "@/i18n";
import {
  type AcceptFriendInviteLinkResponseDto,
  ApiClientError,
  consumePendingInviteRedirect,
  formatReadingDate,
  type FriendInviteLinkPreviewDto,
  friendsService,
  ROUTE_ADMIN,
  ROUTE_SELECT_PLAN,
  ROUTE_VERIFY_EMAIL,
  savePendingInviteRedirect,
} from "@/lib";

export interface FriendInviteViewProps {
  token: string;
}

type InviteDecisionState =
  | { kind: "accepted"; result: AcceptFriendInviteLinkResponseDto }
  | { kind: "declined" }
  | null;

/**
 * Pantalla editorial para aceptar o declinar una invitación de amistad compartida por enlace.
 */
export function FriendInviteView({ token }: FriendInviteViewProps) {
  const { locale, t } = useLocale();
  const toast = useToast();
  const { accessPhase, isAuthenticated } = useAuth();

  const [preview, setPreview] = useState<FriendInviteLinkPreviewDto | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState<
    "accept" | "decline" | null
  >(null);
  const [decision, setDecision] = useState<InviteDecisionState>(null);

  const cleanToken = token.trim();
  const invitePath = `/friends/invite/${encodeURIComponent(cleanToken)}`;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!cleanToken) {
        if (!cancelled) {
          setPreview(null);
          setLoadError(t.friends.invite.invalidBody);
          setIsLoading(false);
        }
        return;
      }

      try {
        const res = await friendsService.previewInviteLink(cleanToken);
        if (!cancelled) {
          setPreview(res.data ?? null);
          setLoadError(null);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiClientError
              ? err.getUserMessage(locale)
              : t.friends.invite.invalidBody;
          setPreview(null);
          setLoadError(message);
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cleanToken, locale, t.friends.invite.invalidBody]);

  useEffect(() => {
    if (!preview?.valid || preview.isOwnLink || preview.alreadyFriends) {
      return;
    }
    if (
      accessPhase === "unauthenticated" ||
      accessPhase === "unverified_email" ||
      accessPhase === "plan_required"
    ) {
      savePendingInviteRedirect(invitePath);
    }
  }, [accessPhase, invitePath, preview]);

  const inviterName =
    preview?.inviterName?.trim() || t.friends.anonymousName;

  const handleAccept = async () => {
    setActionError(null);
    setSubmittingAction("accept");
    try {
      const res = await friendsService.acceptInviteLink(cleanToken);
      consumePendingInviteRedirect();
      if (res.data) {
        setDecision({ kind: "accepted", result: res.data });
      }
      toast.success(
        formatMessage(t.friends.invite.acceptedBody, { name: inviterName }),
      );
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.getUserMessage(locale)
          : t.friends.common.errorTitle;
      setActionError(message);
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleDecline = async () => {
    setActionError(null);
    setSubmittingAction("decline");
    try {
      await friendsService.declineInviteLink(cleanToken);
      consumePendingInviteRedirect();
      setDecision({ kind: "declined" });
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.getUserMessage(locale)
          : t.friends.common.errorTitle;
      setActionError(message);
    } finally {
      setSubmittingAction(null);
    }
  };

  const resolveTitleAndSubtitle = (): { title: string; subtitle?: string } => {
    if (isLoading) {
      return { title: t.friends.invite.loadingLabel };
    }
    if (decision?.kind === "accepted") {
      return {
        title: t.friends.invite.acceptedTitle,
        subtitle: formatMessage(t.friends.invite.acceptedBody, {
          name:
            decision.result.friendName?.trim() || inviterName,
        }),
      };
    }
    if (decision?.kind === "declined") {
      return {
        title: t.friends.invite.declinedTitle,
        subtitle: t.friends.invite.declinedBody,
      };
    }
    if (preview?.isOwnLink) {
      return {
        title: t.friends.invite.ownLinkTitle,
        subtitle: t.friends.invite.ownLinkBody,
      };
    }
    if (preview?.alreadyFriends) {
      return {
        title: t.friends.invite.alreadyFriendsTitle,
        subtitle: formatMessage(t.friends.invite.alreadyFriendsBody, {
          name: inviterName,
        }),
      };
    }
    if (loadError || !preview || !preview.valid) {
      return {
        title: t.friends.invite.invalidTitle,
        subtitle: loadError ?? t.friends.invite.invalidBody,
      };
    }
    return {
      title: formatMessage(t.friends.invite.questionTitle, {
        name: inviterName,
      }),
      subtitle: t.friends.invite.questionSubtitle,
    };
  };

  const { title, subtitle } = resolveTitleAndSubtitle();

  return (
    <AuthShell
      title={title}
      subtitle={subtitle}
      maxWidthClass="max-w-lg"
      headerAction={<FloatingLocaleSelector />}
      topSlot={
        <div className="flex items-center justify-center">
          <Eyebrow tone="muted">{t.friends.invite.eyebrow}</Eyebrow>
        </div>
      }
      showSignOutWhenAuthenticated={accessPhase !== "admin"}
    >
      {isLoading ? (
        <SkeletonCard lines={3} label={t.friends.invite.loadingLabel} />
      ) : decision?.kind === "accepted" ? (
        <div className="flex flex-col gap-4">
          <Alert variant="success" title={t.friends.invite.acceptedTitle}>
            {formatMessage(t.friends.invite.acceptedBody, {
              name: decision.result.friendName?.trim() || inviterName,
            })}
          </Alert>
          <div className="flex flex-wrap items-center gap-3">
            <ActionLink
              href={`/friends/${decision.result.friendUserId}`}
              variant="primary"
              size="md"
              leftIcon={<Icon name="book-open" size="xs" />}
            >
              {formatMessage(t.friends.invite.openFriendProfileCta, {
                name: decision.result.friendName?.trim() || inviterName,
              })}
            </ActionLink>
            <ActionLink href="/friends" variant="secondary" size="md">
              {t.friends.invite.goToFriendsButton}
            </ActionLink>
          </div>
        </div>
      ) : decision?.kind === "declined" ? (
        <div className="flex flex-col gap-4">
          <Alert variant="info">{t.friends.invite.declinedBody}</Alert>
          <ActionLink href="/friends" variant="primary" size="md">
            {t.friends.invite.goToFriendsButton}
          </ActionLink>
        </div>
      ) : preview?.isOwnLink ? (
        <div className="flex flex-col gap-4">
          <Alert variant="info">{t.friends.invite.ownLinkBody}</Alert>
          <ActionLink href="/friends?tab=add" variant="primary" size="md">
            {t.friends.invite.goToFriendsButton}
          </ActionLink>
        </div>
      ) : preview?.alreadyFriends ? (
        <div className="flex flex-col gap-4">
          <Alert variant="success">
            {formatMessage(t.friends.invite.alreadyFriendsBody, {
              name: inviterName,
            })}
          </Alert>
          <ActionLink href="/friends" variant="primary" size="md">
            {t.friends.invite.goToFriendsButton}
          </ActionLink>
        </div>
      ) : loadError || !preview || !preview.valid ? (
        <div className="flex flex-col gap-4">
          <Alert variant="error" title={t.friends.invite.invalidTitle}>
            {loadError ?? t.friends.invite.invalidBody}
          </Alert>
          <ActionLink
            href={isAuthenticated ? "/friends" : "/login"}
            variant="secondary"
            size="md"
          >
            {isAuthenticated
              ? t.friends.invite.goToFriendsButton
              : t.friends.invite.loginToAcceptButton}
          </ActionLink>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {preview.expiresAt && (
            <div>
              <Badge variant="outline">
                {formatMessage(t.friends.invite.expiresNotice, {
                  date: formatReadingDate(preview.expiresAt, locale),
                })}
              </Badge>
            </div>
          )}

          {actionError && (
            <Alert variant="error" title={t.friends.common.errorTitle}>
              {actionError}
            </Alert>
          )}

          {accessPhase === "loading" ? (
            <SkeletonCard lines={2} label={t.friends.invite.loadingLabel} />
          ) : accessPhase === "admin" ? (
            <div className="flex flex-col gap-4">
              <Alert variant="warning" title={t.friends.invite.adminTitle}>
                {t.friends.invite.adminBody}
              </Alert>
              <ActionLink href={ROUTE_ADMIN} variant="secondary" size="md">
                {t.friends.invite.adminCta}
              </ActionLink>
            </div>
          ) : !isAuthenticated ? (
            <div className="flex flex-col gap-4">
              <Text variant="small" tone="body">
                {t.friends.invite.unauthenticatedHint}
              </Text>
              <ActionLink
                href={`/login?redirect=${encodeURIComponent(invitePath)}`}
                variant="primary"
                size="md"
                onClick={() => savePendingInviteRedirect(invitePath)}
              >
                {t.friends.invite.loginToAcceptButton}
              </ActionLink>
              <Link
                href={`/register?redirect=${encodeURIComponent(invitePath)}`}
                onClick={() => savePendingInviteRedirect(invitePath)}
                className="text-center text-sm font-semibold text-heading underline underline-offset-4 transition-colors hover:text-muted"
              >
                {t.friends.invite.registerToAcceptLink}
              </Link>
            </div>
          ) : accessPhase === "unverified_email" ? (
            <div className="flex flex-col gap-4">
              <Alert variant="warning" title={t.friends.invite.unverifiedTitle}>
                {formatMessage(t.friends.invite.unverifiedBody, {
                  name: inviterName,
                })}
              </Alert>
              <ActionLink
                href={ROUTE_VERIFY_EMAIL}
                variant="primary"
                size="md"
                onClick={() => savePendingInviteRedirect(invitePath)}
              >
                {t.friends.invite.unverifiedCta}
              </ActionLink>
            </div>
          ) : accessPhase === "plan_required" ? (
            <div className="flex flex-col gap-4">
              <Alert
                variant="warning"
                title={t.friends.invite.planRequiredTitle}
              >
                {formatMessage(t.friends.invite.planRequiredBody, {
                  name: inviterName,
                })}
              </Alert>
              <ActionLink
                href={ROUTE_SELECT_PLAN}
                variant="primary"
                size="md"
                onClick={() => savePendingInviteRedirect(invitePath)}
              >
                {t.friends.invite.planRequiredCta}
              </ActionLink>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="primary"
                size="md"
                isLoading={submittingAction === "accept"}
                disabled={submittingAction !== null}
                leftIcon={<Icon name="check" size="xs" />}
                onClick={() => {
                  void handleAccept();
                }}
              >
                {t.friends.invite.acceptButton}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                isLoading={submittingAction === "decline"}
                disabled={submittingAction !== null}
                onClick={() => {
                  void handleDecline();
                }}
              >
                {t.friends.invite.declineButton}
              </Button>
            </div>
          )}
        </div>
      )}
    </AuthShell>
  );
}
