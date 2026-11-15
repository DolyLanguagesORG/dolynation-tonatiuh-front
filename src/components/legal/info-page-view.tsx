"use client";

import {
  ActionLink,
  Badge,
  Card,
  Container,
  Divider,
  Eyebrow,
  Heading,
  Icon,
  Text,
} from "@/components/ui";
import { useAuth } from "@/context";
import {
  type LegalDocument,
  type LegalDocumentKind,
  type Locale,
  useLocale,
} from "@/i18n";

export type InfoPageKind = LegalDocumentKind;

export interface InfoPageViewProps {
  kind: LegalDocumentKind;
  docs: Record<Locale, LegalDocument>;
}

/**
 * Renderizador Editorial para documentación académica, privacidad y soporte
 * cargada desde archivos Markdown centralizados por idioma (`src/i18n/content/`).
 */
export function InfoPageView({ kind, docs }: InfoPageViewProps) {
  const { locale, t } = useLocale();
  const { isAuthenticated } = useAuth();
  const doc = docs[locale];

  return (
    <Container size="md" className="flex flex-col gap-6 py-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Eyebrow tone="muted">{doc.eyebrow}</Eyebrow>
        <Badge variant="outline">{doc.updated}</Badge>
      </div>

      <div className="flex flex-col gap-2">
        <Heading as="h1" id="main-heading" variant="display">
          {doc.title}
        </Heading>
        <Text variant="lead" tone="muted">
          {doc.intro}
        </Text>
      </div>

      <div className="flex flex-col gap-4">
        {doc.sections.map((section) => (
          <Card key={section.heading} padding="lg" className="flex flex-col gap-2">
            <Heading as="h2" variant="subsection">
              {section.heading}
            </Heading>
            <Text variant="body" tone="body" className="leading-relaxed">
              {section.body}
            </Text>
          </Card>
        ))}
      </div>

      <Divider />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ActionLink
          href={isAuthenticated ? "/" : "/login"}
          variant="primary"
          size="sm"
          leftIcon={<Icon name="arrow-left" size="xs" />}
        >
          {isAuthenticated ? t.legal.backToHome : t.auth.topSignIn}
        </ActionLink>

        <nav
          aria-label={t.legal.docNavAria}
          className="flex flex-wrap items-center gap-2"
        >
          {kind !== "terms" && (
            <ActionLink href="/terms" variant="ghost" size="sm">
              {t.legal.navTerms}
            </ActionLink>
          )}
          {kind !== "privacy" && (
            <ActionLink href="/privacy" variant="ghost" size="sm">
              {t.legal.navPrivacy}
            </ActionLink>
          )}
          {kind !== "support" && (
            <ActionLink href="/support" variant="ghost" size="sm">
              {t.legal.navSupport}
            </ActionLink>
          )}
        </nav>
      </div>
    </Container>
  );
}
