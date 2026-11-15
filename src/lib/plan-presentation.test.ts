import { describe, expect, it } from "@jest/globals";

import { formatPlanFromBackend } from "@/lib/plan-presentation";
import { type SubscriptionPlanItem } from "@/lib/api-contracts";

const PLANS: SubscriptionPlanItem[] = [
  {
    id: "dolly",
    name: "Dolly",
    description: "Plan básico de 1 idioma.",
    maxCategories: 10,
    maxLanguages: 1,
    allowedLanguages: ["es", "en", "fr", "it"],
    dailyReadingsLimit: 10,
    dailyQuestionsLimit: 30,
  },
  {
    id: "dolly_plus",
    name: "Dolly Plus",
    description: "Plan intermedio bilingüe.",
    maxCategories: 25,
    maxLanguages: 2,
    allowedLanguages: ["es", "en", "fr", "it"],
    dailyReadingsLimit: 20,
    dailyQuestionsLimit: 80,
  },
  {
    id: "dolly_pro",
    name: "Dolly Pro",
    description: "Acceso total multi-idioma.",
    maxCategories: null,
    maxLanguages: 4,
    allowedLanguages: ["es", "en", "fr", "it"],
    dailyReadingsLimit: null,
    dailyQuestionsLimit: null,
  },
];

describe("formatPlanFromBackend", () => {
  it("formats dolly, dolly_plus, and dolly_pro limits in Spanish and English", () => {
    const basicEs = formatPlanFromBackend(PLANS[0], "es");
    expect(basicEs.tierBadge).toBe("PLAN BÁSICO");
    expect(basicEs.quotaHeadline).toBe("10 lecturas / día");
    expect(basicEs.features).toContain("1 idioma meta activo");
    expect(basicEs.features).toContain("Hasta 10 lecturas nuevas al día");

    const plusEn = formatPlanFromBackend(PLANS[1], "en");
    expect(plusEn.tierBadge).toBe("RECOMMENDED · PLUS");
    expect(plusEn.quotaHeadline).toBe("20 readings / day");
    expect(plusEn.features).toContain("Up to 2 simultaneous languages");

    const proEs = formatPlanFromBackend(PLANS[2], "es");
    expect(proEs.tierBadge).toBe("ACCESO TOTAL · PRO");
    expect(proEs.quotaHeadline).toBe("Cuotas ilimitadas");
    expect(proEs.features).toContain("Todos los idiomas (4 simultáneos)");
    expect(proEs.features).toContain("Lecturas diarias ilimitadas");
  });
});
