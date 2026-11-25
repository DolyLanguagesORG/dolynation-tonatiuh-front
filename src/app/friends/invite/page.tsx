import type { Metadata } from "next";

import { FriendInviteView } from "@/app/friends/invite/[token]/_components/friend-invite-view";
import { getDictionary } from "@/i18n";
import { getServerLocale } from "@/i18n/server-locale";
import { NOINDEX_ROBOTS } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  return {
    title: t.friends.seo.inviteTitle,
    description: t.friends.seo.inviteDescription,
    robots: NOINDEX_ROBOTS,
  };
}

interface FriendInviteQueryPageProps {
  searchParams: Promise<{ token?: string | string[] }>;
}

/**
 * Ruta pública `/friends/invite?token=<token>` alineada con los enlaces compartibles emitidos por el backend.
 */
export default async function FriendInviteQueryPage({
  searchParams,
}: FriendInviteQueryPageProps) {
  const resolved = await searchParams;
  const rawToken = Array.isArray(resolved.token)
    ? resolved.token[0]
    : resolved.token;
  return <FriendInviteView token={rawToken ?? ""} />;
}
