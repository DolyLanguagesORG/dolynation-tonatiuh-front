import type { Metadata } from "next";

import { FriendsHubView } from "@/app/friends/_components/friends-hub-view";
import type { FriendsHubTab } from "@/app/friends/_hooks/use-friends-hub";
import { getDictionary } from "@/i18n";
import { getServerLocale } from "@/i18n/server-locale";
import { NOINDEX_ROBOTS } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  return {
    title: t.friends.seo.hubTitle,
    description: t.friends.seo.hubDescription,
    robots: NOINDEX_ROBOTS,
  };
}

interface FriendsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

const VALID_TABS = new Set<FriendsHubTab>([
  "friends",
  "add",
  "requests",
  "streaks",
  "blocked",
]);

function resolveInitialTab(rawTab: string | undefined): FriendsHubTab {
  if (rawTab && VALID_TABS.has(rawTab as FriendsHubTab)) {
    return rawTab as FriendsHubTab;
  }
  return "friends";
}

/**
 * Ruta `/friends`: centro de gestión de amistades, invitaciones, solicitudes, rachas y bloqueos.
 */
export default async function FriendsPage({ searchParams }: FriendsPageProps) {
  const resolved = await searchParams;
  return <FriendsHubView initialTab={resolveInitialTab(resolved.tab)} />;
}
