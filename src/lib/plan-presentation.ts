import { type Locale } from "@/i18n";
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
 * editoriales bilingües sin inventar precios no expuestos por el backend.
 */
export function formatPlanFromBackend(
  plan: SubscriptionPlanItem,
  locale: Locale,
): FormattedPlanSummary {
  const tierBadge =
    plan.id === "dolly"
      ? locale === "es"
        ? "PLAN BÁSICO"
        : "BASIC TIER"
      : plan.id === "dolly_plus"
        ? locale === "es"
          ? "RECOMENDADO · INTERMEDIO"
          : "RECOMMENDED · PLUS"
        : locale === "es"
          ? "ACCESO TOTAL · PRO"
          : "FULL ACCESS · PRO";

  const categoriesText =
    plan.maxCategories === null
      ? locale === "es"
        ? "Categorías ilimitadas"
        : "Unlimited categories"
      : locale === "es"
        ? `Hasta ${plan.maxCategories} categorías`
        : `Up to ${plan.maxCategories} categories`;

  const languagesText =
    plan.maxLanguages >= plan.allowedLanguages.length
      ? locale === "es"
        ? `Todos los idiomas (${plan.maxLanguages} simultáneos)`
        : `All ${plan.maxLanguages} study languages simultaneously`
      : plan.maxLanguages === 1
        ? locale === "es"
          ? "1 idioma meta activo"
          : "1 active study language"
        : locale === "es"
          ? `Hasta ${plan.maxLanguages} idiomas simultáneos`
          : `Up to ${plan.maxLanguages} simultaneous languages`;

  const readingsText =
    plan.dailyReadingsLimit === null
      ? locale === "es"
        ? "Lecturas diarias ilimitadas"
        : "Unlimited daily readings"
      : locale === "es"
        ? `Hasta ${plan.dailyReadingsLimit} lecturas nuevas al día`
        : `Up to ${plan.dailyReadingsLimit} new readings/day`;

  const questionsText =
    plan.dailyQuestionsLimit === null
      ? locale === "es"
        ? "Consultas y explicaciones IA ilimitadas"
        : "Unlimited AI explanations/day"
      : locale === "es"
        ? `Hasta ${plan.dailyQuestionsLimit} explicaciones IA al día`
        : `Up to ${plan.dailyQuestionsLimit} AI explanations/day`;

  const quotaHeadline =
    plan.dailyReadingsLimit === null
      ? locale === "es"
        ? "Cuotas ilimitadas"
        : "Unlimited quotas"
      : locale === "es"
        ? `${plan.dailyReadingsLimit} lecturas / día`
        : `${plan.dailyReadingsLimit} readings / day`;

  const description =
    locale === "es"
      ? plan.description
      : `${languagesText} · ${categoriesText} · ${readingsText}.`;

  return {
    id: plan.id,
    name: plan.name,
    tierBadge,
    quotaHeadline,
    description,
    features: [languagesText, categoriesText, readingsText, questionsText],
  };
}
