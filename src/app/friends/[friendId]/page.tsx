import type { Metadata } from "next";

import { FriendProfileView } from "@/app/friends/[friendId]/_components/friend-profile-view";
import type { FriendProfileTab } from "@/app/friends/[friendId]/_hooks/use-friend-profile";
import { getDictionary } from "@/i18n";
import { getServerLocale } from "@/i18n/server-locale";
import { NOINDEX_ROBOTS } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  return {
    title: t.friends.seo.profileTitle,
    description: t.friends.seo.profileDescription,
    robots: NOINDEX_ROBOTS,
  };
}

interface FriendProfilePageProps {
  params: Promise<{ friendId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

const VALID_TABS = new Set<FriendProfileTab>([
  "readings",
  "categories",
  "streak",
]);

function resolveInitialTab(rawTab: string | undefined): FriendProfileTab {
  if (rawTab && VALID_TABS.has(rawTab as FriendProfileTab)) {
    return rawTab as FriendProfileTab;
  }
  return "readings";
}

/**
 * Ruta `/friends/[friendId]`: exploración privada de lecturas, copia de categorías y racha compartida.
 */
export default async function FriendProfilePage({
  params,
  searchParams,
}: FriendProfilePageProps) {
  const [{ friendId }, resolvedSearch] = await Promise.all([
    params,
    searchParams,
  ]);
  return (
    <FriendProfileView
      friendIdParam={friendId}
      initialTab={resolveInitialTab(resolvedSearch.tab)}
    />
  );
}
