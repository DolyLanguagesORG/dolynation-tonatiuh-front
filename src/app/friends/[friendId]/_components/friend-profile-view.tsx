"use client";

import {
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import {
  type FriendProfileTab,
  useFriendProfile,
} from "@/app/friends/[friendId]/_hooks/use-friend-profile";
import { RequireAuth } from "@/components/auth";
import {
  ConfirmDialog,
  FriendStreakCard,
  type FriendStreakFormMode,
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
  Eyebrow,
  Heading,
  Icon,
  PageHeader,
  Pagination,
  SkeletonCard,
  Text,
} from "@/components/ui";
import { formatMessage } from "@/i18n";
import {
  formatReadingDate,
  formatReadingLanguageBadge,
  type FriendReadingDetailDto,
  getDifficultyMeta,
} from "@/lib";

const PROFILE_TABS: readonly FriendProfileTab[] = [
  "readings",
  "categories",
  "streak",
];

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

function FriendReadingPreviewDialog({
  reading,
  isStarting,
  onClose,
  onStartPrivate,
  t,
  locale,
}: {
  reading: FriendReadingDetailDto | null;
  isStarting: boolean;
  onClose: () => void;
  onStartPrivate: (readingId: number) => void;
  t: ReturnType<typeof useFriendProfile>["t"];
  locale: ReturnType<typeof useFriendProfile>["locale"];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const startedOutsideRef = useRef(false);
  const titleId = useId();
  const open = reading !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    dialog.setAttribute("closedby", isStarting ? "none" : "any");

    if (open) {
      if (typeof dialog.showModal === "function") {
        if (!dialog.open) {
          dialog.showModal();
        }
      } else {
        dialog.setAttribute("open", "");
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
  }, [isStarting, open]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog || isStarting) {
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
    if (!dialog || isStarting) {
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
      onClose();
      return;
    }
    startedOutsideRef.current = false;
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!isStarting) {
          onClose();
        }
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="m-auto max-h-[85vh] w-[min(100%-2rem,46rem)] overflow-y-auto rounded-base border border-default bg-neutral-primary-soft p-0 text-heading shadow-xl"
    >
      {reading && (
        <div lang={reading.language} className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-2">
            <Eyebrow tone="muted">{t.friends.profile.readingsTab.previewEyebrow}</Eyebrow>
            <Heading id={titleId} as="h2" variant="section">
              {reading.title}
            </Heading>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary">
                {formatReadingLanguageBadge(reading.language, locale)}
              </Badge>
              {reading.difficulty && (
                <Badge
                  variant={
                    getDifficultyMeta(reading.difficulty, locale).badgeVariant
                  }
                >
                  {getDifficultyMeta(reading.difficulty, locale).label}
                </Badge>
              )}
              {reading.category && (
                <Badge variant="outline">{reading.category}</Badge>
              )}
              {reading.wordCount !== null && (
                <Badge variant="outline">
                  {formatMessage(t.friends.profile.readingsTab.wordsMeta, {
                    count: reading.wordCount,
                  })}
                </Badge>
              )}
              <Text variant="caption" tone="muted" className="font-mono uppercase">
                {formatMessage(t.friends.profile.readingsTab.createdMeta, {
                  date: formatReadingDate(reading.createdAt, locale),
                })}
              </Text>
            </div>
          </div>

          <Alert variant="info">
            {t.friends.profile.readingsTab.privacyNote}
          </Alert>

          <div className="flex flex-col gap-3 border-y border-default py-4 font-serif text-base leading-relaxed text-heading">
            {reading.content
              .split(/\n{2,}/)
              .map((paragraph) => paragraph.trim())
              .filter(Boolean)
              .map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isStarting}
              onClick={onClose}
            >
              {t.friends.common.closeButton}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isStarting}
              leftIcon={<Icon name="book-open" size="xs" />}
              onClick={() => onStartPrivate(reading.id)}
            >
              {t.friends.profile.readingsTab.startPrivateButton}
            </Button>
          </div>
        </div>
      )}
    </dialog>
  );
}

function FriendProfileContent({
  friendIdParam,
  initialTab = "readings",
}: {
  friendIdParam: string;
  initialTab?: FriendProfileTab;
}) {
  const profile = useFriendProfile(friendIdParam, initialTab);
  const { t, locale } = profile;
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [confirmKind, setConfirmKind] = useState<
    "remove" | "block" | "reject_streak" | "end_streak" | null
  >(null);
  const [streakModalMode, setStreakModalMode] =
    useState<FriendStreakFormMode | null>(null);

  if (profile.isInvalidId) {
    return (
      <Container size="lg" className="py-10">
        <EmptyState
          icon="user-x"
          title={t.friends.profile.invalidIdTitle}
          description={t.friends.profile.invalidIdDesc}
          actions={
            <ActionLink href="/friends" variant="primary" size="sm">
              {t.friends.common.backToFriends}
            </ActionLink>
          }
        />
      </Container>
    );
  }

  const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = PROFILE_TABS.indexOf(profile.activeTab);
    if (currentIndex < 0) {
      return;
    }

    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % PROFILE_TABS.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + PROFILE_TABS.length) % PROFILE_TABS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = PROFILE_TABS.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextTab = PROFILE_TABS[nextIndex];
    profile.setActiveTab(nextTab);
    tabRefs.current[nextIndex]?.focus();
  };

  const confirmDialogMeta = (() => {
    switch (confirmKind) {
      case "remove":
        return {
          title: t.friends.hub.friendsTab.confirmRemoveTitle,
          description: formatMessage(
            t.friends.hub.friendsTab.confirmRemoveBody,
            { name: profile.friendName },
          ),
          confirmLabel: t.friends.hub.friendsTab.confirmRemoveButton,
        };
      case "block":
        return {
          title: t.friends.hub.friendsTab.confirmBlockTitle,
          description: formatMessage(
            t.friends.hub.friendsTab.confirmBlockBody,
            { name: profile.friendName },
          ),
          confirmLabel: t.friends.hub.friendsTab.confirmBlockButton,
        };
      case "reject_streak":
        return {
          title: t.friends.hub.streaksTab.confirmRejectTitle,
          description: formatMessage(
            t.friends.hub.streaksTab.confirmRejectBody,
            { name: profile.friendName },
          ),
          confirmLabel: t.friends.hub.streaksTab.confirmRejectButton,
        };
      case "end_streak":
        return {
          title: t.friends.hub.streaksTab.confirmEndTitle,
          description: formatMessage(t.friends.hub.streaksTab.confirmEndBody, {
            name: profile.friendName,
          }),
          confirmLabel: t.friends.hub.streaksTab.confirmEndButton,
        };
      default:
        return {
          title: "",
          description: "",
          confirmLabel: t.friends.common.confirmButton,
        };
    }
  })();

  const executeConfirm = async () => {
    const current = confirmKind;
    setConfirmKind(null);
    if (current === "remove") {
      await profile.removeFriend();
    } else if (current === "block") {
      await profile.blockFriend();
    } else if (current === "reject_streak" && profile.streak) {
      await profile.rejectStreak(profile.streak.id);
    } else if (current === "end_streak" && profile.streak) {
      await profile.endStreak(profile.streak.id);
    }
  };

  return (
    <Container size="xl" className="flex flex-col gap-6 py-8">
      <PageHeader
        backHref="/friends"
        backLabel={t.friends.common.backToFriends}
        eyebrow={t.friends.profile.eyebrow}
        title={profile.friendName}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="xs"
              disabled={profile.isMutating || profile.isLoading}
              leftIcon={<Icon name="user-x" size="xs" />}
              onClick={() => setConfirmKind("remove")}
            >
              {t.friends.hub.friendsTab.removeButton}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={profile.isMutating || profile.isLoading}
              leftIcon={<Icon name="ban" size="xs" />}
              onClick={() => setConfirmKind("block")}
            >
              {t.friends.hub.friendsTab.blockButton}
            </Button>
          </div>
        }
      />

      <Alert variant="info" title={t.friends.profile.privacyBannerTitle}>
        {t.friends.profile.privacyBannerBody}
      </Alert>

      {profile.isLoading ? (
        <SkeletonCard lines={5} label={t.friends.common.loadingLabel} />
      ) : profile.loadError ? (
        <Alert variant="error" title={t.friends.profile.invalidIdTitle}>
          <div className="flex flex-col items-start gap-3">
            <span>{profile.loadError}</span>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  void profile.reloadAll();
                }}
              >
                {t.friends.common.retryButton}
              </Button>
              <ActionLink href="/friends" variant="primary" size="sm">
                {t.friends.common.backToFriends}
              </ActionLink>
            </div>
          </div>
        </Alert>
      ) : (
        <>
          <div
            role="tablist"
            aria-label={t.friends.profile.tabsAriaLabel}
            onKeyDown={handleTabKeyDown}
            className="flex flex-nowrap gap-1 overflow-x-auto border-b border-default"
          >
            {PROFILE_TABS.map((tabId, index) => {
              const isSelected = profile.activeTab === tabId;
              const badgeValue =
                tabId === "readings"
                  ? profile.readingsTotal
                  : tabId === "categories"
                    ? profile.friendCategories.length
                    : null;

              return (
                <button
                  key={tabId}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  id={`friend-profile-tab-${tabId}`}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => {
                    profile.setActiveTab(tabId);
                    profile.setActionError(null);
                  }}
                  className={[
                    "inline-flex min-h-10 flex-none items-center gap-2 border-b-2 px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring",
                    isSelected
                      ? "border-ink text-heading"
                      : "border-transparent text-muted hover:border-default-medium hover:text-heading",
                  ].join(" ")}
                >
                  <span>{t.friends.profile.tabs[tabId]}</span>
                  {badgeValue !== null && badgeValue > 0 && (
                    <Badge variant={isSelected ? "primary" : "outline"}>
                      {badgeValue}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          {profile.actionError && (
            <Alert
              variant="error"
              title={t.friends.common.errorTitle}
              onDismiss={() => profile.setActionError(null)}
              dismissLabel={t.friends.common.closeButton}
            >
              {profile.actionError}
            </Alert>
          )}

          {/* Tab 1: Lecturas (privado) */}
          <section
            role="tabpanel"
            aria-labelledby="friend-profile-tab-readings"
            hidden={profile.activeTab !== "readings"}
            className="flex flex-col gap-4"
          >
            {profile.readings.length === 0 ? (
              <EmptyState
                icon="book-open"
                title={t.friends.profile.readingsTab.emptyTitle}
                description={t.friends.profile.readingsTab.emptyDescription}
              />
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  {profile.readings.map((reading) => {
                    const diffMeta = reading.difficulty
                      ? getDifficultyMeta(reading.difficulty, locale)
                      : null;
                    const isStarting = profile.startingReadingId === reading.id;

                    return (
                      <Card
                        key={reading.id}
                        as="article"
                        lang={reading.language}
                        padding="md"
                        className="flex flex-col justify-between gap-4 border-default"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant="secondary">
                              {formatReadingLanguageBadge(
                                reading.language,
                                locale,
                              )}
                            </Badge>
                            {diffMeta && (
                              <Badge variant={diffMeta.badgeVariant}>
                                {diffMeta.label}
                              </Badge>
                            )}
                            {reading.category && (
                              <Badge variant="outline">
                                {reading.category}
                              </Badge>
                            )}
                          </div>

                          <Heading as="h3" variant="subsection">
                            {reading.title}
                          </Heading>

                          {reading.description && (
                            <Text variant="small" tone="body">
                              {reading.description}
                            </Text>
                          )}

                          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted uppercase">
                            {reading.wordCount !== null && (
                              <span>
                                {formatMessage(
                                  t.friends.profile.readingsTab.wordsMeta,
                                  { count: reading.wordCount },
                                )}
                              </span>
                            )}
                            <span>
                              {formatMessage(
                                t.friends.profile.readingsTab.createdMeta,
                                {
                                  date: formatReadingDate(
                                    reading.createdAt,
                                    locale,
                                  ),
                                },
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-default pt-3">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={
                              profile.isLoadingPreview || isStarting
                            }
                            onClick={() => {
                              void profile.openReadingPreview(reading.id);
                            }}
                          >
                            {t.friends.profile.readingsTab.previewButton}
                          </Button>
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            isLoading={isStarting}
                            leftIcon={<Icon name="book-open" size="xs" />}
                            onClick={() => {
                              void profile.startPrivateReading(reading.id);
                            }}
                          >
                            {isStarting
                              ? t.friends.profile.readingsTab.startingButton
                              : t.friends.profile.readingsTab
                                  .startPrivateButton}
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {profile.readingsTotalPages > 1 && (
                  <Pagination
                    currentPage={profile.readingsPage}
                    totalPages={profile.readingsTotalPages}
                    totalItems={profile.readingsTotal}
                    visibleItemsCount={profile.readings.length}
                    previousLabel={t.friends.common.pagePrev}
                    nextLabel={t.friends.common.pageNext}
                    summaryText={formatMessage(
                      t.friends.common.paginationSummary,
                      {
                        visible: profile.readings.length,
                        total: profile.readingsTotal,
                      },
                    )}
                    onPageChange={(page) => {
                      void profile.changeReadingsPage(page);
                    }}
                  />
                )}
              </>
            )}
          </section>

          {/* Tab 2: Categorías */}
          <section
            role="tabpanel"
            aria-labelledby="friend-profile-tab-categories"
            hidden={profile.activeTab !== "categories"}
            className="flex flex-col gap-4"
          >
            <Card padding="md" className="flex flex-col gap-4 border-default">
              <div className="flex flex-col gap-1">
                <Heading as="h2" variant="subsection">
                  {formatMessage(t.friends.profile.categoriesTab.title, {
                    name: profile.friendName,
                  })}
                </Heading>
                <Text variant="small" tone="muted">
                  {t.friends.profile.categoriesTab.subtitle}
                </Text>
              </div>

              {profile.friendCategories.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-base border border-default bg-neutral-secondary-soft/40 p-3">
                  <Text variant="caption" tone="muted" className="font-mono">
                    {formatMessage(
                      t.friends.profile.categoriesTab.selectedSummary,
                      {
                        count: profile.selectedCategoriesToCopy.length,
                        total: profile.friendCategories.length,
                      },
                    )}
                  </Text>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="xs"
                      disabled={profile.isMutating}
                      onClick={profile.selectAllCategories}
                    >
                      {t.friends.profile.categoriesTab.selectAllButton}
                    </Button>
                    {profile.selectedCategoriesToCopy.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        disabled={profile.isMutating}
                        onClick={profile.clearCategorySelection}
                      >
                        {t.friends.profile.categoriesTab.clearSelectionButton}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      isLoading={profile.isMutating}
                      disabled={profile.selectedCategoriesToCopy.length === 0}
                      onClick={() => {
                        void profile.copyCategories(
                          profile.selectedCategoriesToCopy,
                        );
                      }}
                    >
                      {formatMessage(
                        t.friends.profile.categoriesTab.copySelectedButton,
                        { count: profile.selectedCategoriesToCopy.length },
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {profile.copyResult && (
                <Alert
                  variant="success"
                  title={t.friends.profile.categoriesTab.copyResultTitle}
                >
                  <div className="flex flex-col gap-1 text-xs">
                    {profile.copyResult.activated.length > 0 && (
                      <span>
                        {formatMessage(
                          t.friends.profile.categoriesTab.activatedLabel,
                          {
                            items: profile.copyResult.activated.join(", "),
                          },
                        )}
                      </span>
                    )}
                    {profile.copyResult.savedOnly.length > 0 && (
                      <span>
                        {formatMessage(
                          t.friends.profile.categoriesTab.savedOnlyLabel,
                          {
                            items: profile.copyResult.savedOnly.join(", "),
                          },
                        )}
                      </span>
                    )}
                  </div>
                </Alert>
              )}

              {profile.friendCategories.length === 0 ? (
                <EmptyState
                  icon="layers"
                  title={t.friends.profile.categoriesTab.emptyTitle}
                  description={t.friends.profile.categoriesTab.emptyDescription}
                />
              ) : (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {profile.friendCategories.map((category) => {
                    const isSelected =
                      profile.selectedCategoriesToCopy.includes(category);
                    return (
                      <div
                        key={category}
                        className={[
                          "flex min-w-0 items-stretch overflow-hidden rounded-base border transition-colors",
                          isSelected
                            ? "border-brand bg-neutral-secondary-soft"
                            : "border-default bg-surface hover:border-default-medium",
                        ].join(" ")}
                      >
                        <button
                          type="button"
                          aria-pressed={isSelected}
                          disabled={profile.isMutating}
                          onClick={() =>
                            profile.toggleCategorySelection(category)
                          }
                          className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-heading transition-colors hover:bg-neutral-secondary-soft/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          <span
                            aria-hidden="true"
                            className={[
                              "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-xs border transition-colors",
                              isSelected
                                ? "border-brand bg-brand text-white"
                                : "border-strong bg-surface text-transparent",
                            ].join(" ")}
                          >
                            <Icon name="check" size="xs" />
                          </span>
                          <span className="truncate">{category}</span>
                        </button>

                        <button
                          type="button"
                          disabled={profile.isMutating}
                          aria-label={formatMessage(
                            t.friends.profile.categoriesTab.copySingleAria,
                            { name: category },
                          )}
                          title={
                            t.friends.profile.categoriesTab.copySingleButton
                          }
                          onClick={() => {
                            void profile.copyCategories([category]);
                          }}
                          className="inline-flex shrink-0 items-center gap-1.5 border-l border-default px-3 py-2.5 text-xs font-semibold text-heading transition-colors hover:bg-neutral-secondary-soft focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          <Icon name="copy" size="xs" />
                          <span>
                            {t.friends.profile.categoriesTab.copySingleButton}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </section>

          {/* Tab 3: Racha diaria */}
          <section
            role="tabpanel"
            aria-labelledby="friend-profile-tab-streak"
            hidden={profile.activeTab !== "streak"}
            className="flex flex-col gap-4"
          >
            {profile.streak ? (
              <FriendStreakCard
                t={t}
                locale={locale}
                streak={profile.streak}
                currentUserId={profile.currentUserId}
                isMutating={profile.isMutating}
                onAccept={() => setStreakModalMode("accept")}
                onReject={() => setConfirmKind("reject_streak")}
                onEditCategories={() => setStreakModalMode("edit")}
                onEnd={() => setConfirmKind("end_streak")}
              />
            ) : (
              <EmptyState
                icon="flame"
                title={t.friends.profile.streakTab.emptyTitle}
                description={formatMessage(
                  t.friends.profile.streakTab.emptyDescription,
                  { name: profile.friendName },
                )}
                actions={
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    leftIcon={<Icon name="flame" size="xs" />}
                    onClick={() => setStreakModalMode("propose")}
                  >
                    {t.friends.profile.streakTab.proposeButton}
                  </Button>
                }
              />
            )}
          </section>
        </>
      )}

      <FriendReadingPreviewDialog
        reading={profile.previewReading}
        isStarting={profile.startingReadingId !== null}
        onClose={profile.closeReadingPreview}
        onStartPrivate={(readingId) => {
          void profile.startPrivateReading(readingId);
        }}
        t={t}
        locale={locale}
      />

      <ConfirmDialog
        open={confirmKind !== null}
        title={confirmDialogMeta.title}
        description={confirmDialogMeta.description}
        confirmLabel={confirmDialogMeta.confirmLabel}
        cancelLabel={t.friends.common.cancelButton}
        destructive
        isLoading={profile.isMutating}
        onCancel={() => setConfirmKind(null)}
        onConfirm={executeConfirm}
      />

      <FriendStreakFormModal
        open={streakModalMode !== null}
        mode={streakModalMode ?? "propose"}
        partnerName={profile.friendName}
        streak={profile.streak}
        availableCategories={profile.availableCategories}
        friendAvailableCategories={profile.friendAvailableCategories}
        languageOptions={profile.languageOptions}
        isSubmitting={profile.isMutating}
        errorMessage={profile.actionError}
        t={t}
        locale={locale}
        onClose={() => {
          setStreakModalMode(null);
          profile.setActionError(null);
        }}
        onSubmitPropose={async (input) => {
          const ok = await profile.proposeStreak(input);
          if (ok) {
            setStreakModalMode(null);
          }
        }}
        onSubmitAccept={async (streakId, updatedCategories) => {
          const ok = await profile.acceptStreak(streakId, updatedCategories);
          if (ok) {
            setStreakModalMode(null);
          }
        }}
        onSubmitEdit={async (streakId, input) => {
          const ok = await profile.editStreakCategories(streakId, input);
          if (ok) {
            setStreakModalMode(null);
          }
        }}
      />
    </Container>
  );
}

/**
 * Vista protegida para explorar a un amigo (`/friends/[friendId]`) manteniendo privacidad total.
 */
export function FriendProfileView({
  friendIdParam,
  initialTab = "readings",
}: {
  friendIdParam: string;
  initialTab?: FriendProfileTab;
}) {
  return (
    <RequireAuth>
      <FriendProfileContent
        friendIdParam={friendIdParam}
        initialTab={initialTab}
      />
    </RequireAuth>
  );
}
