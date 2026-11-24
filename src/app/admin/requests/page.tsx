import type { Metadata } from "next";

import { AdminRequestsView } from "@/app/admin/_components/admin-requests-view";
import { getDictionary } from "@/i18n";
import { getServerLocale } from "@/i18n/server-locale";
import { NOINDEX_ROBOTS } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  return {
    title: t.admin.requests.title,
    description: t.admin.requests.subtitle,
    robots: NOINDEX_ROBOTS,
  };
}

/**
 * Ruta `/admin/requests`: vista dedicada de solicitudes abierta desde Usuarios.
 */
export default function AdminRequestsPage() {
  return <AdminRequestsView />;
}
