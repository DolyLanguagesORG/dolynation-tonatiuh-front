"use client";

import {
  ActionLink,
  Badge,
  Card,
  Container,
  Heading,
  Icon,
  Text,
} from "@/components/ui";
import { useLocale } from "@/i18n";

export default function NotFound() {
  const { t } = useLocale();

  return (
    <Container size="md" className="py-12">
      <Card padding="lg" className="flex flex-col items-start gap-5">
        <Badge variant="primary">{t.errors.notFoundEyebrow}</Badge>

        <div className="flex flex-col gap-2">
          <Heading as="h1" variant="display" mainHeading>
            {t.errors.notFoundTitle}
          </Heading>
          <Text variant="editorial" tone="muted" className="italic">
            {t.errors.notFoundDescription}
          </Text>
        </div>

        <ActionLink
          href="/"
          variant="primary"
          size="md"
          leftIcon={<Icon name="arrow-left" size="sm" />}
        >
          {t.errors.notFoundHome}
        </ActionLink>
      </Card>
    </Container>
  );
}
