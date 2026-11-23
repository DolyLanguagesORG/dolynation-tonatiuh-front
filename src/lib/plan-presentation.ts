import { formatMessage, getDictionary, type Locale } from "@/i18n";
import {
  type BillingConfigResponse,
  formatBillingAmount,
  type SubscriptionPlanItem,
  type SubscriptionTier,
} from "@/lib";

export interface FormattedPlanSummary {
  id: SubscriptionTier;
  name: string;
  tierBadge: string;
  quotaHeadline: string;
  priceLabel: string | null;
  description: string;
  features: readonly string[];
}

/**
 * Resuelve la etiqueta de precio localizada para un plan consultando dinámicamente
 * `GET /api/v1/billing/config` (sin montos hardcodeados).
 */
export function formatPlanPriceFromBillingConfig(
  tier: SubscriptionTier,
  billingConfig: BillingConfigResponse | null | undefined,
  locale: Locale,
): string | null {
  if (!billingConfig) {
    return null;
  }

  const { billing: tBilling } = getDictionary(locale);
  const planPricing = billingConfig.plans.find((item) => item.tier === tier);
  if (!planPricing) {
    return null;
  }

  if (planPricing.isFree || planPricing.amountCents === 0) {
    return tBilling.pricing.freeLabel;
  }

  const formattedAmount = formatBillingAmount(
    planPricing.amountCents,
    planPricing.currency || billingConfig.currency,
  );

  if (!formattedAmount) {
    return null;
  }

  if (planPricing.interval === "month") {
    return formatMessage(tBilling.pricing.monthlyInterval, {
      price: formattedAmount,
    });
  }

  return formattedAmount;
}

/**
 * Traduce los límites reales devueltos por `GET /subscriptions/plans` a etiquetas
 * editoriales localizadas en los 4 idiomas de interfaz soportados.
 */
export function formatPlanFromBackend(
  plan: SubscriptionPlanItem,
  locale: Locale,
  billingConfig?: BillingConfigResponse | null,
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
    priceLabel: formatPlanPriceFromBillingConfig(plan.id, billingConfig, locale),
    description: tierCopy.description,
    features: [languagesText, categoriesText, readingsText, questionsText],
  };
}
