"use client";

import { useState } from "react";

import {
  Badge,
  Button,
  Card,
  Divider,
  Heading,
  Icon,
  Input,
  StatCard,
  Text,
} from "@/components/ui";
import { formatMessage, type Dictionary, type Locale } from "@/i18n";
import { type AuthUser, getDateLocale, type HistorySummary } from "@/lib";

export interface ProfileOverviewCardProps {
  t: Dictionary;
  locale: Locale;
  user: AuthUser | null;
  historySummary: HistorySummary | null;
  isSavingProfile: boolean;
  onSaveName: (fullName: string) => Promise<boolean>;
}

function getInitials(nameOrEmail: string): string {
  const clean = nameOrEmail.trim();
  if (!clean) return "DL";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

/**
 * Tarjeta superior del perfil estudiantil con edición de nombre y 4 KPIs (`04-perfil-y-progreso.png`).
 */
export function ProfileOverviewCard({
  t,
  locale,
  user,
  historySummary,
  isSavingProfile,
  onSaveName,
}: ProfileOverviewCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(user?.fullName ?? "");
  const [nameError, setNameError] = useState<string | null>(null);

  const displayName =
    user?.fullName?.trim() || user?.email || t.profile.defaultRole;
  const initials = getInitials(displayName);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(getDateLocale(locale), {
        month: "long",
        year: "numeric",
      })
    : "—";

  const planLabel =
    user?.subscriptionTier === "dolly_pro"
      ? "DOLLY PRO"
      : user?.subscriptionTier === "dolly_plus"
        ? "DOLLY PLUS"
        : user?.subscriptionTier === "dolly"
          ? "DOLLY BASE"
          : t.profile.subscription.noActivePlanBadge;

  const totalReadings = historySummary?.readings.total ?? 0;
  const completedReadings = historySummary?.readings.completed ?? 0;
  const passedReadings = historySummary?.readings.passed ?? 0;
  const passedUnit =
    completedReadings > 0
      ? formatMessage(t.profile.evalUnit, { count: completedReadings })
      : t.profile.stats.passedReadingsUnit;
  const activeVocab = historySummary?.wordsLookedUp ?? 0;
  const accuracy =
    historySummary?.readings.averageScore != null
      ? `${historySummary.readings.averageScore.toFixed(1)}%`
      : "—";

  const startEdit = (): void => {
    setDraftName(user?.fullName ?? "");
    setNameError(null);
    setIsEditing(true);
  };

  const submitName = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    const cleaned = draftName.trim();
    if (!cleaned) {
      setNameError(t.profile.fullNameRequiredError);
      return;
    }
    if (cleaned.length > 255) {
      setNameError(t.profile.fullNameMaxLengthError);
      return;
    }
    setNameError(null);
    const ok = await onSaveName(cleaned);
    if (ok) {
      setIsEditing(false);
    }
  };

  return (
    <Card padding="lg" as="section" className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 items-start gap-4">
          <div
            aria-hidden="true"
            className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-base border border-brand bg-neutral-secondary-medium font-serif text-2xl font-bold text-heading"
          >
            {initials}
            <span className="absolute right-1.5 bottom-1.5 h-3 w-3 rounded-full border-2 border-neutral-primary-soft bg-brand" />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Heading as="h2" variant="title">
                {displayName}
              </Heading>
              <Icon name="badge-check" size="lg" className="text-heading" />
            </div>

            <Text variant="small" tone="muted" className="break-all">
              {user?.email ?? "—"}
            </Text>

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <Badge variant="secondary">
                {t.profile.verifiedLevelPrefix} {planLabel}
              </Badge>
              <Text variant="caption" tone="subtle" className="font-mono uppercase">
                {t.profile.memberSincePrefix} {memberSince}
              </Text>
            </div>
          </div>
        </div>

        {!isEditing && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Icon name="pencil" size="xs" />}
            onClick={startEdit}
            className="shrink-0"
          >
            {t.profile.editProfileButton}
          </Button>
        )}
      </div>

      {isEditing && (
        <form
          onSubmit={submitName}
          className="flex flex-col gap-3 rounded-base border border-default-medium bg-neutral-secondary-soft p-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <Input
              id="profile-fullname-input"
              label={t.profile.fullNameLabel}
              maxLength={255}
              value={draftName}
              error={nameError ?? undefined}
              disabled={isSavingProfile}
              required
              onChange={(event) => {
                setDraftName(event.target.value);
                setNameError(null);
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSavingProfile}
            >
              {t.profile.saveProfileButton}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={isSavingProfile}
              onClick={() => {
                setNameError(null);
                setIsEditing(false);
              }}
            >
              {t.profile.cancelEditButton}
            </Button>
          </div>
        </form>
      )}

      <Divider />

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <StatCard
          variant="inline"
          label={t.profile.stats.totalReadings}
          value={totalReadings}
          unit={t.profile.stats.totalReadingsUnit}
        />
        <StatCard
          variant="inline"
          label={t.profile.stats.passedReadings}
          value={passedReadings}
          unit={passedUnit}
        />
        <StatCard
          variant="inline"
          label={t.profile.stats.activeVocabulary}
          value={activeVocab}
          unit={t.profile.stats.activeVocabularyUnit}
        />
        <StatCard
          variant="inline"
          label={t.profile.stats.globalAccuracy}
          value={accuracy}
          unit={t.profile.stats.globalAccuracyUnit}
        />
      </div>
    </Card>
  );
}
