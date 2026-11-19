import type { Metadata } from "next";

import { AdminUserDetailView } from "@/app/admin/_components/admin-user-detail-view";
import { getDictionary } from "@/i18n";
import { getServerLocale } from "@/i18n/server-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  return {
    title: t.admin.users.detail.titleFallback,
    description: t.admin.subtitle,
  };
}

/**
 * Ruta `/admin/users/[id]`: detalle administrativo de un usuario específico.
 */
export default async function AdminUserDetailPage({
  params,
}: PageProps<"/admin/users/[id]">) {
  const { id } = await params;
  const userId = Number(id);
  return <AdminUserDetailView userId={userId} />;
}
