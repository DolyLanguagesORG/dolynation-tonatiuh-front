"use client";

import { type FormEvent, type KeyboardEvent, useRef, useState } from "react";

import {
  type FriendsHubTab,
  useFriendsHub,
} from "@/app/friends/_hooks/use-friends-hub";
import { RequireAuth } from "@/components/auth";
import {
  ConfirmDialog,
  CopyShareLinkActions,
  FriendStreakCard,
  FriendStreakFormModal,
} from "@/components/friends";
import {
  ActionLink,
  Alert,
  Badge,
  Button,
  Card,
  Container,
  EmptyState,
  Heading,
  Icon,
  Input,
  PageHeader,
  Pagination,
  Select,
  SkeletonCard,
  Text,
} from "@/components/ui";
import { formatMessage } from "@/i18n";
import {
  type BlockedUserDto,
  buildFriendInviteUrl,
  formatReadingDate,
  type FriendInviteLinkDto,
  type FriendStreakDto,
  type FriendSummaryDto,
} from "@/lib";

const HUB_TABS: readonly FriendsHubTab[] = [
  "friends",
  "add",
  "requests",
  "streaks",
  "blocked",
];

type PendingConfirmAction =
  | { kind: "remove_friend"; friend: FriendSummaryDto }
  | { kind: "block_friend"; friend: FriendSummaryDto }
  | { kind: "revoke_link"; link: FriendInviteLinkDto }
  | { kind: "reject_streak"; streak: FriendStreakDto }
  | { kind: "end_streak"; streak: FriendStreakDto }
  | { kind: "unblock_user"; user: BlockedUserDto };

function resolveInviteUrl(link: FriendInviteLinkDto): string {
  if (link.url && link.url.trim().length > 0) {
    return link.url;
  }
  if (link.token && link.token.trim().length > 0) {
    return buildFriendInviteUrl(link.token);
  }
  return "";
}

function getInviteLinkStatus(
  link: FriendInviteLinkDto,
  referenceNowMs: number | null,
): "revoked" | "exhausted" | "expired" | "active" {
  if (link.revokedAt) {
    return "revoked";
  }
  if (link.maxUses !== null && link.usesCount >= link.maxUses) {
    return "exhausted";
  }
  if (
    referenceNowMs !== null &&
    new Date(link.expiresAt).getTime() <= referenceNowMs
  ) {
    return "expired";
  }
  return "active";
}

function FriendsHubContent({
  initialTab = "friends",
}: {
  initialTab?: FriendsHubTab;
}) {
  const hub = useFriendsHub(initialTab);
  const { t, locale } = hub;
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [confirmAction, setConfirmAction] =
    useState<PendingConfirmAction | null>(null);
  const [streakModalState, setStreakModalState] = useState<{
    mode: "accept" | "edit";
    streak: FriendStreakDto;
  } | null>(null);

  const incomingCount = hub.incomingRequests.length;
  const outgoingCount = hub.outgoingRequests.length;
  const pendingRequestsCount = incomingCount + outgoingCount;
  const pendingStreaks = hub.streaks.filter(
    (s) => s.status === "pending_partner",
  );
  const activeOrPausedStreaks = hub.streaks.filter(
    (s) => s.status === "active" || s.status === "paused",
  );

  const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = HUB_TABS.indexOf(hub.activeTab);
    if (currentIndex < 0) {
      return;
    }

    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % HUB_TABS.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + HUB_TABS.length) % HUB_TABS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = HUB_TABS.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextTab = HUB_TABS[nextIndex];
    hub.setActiveTab(nextTab);
    tabRefs.current[nextIndex]?.focus();
  };

  const handleSearchFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void hub.handleSearchSubmit();
  };

  const handleEmailFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void hub.sendRequestByEmail();
  };

  const resolveConfirmDialogMeta = () => {
    if (!confirmAction) {
      return {
        title: "",
        description: "",
        confirmLabel: t.friends.common.confirmButton,
      };
    }

    switch (confirmAction.kind) {
      case "remove_friend": {
        const name =
          confirmAction.friend.fullName?.trim() || t.friends.anonymousName;
        return {
          title: t.friends.hub.friendsTab.confirmRemoveTitle,
          description: formatMessage(
            t.friends.hub.friendsTab.confirmRemoveBody,
            { name },
          ),
          confirmLabel: t.friends.hub.friendsTab.confirmRemoveButton,
        };
      }
      case "block_friend": {
        const name =
          confirmAction.friend.fullName?.trim() || t.friends.anonymousName;
        return {
          title: t.friends.hub.friendsTab.confirmBlockTitle,
          description: formatMessage(
            t.friends.hub.friendsTab.confirmBlockBody,
            { name },
          ),
          confirmLabel: t.friends.hub.friendsTab.confirmBlockButton,
        };
      }
      case "revoke_link":
        return {
          title: t.friends.hub.addTab.confirmRevokeTitle,
          description: t.friends.hub.addTab.confirmRevokeBody,
          confirmLabel: t.friends.hub.addTab.confirmRevokeButton,
        };
      case "reject_streak": {
        const name =
          confirmAction.streak.partnerName?.trim() || t.friends.anonymousName;
        return {
          title: t.friends.hub.streaksTab.confirmRejectTitle,
          description: formatMessage(
            t.friends.hub.streaksTab.confirmRejectBody,
            { name },
          ),
          confirmLabel: t.friends.hub.streaksTab.confirmRejectButton,
        };
      }
      case "end_streak": {
        const name =
          confirmAction.streak.partnerName?.trim() || t.friends.anonymousName;
        return {
          title: t.friends.hub.streaksTab.confirmEndTitle,
          description: formatMessage(t.friends.hub.streaksTab.confirmEndBody, {
            name,
          }),
          confirmLabel: t.friends.hub.streaksTab.confirmEndButton,
        };
      }
      case "unblock_user": {
        const name =
          confirmAction.user.fullName?.trim() || t.friends.anonymousName;
        return {
          title: t.friends.hub.blockedTab.confirmUnblockTitle,
          description: formatMessage(
            t.friends.hub.blockedTab.confirmUnblockBody,
            { name },
          ),
          confirmLabel: t.friends.hub.blockedTab.confirmUnblockButton,
        };
      }
    }
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) {
      return;
    }

    const current = confirmAction;
    setConfirmAction(null);

    switch (current.kind) {
      case "remove_friend":
        await hub.removeFriend(
          current.friend.userId,
          current.friend.fullName?.trim() || t.friends.anonymousName,
        );
        return;
      case "block_friend":
        await hub.blockFriend(
          current.friend.userId,
          current.friend.fullName?.trim() || t.friends.anonymousName,
        );
        return;
      case "revoke_link":
        await hub.revokeInviteLink(current.link.id);
        return;
      case "reject_streak":
        await hub.rejectStreak(current.streak.id);
        return;
      case "end_streak":
        await hub.endStreak(current.streak.id);
        return;
      case "unblock_user":
        await hub.unblockUser(
          current.user.userId,
          current.user.fullName?.trim() || t.friends.anonymousName,
        );
    }
  };

  const confirmMeta = resolveConfirmDialogMeta();

  return (
    <Container size="xl" className="flex flex-col gap-6 py-8">
      <PageHeader
        eyebrow={t.friends.hub.eyebrow}
        title={t.friends.hub.title}
        subtitle={t.friends.hub.subtitle}
      />

      <div
        role="tablist"
        aria-label={t.friends.hub.tabsAriaLabel}
        onKeyDown={handleTabKeyDown}
        className="flex flex-nowrap gap-1 overflow-x-auto border-b border-default"
      >
        {HUB_TABS.map((tabId, index) => {
          const isSelected = hub.activeTab === tabId;
          const badgeValue =
            tabId === "friends"
              ? hub.friendsTotal
              : tabId === "requests"
                ? pendingRequestsCount
                : tabId === "streaks"
                  ? hub.streaks.length
                  : tabId === "blocked"
                    ? hub.blockedUsers.length
                    : null;

          return (
            <button
              key={tabId}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              id={`friends-tab-${tabId}`}
              type="button"
              role="tab"
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => {
                hub.setActiveTab(tabId);
                hub.setActionError(null);
              }}
              className={[
                "inline-flex min-h-10 flex-none items-center gap-2 border-b-2 px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring",
                isSelected
                  ? "border-ink text-heading"
                  : "border-transparent text-muted hover:border-default-medium hover:text-heading",
              ].join(" ")}
            >
              <span>{t.friends.hub.tabs[tabId]}</span>
              {badgeValue !== null && badgeValue > 0 && (
                <Badge variant={isSelected ? "primary" : "outline"}>
                  {badgeValue}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {hub.actionError && (
        <Alert
          variant="error"
          title={t.friends.common.errorTitle}
          onDismiss={() => hub.setActionError(null)}
          dismissLabel={t.friends.common.closeButton}
        >
          {hub.actionError}
        </Alert>
      )}

      {hub.isLoading ? (
        <SkeletonCard lines={5} label={t.friends.common.loadingLabel} />
      ) : hub.loadError ? (
        <Alert variant="error" title={t.friends.common.errorTitle}>
          <div className="flex flex-col items-start gap-3">
            <span>{hub.loadError}</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                void hub.reloadAll();
              }}
            >
              {t.friends.common.retryButton}
            </Button>
          </div>
        </Alert>
      ) : (
        <>
          {/* Tab 1: Mis amigos */}
          <section
            role="tabpanel"
            aria-labelledby="friends-tab-friends"
            hidden={hub.activeTab !== "friends"}
            className="flex flex-col gap-4"
          >
            <Card padding="md" className="flex flex-col gap-4 border-default">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Heading as="h2" variant="subsection">
                    {t.friends.hub.friendsTab.title}
                  </Heading>
                  <Badge variant="outline">
                    {formatMessage(t.friends.hub.friendsTab.countLabel, {
                      count: hub.friendsTotal,
                    })}
                  </Badge>
                </div>

                <form
                  onSubmit={handleSearchFormSubmit}
                  className="flex w-full flex-wrap items-center gap-2 sm:w-auto"
                >
                  <Input
                    label={t.friends.common.searchPlaceholder}
                    visuallyHiddenLabel
                    type="search"
                    value={hub.searchInput}
                    placeholder={t.friends.hub.friendsTab.searchPlaceholder}
                    onChange={(event) => hub.setSearchInput(event.target.value)}
                    containerClassName="min-w-56 flex-1 sm:flex-none"
                  />
                  <Button type="submit" variant="secondary" size="sm">
                    {t.friends.common.searchPlaceholder}
                  </Button>
                  {hub.appliedSearch && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        void hub.handleClearSearch();
                      }}
                    >
                      {t.friends.common.closeButton}
                    </Button>
                  )}
                </form>
              </div>
            </Card>

            {hub.friends.length === 0 ? (
              <EmptyState
                icon="users"
                title={t.friends.hub.friendsTab.emptyTitle}
                description={t.friends.hub.friendsTab.emptyDescription}
                actions={
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    leftIcon={<Icon name="user-plus" size="xs" />}
                    onClick={() => hub.setActiveTab("add")}
                  >
                    {t.friends.hub.friendsTab.emptyAction}
                  </Button>
                }
              />
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  {hub.friends.map((friend) => {
                    const name =
                      friend.fullName?.trim() || t.friends.anonymousName;
                    return (
                      <Card
                        key={friend.userId}
                        as="article"
                        padding="md"
                        className="flex flex-col justify-between gap-4 border-default"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <Heading as="h3" variant="subsection">
                              {name}
                            </Heading>
                            {friend.activeStreak && (
                              <Badge variant="primary">
                                {formatMessage(
                                  t.friends.hub.friendsTab.streakBadge,
                                  {
                                    count: friend.activeStreak.currentStreak,
                                  },
                                )}
                              </Badge>
                            )}
                          </div>

                          <Text variant="caption" tone="muted" className="font-mono uppercase">
                            {formatMessage(t.friends.hub.friendsTab.sinceLabel, {
                              date: formatReadingDate(friend.since, locale),
                            })}
                          </Text>

                          {friend.activeStreak &&
                            typeof friend.activeStreak.myCompletedToday ===
                              "boolean" && (
                              <div>
                                <Badge
                                  variant={
                                    friend.activeStreak.myCompletedToday
                                      ? "success"
                                      : "outline"
                                  }
                                >
                                  {friend.activeStreak.myCompletedToday
                                    ? t.friends.hub.friendsTab.todayDonePill
                                    : t.friends.hub.friendsTab.todayPendingPill}
                                </Badge>
                              </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-default pt-3">
                          <ActionLink
                            href={`/friends/${friend.userId}`}
                            variant="primary"
                            size="sm"
                            leftIcon={<Icon name="book-open" size="xs" />}
                          >
                            {t.friends.hub.friendsTab.openProfileButton}
                          </ActionLink>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <Button
                              type="button"
                              variant="secondary"
                              size="xs"
                              disabled={hub.isMutating}
                              leftIcon={<Icon name="user-x" size="xs" />}
                              onClick={() =>
                                setConfirmAction({
                                  kind: "remove_friend",
                                  friend,
                                })
                              }
                            >
                              {t.friends.hub.friendsTab.removeButton}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="xs"
                              disabled={hub.isMutating}
                              leftIcon={<Icon name="ban" size="xs" />}
                              onClick={() =>
                                setConfirmAction({
                                  kind: "block_friend",
                                  friend,
                                })
                              }
                            >
                              {t.friends.hub.friendsTab.blockButton}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {hub.friendsTotalPages > 1 && (
                  <Pagination
                    currentPage={hub.friendsPage}
                    totalPages={hub.friendsTotalPages}
                    totalItems={hub.friendsTotal}
                    visibleItemsCount={hub.friends.length}
                    previousLabel={t.friends.common.pagePrev}
                    nextLabel={t.friends.common.pageNext}
                    summaryText={formatMessage(
                      t.friends.common.paginationSummary,
                      {
                        visible: hub.friends.length,
                        total: hub.friendsTotal,
                      },
                    )}
                    onPageChange={(page) => {
                      void hub.handlePageChange(page);
                    }}
                  />
                )}
              </>
            )}
          </section>

          {/* Tab 2: Agregar amigo (correo + links compartibles) */}
          <section
            role="tabpanel"
            aria-labelledby="friends-tab-add"
            hidden={hub.activeTab !== "add"}
            className="grid gap-6 lg:grid-cols-2"
          >
            <Card padding="md" className="flex flex-col gap-4 border-default">
              <div className="flex flex-col gap-1">
                <Heading as="h2" variant="subsection">
                  {t.friends.hub.addTab.emailSectionTitle}
                </Heading>
                <Text variant="small" tone="muted">
                  {t.friends.hub.addTab.emailSectionDesc}
                </Text>
              </div>

              <form
                onSubmit={handleEmailFormSubmit}
                noValidate
                className="flex flex-col gap-3"
              >
                <Input
                  label={t.friends.hub.addTab.emailLabel}
                  type="email"
                  required
                  value={hub.emailInput}
                  placeholder={t.friends.hub.addTab.emailPlaceholder}
                  error={hub.emailFieldError ?? undefined}
                  disabled={hub.isMutating}
                  onChange={(event) => {
                    hub.setEmailInput(event.target.value);
                    hub.setEmailFieldError(null);
                  }}
                />
                <div className="flex justify-start">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={hub.isMutating}
                    leftIcon={<Icon name="mail" size="xs" />}
                  >
                    {hub.isMutating
                      ? t.friends.hub.addTab.sendingEmailButton
                      : t.friends.hub.addTab.sendEmailButton}
                  </Button>
                </div>
              </form>

              {hub.emailSentTarget && (
                <Alert
                  variant="success"
                  title={t.friends.hub.addTab.emailSentTitle}
                >
                  {formatMessage(t.friends.hub.addTab.emailSentNotice, {
                    email: hub.emailSentTarget,
                  })}
                </Alert>
              )}
            </Card>

            <Card padding="md" className="flex flex-col gap-4 border-default">
              <div className="flex flex-col gap-1">
                <Heading as="h2" variant="subsection">
                  {t.friends.hub.addTab.linksSectionTitle}
                </Heading>
                <Text variant="small" tone="muted">
                  {t.friends.hub.addTab.linksSectionDesc}
                </Text>
              </div>

              <div className="flex flex-col gap-3">
                <Select
                  label={t.friends.hub.addTab.maxUsesLabel}
                  value={hub.maxUsesChoice}
                  disabled={hub.isMutating}
                  options={[
                    {
                      value: "1",
                      label: t.friends.hub.addTab.maxUsesSingleOption,
                    },
                    {
                      value: "unlimited",
                      label: t.friends.hub.addTab.maxUsesMultiOption,
                    },
                  ]}
                  onChange={(event) =>
                    hub.setMaxUsesChoice(
                      event.target.value === "unlimited" ? "unlimited" : "1",
                    )
                  }
                />

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    isLoading={hub.isMutating}
                    leftIcon={<Icon name="link" size="xs" />}
                    onClick={() => {
                      void hub.createInviteLink();
                    }}
                  >
                    {hub.isMutating
                      ? t.friends.hub.addTab.creatingLinkButton
                      : t.friends.hub.addTab.createLinkButton}
                  </Button>
                  <Text variant="caption" tone="muted">
                    {t.friends.hub.addTab.expiresNote}
                  </Text>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-default pt-4">
                <Heading as="h3" variant="subsection">
                  {t.friends.hub.addTab.myLinksTitle}
                </Heading>

                {hub.inviteLinks.length === 0 ? (
                  <Text variant="small" tone="muted">
                    {t.friends.hub.addTab.myLinksEmpty}
                  </Text>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {hub.inviteLinks.map((link) => {
                      const status = getInviteLinkStatus(
                        link,
                        hub.referenceNowMs,
                      );
                      const inviteUrl = resolveInviteUrl(link);
                      const shareText = inviteUrl
                        ? formatMessage(
                            t.friends.hub.addTab.whatsappInviteText,
                            { url: inviteUrl },
                          )
                        : "";

                      return (
                        <li
                          key={link.id}
                          className="flex flex-col gap-2 rounded-base border border-default bg-neutral-secondary-soft p-3.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant={
                                  status === "active"
                                    ? "success"
                                    : status === "revoked"
                                      ? "error"
                                      : "secondary"
                                }
                              >
                                {status === "active"
                                  ? t.friends.hub.addTab.activeBadge
                                  : status === "revoked"
                                    ? t.friends.hub.addTab.revokedBadge
                                    : status === "exhausted"
                                      ? t.friends.hub.addTab.exhaustedBadge
                                      : t.friends.hub.addTab.expiredBadge}
                              </Badge>
                              <Text variant="caption" className="font-mono">
                                {link.maxUses === null
                                  ? formatMessage(
                                      t.friends.hub.addTab.usesUnlimitedSummary,
                                      { used: link.usesCount },
                                    )
                                  : formatMessage(
                                      t.friends.hub.addTab.usesSummary,
                                      {
                                        used: link.usesCount,
                                        limit: link.maxUses,
                                      },
                                    )}
                              </Text>
                            </div>

                            <Text variant="caption" tone="muted" className="font-mono">
                              {formatMessage(
                                t.friends.hub.addTab.expiresAtLabel,
                                {
                                  date: formatReadingDate(link.expiresAt, locale),
                                },
                              )}
                            </Text>
                          </div>

                          {inviteUrl && (
                            <Text
                              variant="caption"
                              className="truncate font-mono text-body"
                            >
                              {inviteUrl}
                            </Text>
                          )}

                          {status === "active" && (
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                              {inviteUrl ? (
                                <CopyShareLinkActions
                                  url={inviteUrl}
                                  shareText={shareText}
                                  copyLabel={t.friends.hub.addTab.copyButton}
                                  copiedLabel={
                                    t.friends.hub.addTab.copiedFeedback
                                  }
                                  copyFailedLabel={
                                    t.friends.hub.addTab.copyFailedFeedback
                                  }
                                  whatsAppLabel={
                                    t.friends.hub.addTab.shareWhatsAppButton
                                  }
                                  nativeShareLabel={
                                    t.friends.hub.addTab.shareNativeButton
                                  }
                                />
                              ) : (
                                <span />
                              )}

                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                disabled={hub.isMutating}
                                onClick={() =>
                                  setConfirmAction({
                                    kind: "revoke_link",
                                    link,
                                  })
                                }
                              >
                                {t.friends.hub.addTab.revokeButton}
                              </Button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </Card>
          </section>

          {/* Tab 3: Solicitudes */}
          <section
            role="tabpanel"
            aria-labelledby="friends-tab-requests"
            hidden={hub.activeTab !== "requests"}
            className="grid gap-6 lg:grid-cols-2"
          >
            <Card padding="md" className="flex flex-col gap-4 border-default">
              <div className="flex items-center justify-between gap-2">
                <Heading as="h2" variant="subsection">
                  {t.friends.hub.requestsTab.incomingTitle}
                </Heading>
                <Badge variant="outline">{incomingCount}</Badge>
              </div>

              {incomingCount === 0 ? (
                <Text variant="small" tone="muted">
                  {t.friends.hub.requestsTab.incomingEmpty}
                </Text>
              ) : (
                <ul className="flex flex-col gap-3">
                  {hub.incomingRequests.map((req) => {
                    const name =
                      req.requesterName?.trim() || t.friends.anonymousName;
                    return (
                      <li
                        key={req.id}
                        className="flex flex-col gap-3 rounded-base border border-default p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-serif text-base font-bold text-heading">
                              {name}
                            </span>
                            {req.requesterEmail && (
                              <span className="font-mono text-xs text-muted">
                                {req.requesterEmail}
                              </span>
                            )}
                          </div>
                          <Badge variant="outline">
                            {req.origin === "invite_link"
                              ? t.friends.hub.requestsTab.originLinkBadge
                              : t.friends.hub.requestsTab.originEmailBadge}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-default pt-3">
                          <Text variant="caption" tone="muted" className="font-mono uppercase">
                            {formatMessage(
                              t.friends.hub.requestsTab.requestedOnLabel,
                              { date: formatReadingDate(req.createdAt, locale) },
                            )}
                          </Text>

                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              variant="primary"
                              size="xs"
                              disabled={hub.isMutating}
                              onClick={() => {
                                void hub.acceptIncomingRequest(req.id, name);
                              }}
                            >
                              {t.friends.hub.requestsTab.acceptButton}
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="xs"
                              disabled={hub.isMutating}
                              onClick={() => {
                                void hub.rejectIncomingRequest(req.id);
                              }}
                            >
                              {t.friends.hub.requestsTab.rejectButton}
                            </Button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card padding="md" className="flex flex-col gap-4 border-default">
              <div className="flex items-center justify-between gap-2">
                <Heading as="h2" variant="subsection">
                  {t.friends.hub.requestsTab.outgoingTitle}
                </Heading>
                <Badge variant="outline">{outgoingCount}</Badge>
              </div>

              {outgoingCount === 0 ? (
                <Text variant="small" tone="muted">
                  {t.friends.hub.requestsTab.outgoingEmpty}
                </Text>
              ) : (
                <ul className="flex flex-col gap-3">
                  {hub.outgoingRequests.map((req) => {
                    const name =
                      req.addresseeName?.trim() ||
                      req.addresseeEmail ||
                      t.friends.anonymousName;
                    return (
                      <li
                        key={req.id}
                        className="flex flex-col gap-3 rounded-base border border-default p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-serif text-base font-bold text-heading">
                              {name}
                            </span>
                            {req.addresseeEmail && req.addresseeName && (
                              <span className="font-mono text-xs text-muted">
                                {req.addresseeEmail}
                              </span>
                            )}
                          </div>
                          <Badge variant="outline">
                            {req.origin === "invite_link"
                              ? t.friends.hub.requestsTab.originLinkBadge
                              : t.friends.hub.requestsTab.originEmailBadge}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-default pt-3">
                          <Text variant="caption" tone="muted" className="font-mono uppercase">
                            {formatMessage(
                              t.friends.hub.requestsTab.requestedOnLabel,
                              { date: formatReadingDate(req.createdAt, locale) },
                            )}
                          </Text>

                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            disabled={hub.isMutating}
                            onClick={() => {
                              void hub.cancelOutgoingRequest(req.id);
                            }}
                          >
                            {t.friends.hub.requestsTab.cancelButton}
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </section>

          {/* Tab 4: Rachas */}
          <section
            role="tabpanel"
            aria-labelledby="friends-tab-streaks"
            hidden={hub.activeTab !== "streaks"}
            className="flex flex-col gap-6"
          >
            {hub.streaks.length === 0 ? (
              <EmptyState
                icon="flame"
                title={t.friends.hub.streaksTab.emptyTitle}
                description={t.friends.hub.streaksTab.emptyDescription}
              />
            ) : (
              <>
                {pendingStreaks.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <Heading as="h2" variant="subsection">
                      {t.friends.hub.streaksTab.pendingTitle}
                    </Heading>
                    <div className="flex flex-col gap-4">
                      {pendingStreaks.map((streak) => (
                        <FriendStreakCard
                          key={streak.id}
                          t={t}
                          locale={locale}
                          streak={streak}
                          isMutating={hub.isMutating}
                          onAccept={(selectedStreak) =>
                            setStreakModalState({
                              mode: "accept",
                              streak: selectedStreak,
                            })
                          }
                          onReject={(selectedStreak) =>
                            setConfirmAction({
                              kind: "reject_streak",
                              streak: selectedStreak,
                            })
                          }
                          onEditCategories={(selectedStreak) =>
                            setStreakModalState({
                              mode: "edit",
                              streak: selectedStreak,
                            })
                          }
                          onEnd={(selectedStreak) =>
                            setConfirmAction({
                              kind: "end_streak",
                              streak: selectedStreak,
                            })
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}

                {activeOrPausedStreaks.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <Heading as="h2" variant="subsection">
                      {t.friends.hub.streaksTab.activeAndPausedTitle}
                    </Heading>
                    <div className="flex flex-col gap-4">
                      {activeOrPausedStreaks.map((streak) => (
                        <FriendStreakCard
                          key={streak.id}
                          t={t}
                          locale={locale}
                          streak={streak}
                          isMutating={hub.isMutating}
                          onEditCategories={(selectedStreak) =>
                            setStreakModalState({
                              mode: "edit",
                              streak: selectedStreak,
                            })
                          }
                          onEnd={(selectedStreak) =>
                            setConfirmAction({
                              kind: "end_streak",
                              streak: selectedStreak,
                            })
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Tab 5: Bloqueados */}
          <section
            role="tabpanel"
            aria-labelledby="friends-tab-blocked"
            hidden={hub.activeTab !== "blocked"}
            className="flex flex-col gap-4"
          >
            <Card padding="md" className="flex flex-col gap-1 border-default">
              <Heading as="h2" variant="subsection">
                {t.friends.hub.blockedTab.title}
              </Heading>
              <Text variant="small" tone="muted">
                {t.friends.hub.blockedTab.subtitle}
              </Text>
            </Card>

            {hub.blockedUsers.length === 0 ? (
              <EmptyState
                icon="shield-off"
                title={t.friends.hub.blockedTab.emptyTitle}
                description={t.friends.hub.blockedTab.emptyDescription}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {hub.blockedUsers.map((blocked) => {
                  const name =
                    blocked.fullName?.trim() ||
                    blocked.email ||
                    t.friends.anonymousName;
                  return (
                    <Card
                      key={blocked.userId}
                      as="article"
                      padding="md"
                      className="flex items-center justify-between gap-3 border-default"
                    >
                      <div className="flex flex-col gap-1">
                        <Heading as="h3" variant="subsection">
                          {name}
                        </Heading>
                        <Text variant="caption" tone="muted" className="font-mono uppercase">
                          {formatMessage(
                            t.friends.hub.blockedTab.blockedAtLabel,
                            {
                              date: formatReadingDate(
                                blocked.blockedAt,
                                locale,
                              ),
                            },
                          )}
                        </Text>
                      </div>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={hub.isMutating}
                        onClick={() =>
                          setConfirmAction({
                            kind: "unblock_user",
                            user: blocked,
                          })
                        }
                      >
                        {t.friends.hub.blockedTab.unblockButton}
                      </Button>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmMeta.title}
        description={confirmMeta.description}
        confirmLabel={confirmMeta.confirmLabel}
        cancelLabel={t.friends.common.cancelButton}
        destructive={
          confirmAction?.kind === "remove_friend" ||
          confirmAction?.kind === "block_friend" ||
          confirmAction?.kind === "revoke_link" ||
          confirmAction?.kind === "reject_streak" ||
          confirmAction?.kind === "end_streak"
        }
        isLoading={hub.isMutating}
        onCancel={() => setConfirmAction(null)}
        onConfirm={executeConfirmAction}
      />

      <FriendStreakFormModal
        open={streakModalState !== null}
        mode={streakModalState?.mode ?? "accept"}
        partnerName={
          streakModalState?.streak.partnerName?.trim() ||
          t.friends.anonymousName
        }
        streak={streakModalState?.streak ?? null}
        availableCategories={hub.availableCategories}
        languageOptions={hub.languageOptions}
        isSubmitting={hub.isMutating}
        errorMessage={hub.actionError}
        t={t}
        locale={locale}
        onClose={() => {
          setStreakModalState(null);
          hub.setActionError(null);
        }}
        onSubmitAccept={async (streakId, input) => {
          const ok = await hub.acceptStreak(streakId, input);
          if (ok) {
            setStreakModalState(null);
          }
        }}
        onSubmitEdit={async (streakId, input) => {
          const ok = await hub.editStreakCategories(streakId, input);
          if (ok) {
            setStreakModalState(null);
          }
        }}
      />
    </Container>
  );
}

/**
 * Vista principal del módulo de amistades (`/friends`), protegida para cuentas estudiante listas.
 */
export function FriendsHubView({
  initialTab = "friends",
}: {
  initialTab?: FriendsHubTab;
}) {
  return (
    <RequireAuth>
      <FriendsHubContent initialTab={initialTab} />
    </RequireAuth>
  );
}
