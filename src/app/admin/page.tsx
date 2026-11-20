import type { Metadata } from "next";

import { AdminDashboardView } from "@/app/admin/_components/admin-dashboard-view";
import { getDictionary } from "@/i18n";
import { getServerLocale } from "@/i18n/server-locale";
import { NOINDEX_ROBOTS } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  return {
    title: t.admin.title,
    description: t.admin.subtitle,
    robots: NOINDEX_ROBOTS,
  };
}

/**
 * Ruta `/admin`: panel exclusivo para cuentas con rol `admin`.
 */
export default function AdminPage() {
  return <AdminDashboardView />;
}
