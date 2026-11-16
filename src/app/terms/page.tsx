import type { Metadata } from "next";

import { InfoPageView } from "@/components/legal/info-page-view";
import { loadLegalDocument, loadLegalDocuments } from "@/i18n/server-legal-docs";
import { getServerLocale } from "@/i18n/server-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const doc = loadLegalDocument("terms", locale);
  return {
    title: doc.title,
    description: doc.intro,
  };
}

export default function TermsPage() {
  const docs = loadLegalDocuments("terms");
  return <InfoPageView kind="terms" docs={docs} />;
}
