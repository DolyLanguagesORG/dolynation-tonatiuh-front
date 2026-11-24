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

interface FriendInvitePageProps {
  params: Promise<{ token: string }>;
}

/**
 * Ruta pública `/friends/invite/[token]`: muestra vista previa del invitador y permite aceptar o rechazar.
 */
export default async function FriendInvitePage({
  params,
}: FriendInvitePageProps) {
  const { token } = await params;
  return <FriendInviteView token={token} />;
}
