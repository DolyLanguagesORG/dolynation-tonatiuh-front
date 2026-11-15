"use client";

import { SkeletonCard } from "@/components/ui/skeleton";
import { type Dictionary, useLocale } from "@/i18n";

export type MetaLoadingKey =
  | "loadingDefault"
  | "loadingAcademicContent"
  | "loadingVerification"
  | "loadingLogin"
  | "loadingRegister"
  | "loadingVerifyEmail"
  | "loadingResetPassword";

export interface LocalizedSkeletonCardProps {
  lines?: number;
  labelKey?: MetaLoadingKey;
  className?: string;
}

/**
 * Envuelve `SkeletonCard` con un texto accesible reactivo al idioma de interfaz
 * para usarse dentro de boundaries `<Suspense>` en rutas App Router.
 */
export function LocalizedSkeletonCard({
  lines = 3,
  labelKey = "loadingDefault",
  className = "",
}: LocalizedSkeletonCardProps) {
  const { t } = useLocale();
  const label: Dictionary["meta"][MetaLoadingKey] = t.meta[labelKey];

  return <SkeletonCard lines={lines} label={label} className={className} />;
}
