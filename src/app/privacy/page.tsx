import type { Metadata } from "next";

import { InfoPageView } from "@/components/legal/info-page-view";
import { loadLegalDocument, loadLegalDocuments } from "@/i18n/server-legal-docs";
import { getServerLocale } from "@/i18n/server-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const doc = loadLegalDocument("privacy", locale);
  return {
    title: doc.title,
    description: doc.intro,
  };
}

export default function PrivacyPage() {
  const docs = loadLegalDocuments("privacy");
  return <InfoPageView kind="privacy" docs={docs} />;
}
