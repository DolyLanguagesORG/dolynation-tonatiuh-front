"use client";

import {
  formatAdminShortDate,
  formatAdminTierLabel,
} from "@/app/admin/_components/admin-formatters";
import { AdminRequestCard } from "@/app/admin/_components/admin-request-card";
import { useAdminUserDetail } from "@/app/admin/_hooks/use-admin-user-detail";
import { RequireAdmin } from "@/components/auth";
import {
  Badge,
  Button,
  Card,
  Container,
  EmptyState,
  Heading,
  Icon,
  PageHeader,
  SkeletonCard,
  Text,
} from "@/components/ui";

function AdminUserDetailContent({ userId }: { userId: number }) {
  const {
    t,
    locale,
    detail,
    isLoading,
    isRefreshing,
    notFound,
    reviewingId,
    reload,
    approveRequest,
    rejectRequest,
  } = useAdminUserDetail(userId);

  const client = detail?.user ?? null;
  const requests = detail?.requests ?? [];

  return (
    <Container size="xl" className="flex max-w-5xl flex-col gap-6">
      <PageHeader
        backHref="/admin"
        backLabel={t.admin.backToUsersButton}
        eyebrow={t.admin.users.detail.eyebrow}
        title={
          client
            ? client.fullName || client.email
            : t.admin.users.detail.titleFallback
        }
        subtitle={
          client ? (
            <span className="font-mono text-xs text-muted">
              {client.email} · {t.admin.users.detail.clientSinceLabel}{" "}
              {formatAdminShortDate(client.createdAt, locale)}
            </span>
          ) : undefined
        }
        badges={
          client ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={client.role === "admin" ? "primary" : "secondary"}>
                {client.role === "admin"
                  ? t.admin.users.adminBadge
                  : t.admin.users.studentBadge}
              </Badge>
              <Badge variant={client.emailVerifiedAt ? "success" : "warning"}>
                {client.emailVerifiedAt
                  ? t.admin.users.verifiedYes
                  : t.admin.users.verifiedNo}
              </Badge>
              <Badge variant="outline">
                {formatAdminTierLabel(client.subscriptionTier, t)}
              </Badge>
            </div>
          ) : undefined
        }
        actions={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            isLoading={isRefreshing}
            leftIcon={<Icon name="refresh" size="xs" />}
            onClick={() => {
              void reload();
            }}
          >
            {t.admin.refreshButton}
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonCard lines={6} label={t.admin.users.detail.titleFallback} />
      ) : notFound || !client ? (
        <EmptyState
          icon="user"
          title={t.admin.users.detail.notFoundTitle}
          description={t.admin.users.detail.notFoundDescription}
        />
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <Heading as="h2" variant="subsection">
                {t.admin.users.detail.requestsTitle}
              </Heading>
              <Text variant="small" tone="muted">
                {t.admin.users.detail.requestsSubtitle}
              </Text>
            </div>

            {requests.length === 0 ? (
              <EmptyState
                icon="list-checks"
                title={t.admin.users.detail.noRequestsTitle}
                description={t.admin.users.detail.noRequestsDescription}
              />
            ) : (
              <div className="flex flex-col gap-4">
                {requests.map((req) => (
                  <AdminRequestCard
                    key={req.id}
                    request={req}
                    t={t}
                    locale={locale}
                    reviewingId={reviewingId}
                    showRequesterHeader={false}
                    onApprove={approveRequest}
                    onReject={rejectRequest}
                  />
                ))}
              </div>
            )}
          </section>

          <Card as="section" padding="lg" className="flex flex-col gap-4">
            <div className="flex flex-col gap-0.5">
              <Heading as="h2" variant="subsection">
                {t.admin.users.detail.activityTitle}
              </Heading>
              <Text variant="small" tone="muted">
                {t.admin.users.detail.activitySubtitle}
              </Text>
            </div>

            <EmptyState
              icon="file-text"
              title={t.admin.users.detail.activityEmptyTitle}
              description={t.admin.users.detail.activityEmptyDescription}
            />
          </Card>
        </>
      )}
    </Container>
  );
}

/**
 * Ficha administrativa de un cliente específico (`/admin/users/[id]`).
 */
export function AdminUserDetailView({ userId }: { userId: number }) {
  return (
    <RequireAdmin>
      <AdminUserDetailContent userId={userId} />
    </RequireAdmin>
  );
}
