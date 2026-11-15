import { formatMessage, getDictionary, type Locale } from "@/i18n";
import { type SubscriptionPlanItem, type SubscriptionTier } from "@/lib";

export interface FormattedPlanSummary {
  id: SubscriptionTier;
  name: string;
  tierBadge: string;
  quotaHeadline: string;
  description: string;
  features: readonly string[];
}

/**
 * Traduce los límites reales devueltos por `GET /subscriptions/plans` a etiquetas
 * editoriales localizadas en los 4 idiomas de interfaz soportados.
 */
export function formatPlanFromBackend(
  plan: SubscriptionPlanItem,
  locale: Locale,
): FormattedPlanSummary {
  const { plans: tPlans } = getDictionary(locale);
  const tierCopy = tPlans.tiers[plan.id];

  const categoriesText =
    plan.maxCategories === null
      ? tPlans.categoriesUnlimited
      : formatMessage(tPlans.categoriesUpTo, { limit: plan.maxCategories });

  const languagesText =
    plan.maxLanguages >= plan.allowedLanguages.length
      ? formatMessage(tPlans.languageAllAvailable, { count: plan.maxLanguages })
      : plan.maxLanguages === 1
        ? tPlans.languageSingular
        : formatMessage(tPlans.languagePlural, { count: plan.maxLanguages });

  const readingsText =
    plan.dailyReadingsLimit === null
      ? tPlans.quotaReadingsUnlimited
      : formatMessage(tPlans.quotaReadingsDaily, {
          limit: plan.dailyReadingsLimit,
        });

  const questionsText =
    plan.dailyQuestionsLimit === null
      ? tPlans.quotaQuestionsUnlimited
      : formatMessage(tPlans.quotaQuestionsDaily, {
          limit: plan.dailyQuestionsLimit,
        });

  const quotaHeadline =
    plan.dailyReadingsLimit === null
      ? tPlans.quotaHeadlineUnlimited
      : formatMessage(tPlans.quotaHeadlineLimited, {
          readings: plan.dailyReadingsLimit,
        });

  return {
    id: plan.id,
    name: tierCopy.name,
    tierBadge: tierCopy.badge,
    quotaHeadline,
    description: tierCopy.description,
    features: [languagesText, categoriesText, readingsText, questionsText],
  };
}
