"use client";

import { useEffect } from "react";

import {
  ActionLink,
  Alert,
  Button,
  Card,
  Container,
  Eyebrow,
  Heading,
  Icon,
} from "@/components/ui";
import { useLocale } from "@/i18n";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  useEffect(() => {
    console.error("[DolyNation Error Boundary]:", error);
  }, [error]);

  return (
    <Container size="md" className="py-10">
      <Card padding="lg" className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Eyebrow tone="muted">[{t.errors.unexpectedEyebrow}]</Eyebrow>
          <Heading as="h1" variant="title" mainHeading>
            {t.errors.unexpectedTitle}
          </Heading>
        </div>

        <Alert
          variant="error"
          title={t.errors.unexpectedBadge}
          code={error.digest ?? "UI_RUNTIME_ERROR"}
        >
          {t.errors.unexpectedDescription}
        </Alert>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            leftIcon={<Icon name="arrow-left" size="sm" />}
            onClick={() => reset()}
          >
            {t.errors.unexpectedRetry}
          </Button>
          <ActionLink href="/" variant="secondary" size="md">
            {t.errors.unexpectedHome}
          </ActionLink>
        </div>
      </Card>
    </Container>
  );
}
