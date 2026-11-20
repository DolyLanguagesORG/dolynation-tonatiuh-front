import type { Metadata } from "next";

import { InfoPageView } from "@/components/legal/info-page-view";
import { getDictionary } from "@/i18n";
import { loadLegalDocument, loadLegalDocuments } from "@/i18n/server-legal-docs";
import { getServerLocale } from "@/i18n/server-locale";
import { buildPublicPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const doc = loadLegalDocument("privacy", locale);
  return buildPublicPageMetadata({
    dict,
    locale,
    path: "/privacy",
    title: doc.title,
    description: doc.intro,
  });
}

export default function PrivacyPage() {
  const docs = loadLegalDocuments("privacy");
  return <InfoPageView kind="privacy" docs={docs} />;
}
