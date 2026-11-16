import type { Metadata } from "next";

import { ProfileView } from "@/app/profile/_components/profile-view";
import { getDictionary } from "@/i18n";
import { getServerLocale } from "@/i18n/server-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  return {
    title: t.nav.profileAndProgress,
    description: t.profile.streakSubtitle,
  };
}

/**
 * Ruta `/profile` alineada con el wireframe `04-perfil-y-progreso.png`.
 */
export default function ProfilePage() {
  return <ProfileView />;
}
