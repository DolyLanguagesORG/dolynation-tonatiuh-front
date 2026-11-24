"use client";

import { LearningPreferencesCard } from "@/app/profile/_components/learning-preferences-card";
import { ProfileOverviewCard } from "@/app/profile/_components/profile-overview-card";
import { StreakCalendarCard } from "@/app/profile/_components/streak-calendar-card";
import { SubscriptionPlanCard } from "@/app/profile/_components/subscription-plan-card";
import { useProfileData } from "@/app/profile/_hooks/use-profile-data";
import { RequireAuth } from "@/components/auth";
import {
  StripeCheckoutModal,
  StripeSetupMethodModal,
} from "@/components/billing";
import { Container, Eyebrow, SkeletonCard } from "@/components/ui";
import { formatMessage } from "@/i18n";
import { formatPlanPriceFromBillingConfig } from "@/lib/plan-presentation";

function ProfileContent() {
  const data = useProfileData();
  const { t, locale } = data;

  const activeTier =
    data.currentSubscription?.tier ??
    data.billingStatus?.tier ??
    data.resolvedUser?.subscriptionTier ??
    null;

  const checkoutTier = data.checkoutSession?.tier ?? "dolly_plus";
  const isUnlockCheckout = data.checkoutKind === "language_unlock";

  return (
    <Container size="lg" className="flex max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 id="main-heading" tabIndex={-1} className="sr-only">
          {t.nav.profileAndProgress}
        </h1>
        <Eyebrow tone="heading">{t.profile.eyebrow}</Eyebrow>
      </div>

      {data.isLoading ? (
        <SkeletonCard lines={5} label={t.profile.loadingProfile} />
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
            currentStreak={data.resolvedStreakCount}
            streakDays={data.streakDays}
          />

          <LearningPreferencesCard
            t={t}
            locale={locale}
            activeTier={activeTier}
            languageUnlockPriceLabel={data.languageUnlockPriceLabel}
            activeLanguages={data.activeLanguageItems}
            languagesSettings={data.languagesSettings}
            categories={data.resolvedCategories}
            selectedCategoryIds={data.selectedCategoryIds}
            isSaving={data.isSavingPreferences}
            isUnlockingLanguage={data.isUnlockingLanguage}
            accessRequestsEnabled={data.accessRequestsEnabled}
            pendingLanguageUnlockRequest={data.pendingLanguageUnlockRequest}
            latestRejectedLanguageUnlockRequest={
              data.latestRejectedLanguageUnlockRequest
            }
            isCancellingRequest={data.isCancellingRequest}
            onPromoteLanguage={data.handlePromoteLanguage}
            onUpdateLanguages={data.handleUpdateLanguages}
            onUnlockLanguageChange={data.handleUnlockLanguageChange}
            onCancelAccessRequest={data.handleCancelAccessRequest}
            onRefreshAccessRequests={data.handleRefreshAccessRequests}
            onToggleCategory={data.handleToggleCategory}
            onAddCustomCategory={data.handleAddCustomCategory}
            onDeleteCategory={data.handleDeleteCategory}
          />

          <SubscriptionPlanCard
            t={t}
            locale={locale}
            currentSubscription={data.currentSubscription}
            billingConfig={data.billingConfig}
            billingStatus={data.billingStatus}
            invoices={data.invoices}
            plans={data.plans}
            isLoadingPlans={data.isLoadingPlans}
            plansError={data.plansError}
            isSavingPlan={data.isSavingPlan}
            isManagingBilling={data.isManagingBilling}
            isLoggingOutAll={data.isLoggingOutAll}
            accessRequestsEnabled={data.accessRequestsEnabled}
            pendingSubscriptionRequest={data.pendingSubscriptionRequest}
            latestRejectedSubscriptionRequest={
              data.latestRejectedSubscriptionRequest
            }
            isCancellingRequest={data.isCancellingRequest}
            onSelectPlan={data.handleSelectPlan}
            onChangePaidPlan={data.handleChangePaidPlan}
            onCancelSubscription={data.handleCancelSubscription}
            onResumeSubscription={data.handleResumeSubscription}
            onOpenUpdateCard={data.handleOpenUpdateCard}
            onOpenBillingPortal={data.handleOpenBillingPortal}
            onCancelAccessRequest={data.handleCancelAccessRequest}
            onLogoutAll={data.handleLogoutAll}
            captchaContainerRef={data.captchaContainerRef}
          />

          <StripeCheckoutModal
            session={data.checkoutSession}
            productTitle={
              isUnlockCheckout
                ? t.billing.checkout.languageUnlockTitle
                : formatMessage(t.billing.checkout.subscriptionTitle, {
                    plan: t.plans.tiers[checkoutTier]?.name ?? checkoutTier,
                  })
            }
            productDescription={
              isUnlockCheckout
                ? t.billing.checkout.languageUnlockDescription
                : t.plans.tiers[checkoutTier]?.description
            }
            amountLabel={
              isUnlockCheckout
                ? data.languageUnlockPriceLabel
                : formatPlanPriceFromBillingConfig(
                    checkoutTier,
                    data.billingConfig,
                    locale,
                  )
            }
            isRecurring={!isUnlockCheckout}
            t={t}
            onClose={() => data.setCheckoutSession(null)}
            onSuccess={(sessionId) => {
              void data.handleCheckoutCompleted(sessionId);
            }}
          />

          <StripeSetupMethodModal
            setupSession={data.setupIntentSession}
            t={t}
            locale={locale}
            onClose={() => data.setSetupIntentSession(null)}
            onSuccess={(summary) => {
              void data.handlePaymentMethodSaved(summary);
            }}
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
