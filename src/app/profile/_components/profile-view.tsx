"use client";

import { LearningPreferencesCard } from "@/app/profile/_components/learning-preferences-card";
import { ProfileOverviewCard } from "@/app/profile/_components/profile-overview-card";
import { StreakCalendarCard } from "@/app/profile/_components/streak-calendar-card";
import { useProfileData } from "@/app/profile/_hooks/use-profile-data";
import { RequireAuth } from "@/components/auth";
import { Alert, Container, Eyebrow, SkeletonCard } from "@/components/ui";

function ProfileContent() {
  const data = useProfileData();
  const { t, locale } = data;

  return (
    <Container size="lg" className="flex max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 id="main-heading" tabIndex={-1} className="sr-only">
          {t.nav.profileAndProgress}
        </h1>
        <Eyebrow tone="heading">{t.profile.eyebrow}</Eyebrow>
      </div>

      {data.notice && (
        <Alert
          variant="success"
          title={locale === "es" ? "Sincronización completada" : "Synced"}
          onDismiss={() => data.setNotice(null)}
        >
          {data.notice}
        </Alert>
      )}

      {data.errorMessage && (
        <Alert
          variant="error"
          title={locale === "es" ? "No se pudo guardar" : "Save error"}
          onDismiss={() => data.setErrorMessage(null)}
        >
          {data.errorMessage}
        </Alert>
      )}

      {data.isLoading ? (
        <SkeletonCard lines={5} label="Cargando perfil académico" />
      ) : (
        <>
          <ProfileOverviewCard
            t={t}
            locale={locale}
            user={data.resolvedUser}
            historySummary={data.historySummary}
            isSavingProfile={data.isSavingProfile}
            onSaveName={data.handleUpdateFullName}
          />

          <StreakCalendarCard
            t={t}
            locale={locale}
            currentStreak={data.resolvedUser?.currentStreak ?? 0}
            streakDays={data.streakDays}
          />

          <LearningPreferencesCard
            t={t}
            activeLanguages={data.activeLanguageItems}
            categories={data.resolvedCategories}
            selectedCategoryIds={data.selectedCategoryIds}
            isSaving={data.isSavingPreferences}
            onPromoteLanguage={data.handlePromoteLanguage}
            onToggleCategory={data.handleToggleCategory}
          />
        </>
      )}
    </Container>
  );
}

/**
 * Vista protegida de Perfil y Progreso (`/profile`).
 */
export function ProfileView() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
