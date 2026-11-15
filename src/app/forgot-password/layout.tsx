import type { Metadata } from "next";
import { type ReactNode } from "react";

import { getDictionary } from "@/i18n";
import { getServerLocale } from "@/i18n/server-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  return {
    title: t.auth.forgotPassword.title,
    description: t.auth.forgotPassword.subtitle,
  };
}

export default function ForgotPasswordLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
