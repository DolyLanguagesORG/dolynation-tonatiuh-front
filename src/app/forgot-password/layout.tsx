import type { Metadata } from "next";
import { type ReactNode } from "react";

import { getDictionary } from "@/i18n";
import { getServerLocale } from "@/i18n/server-locale";
import { NOINDEX_ROBOTS } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  return {
    title: t.auth.forgotPassword.title,
    description: t.auth.forgotPassword.subtitle,
    robots: NOINDEX_ROBOTS,
  };
}

export default function ForgotPasswordLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
