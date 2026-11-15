import { Suspense } from "react";

import { ResetPasswordView } from "@/app/reset-password/_components/reset-password-view";
import { Container, SkeletonCard } from "@/components/ui";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Container size="sm" className="py-10">
          <SkeletonCard lines={4} label="Preparando restablecimiento..." />
        </Container>
      }
    >
      <ResetPasswordView />
    </Suspense>
  );
}
