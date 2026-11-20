import type { Metadata } from "next";

import { SelectPlanView } from "@/app/select-plan/_components/select-plan-view";
import { getDictionary } from "@/i18n";
import { getServerLocale } from "@/i18n/server-locale";
import { NOINDEX_ROBOTS } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  return {
    title: t.auth.stepper.step3Plan.title,
    description: t.auth.stepper.step3Plan.subtitle,
    robots: NOINDEX_ROBOTS,
  };
}

/**
 * Ruta `/select-plan` obligatoria tras confirmar el correo electrónico.
 */
export default function SelectPlanPage() {
  return <SelectPlanView />;
}
