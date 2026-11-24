import type { Metadata } from "next";

import { InfoPageView } from "@/components/legal/info-page-view";
import { getDictionary } from "@/i18n";
import { loadLegalDocument, loadLegalDocuments } from "@/i18n/server-legal-docs";
import { getServerLocale } from "@/i18n/server-locale";
import { buildPublicPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const doc = loadLegalDocument("terms", locale);
  return buildPublicPageMetadata({
    dict,
    locale,
    path: "/terms",
    title: doc.title,
    description: doc.intro,
  });
}

export default function TermsPage() {
  const docs = loadLegalDocuments("terms");
  return <InfoPageView kind="terms" docs={docs} />;
}
