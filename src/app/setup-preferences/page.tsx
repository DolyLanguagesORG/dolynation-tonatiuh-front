import type { Metadata } from "next";

import { SetupPreferencesView } from "@/app/setup-preferences/_components/setup-preferences-view";
import { getDictionary } from "@/i18n";
import { getServerLocale } from "@/i18n/server-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  return {
    title: t.auth.stepper.step4Preferences.title,
    description: t.auth.stepper.step4Preferences.subtitle,
  };
}

/**
 * Ruta `/setup-preferences` posterior a la selección de plan.
 */
export default function SetupPreferencesPage() {
  return <SetupPreferencesView />;
}
