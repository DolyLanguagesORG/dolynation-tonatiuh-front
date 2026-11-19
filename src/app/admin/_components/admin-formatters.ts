import { type BadgeVariant } from "@/components/ui";
import { type Dictionary, formatMessage, type Locale } from "@/i18n";
import {
  type AccessRequestStatus,
  type AdminAccessRequest,
  getDateLocale,
  type SubscriptionTier,
} from "@/lib";

export const ADMIN_REQUEST_STATUS_BADGE: Record<
  AccessRequestStatus,
  BadgeVariant
> = {
  pending: "warning",
  approved: "success",
  rejected: "error",
  cancelled: "outline",
};

export function formatAdminDateTime(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleString(getDateLocale(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatAdminShortDate(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(getDateLocale(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatAdminTierLabel(
  tier: SubscriptionTier | null,
  t: Dictionary,
): string {
  return tier ? t.plans.tiers[tier].name : t.admin.requests.noPlan;
}

export function formatPendingRequestSummary(
  request: AdminAccessRequest,
  t: Dictionary,
): string {
  if (request.requestType === "subscription") {
    return formatMessage(t.admin.users.pendingPlanLabel, {
      plan: formatAdminTierLabel(request.requestedTier, t),
    });
  }
  return t.admin.users.pendingUnlockLabel;
}
