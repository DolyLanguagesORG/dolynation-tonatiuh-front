"use client";

import { Footer as FlowbiteFooter, FooterLinkGroup } from "flowbite-react";
import Link from "next/link";

import { VersionBadge } from "@/components/layout/version-badge";
import { dolyFlowbiteTheme } from "@/components/ui";
import { useLocale } from "@/i18n";

export interface FooterProps {
  /** Indica si la vista `/design-system` está habilitada para enlazarla desde el pie. */
  designSystemEnabled?: boolean;
}

/**
 * Pie de página editorial de DolyNation construido con `Footer` de `flowbite-react`
 * y el tema MCP de Flowbite en Blanco y Negro.
 */
export function Footer({ designSystemEnabled = true }: FooterProps) {
  const { t } = useLocale();

  return (
    <FlowbiteFooter
      theme={dolyFlowbiteTheme.footer}
      applyTheme={{
        root: { base: "replace" },
        groupLink: { base: "replace" },
      }}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col justify-between gap-3 text-[11px] font-semibold tracking-wider text-body uppercase sm:flex-row sm:items-center">
        <div className="flex flex-col gap-0.5">
          <p className="text-heading">{t.footer.brandNotice}</p>
          <p className="text-[10px] font-medium text-body-subtle">
            {t.footer.systemStandard}
          </p>
          <VersionBadge />
        </div>

        <FooterLinkGroup className="flex flex-wrap items-center gap-4 text-[11px] font-semibold tracking-wider text-body uppercase sm:gap-6">
          {designSystemEnabled && (
            <li>
              <Link
                href="/design-system"
                className="inline-flex min-h-6 items-center transition-colors hover:text-heading"
              >
                {t.designSystem.navLabel}
              </Link>
            </li>
          )}
          <li>
            <Link
              href="/terms"
              className="inline-flex min-h-6 items-center transition-colors hover:text-heading"
            >
              {t.footer.termsOfUse}
            </Link>
          </li>
          <li>
            <Link
              href="/privacy"
              className="inline-flex min-h-6 items-center transition-colors hover:text-heading"
            >
              {t.footer.privacyPolicy}
            </Link>
          </li>
          <li>
            <Link
              href="/support"
              className="inline-flex min-h-6 items-center transition-colors hover:text-heading"
            >
              {t.footer.technicalSupport}
            </Link>
          </li>
        </FooterLinkGroup>
      </div>
    </FlowbiteFooter>
  );
}
