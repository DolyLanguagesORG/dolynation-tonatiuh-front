"use client";

import { AdminRequestCard } from "@/app/admin/_components/admin-request-card";
import { useAdminDashboard } from "@/app/admin/_hooks/use-admin-dashboard";
import { RequireAdmin } from "@/components/auth";
import {
  Button,
  Card,
  Container,
  EmptyState,
  Icon,
  Input,
  PageHeader,
  Select,
  SkeletonCard,
} from "@/components/ui";
import { type AccessRequestStatus, type AccessRequestType } from "@/lib";

function AdminRequestsContent() {
  const {
    t,
    locale,
    filteredRequests,
    isLoading,
    isRefreshing,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    requestSearch,
    setRequestSearch,
    reviewingId,
    reload,
    approveRequest,
    rejectRequest,
    clearRequestFilters,
  } = useAdminDashboard();

  const hasActiveFilters =
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    requestSearch.trim().length > 0;

  return (
    <Container size="xl" className="flex max-w-6xl flex-col gap-6">
      <PageHeader
        backHref="/admin"
        backLabel={t.admin.backToUsersButton}
        eyebrow={t.admin.eyebrow}
        title={t.admin.requests.title}
        subtitle={t.admin.requests.subtitle}
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

      <Card
        padding="sm"
        className="flex flex-col gap-3 md:flex-row md:items-center"
      >
        <div className="min-w-0 flex-1">
          <Input
            type="search"
            visuallyHiddenLabel
            label={t.admin.filters.searchRequestsPlaceholder}
            value={requestSearch}
            onChange={(event) => setRequestSearch(event.target.value)}
            placeholder={t.admin.filters.searchRequestsPlaceholder}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-full sm:w-44">
            <Select
              sizing="md"
              aria-label={t.admin.filters.statusLabel}
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as AccessRequestStatus | "all")
              }
              options={[
                { value: "all", label: t.admin.filters.allStatuses },
                { value: "pending", label: t.admin.filters.pendingOnly },
                { value: "approved", label: t.admin.filters.approvedOnly },
                { value: "rejected", label: t.admin.filters.rejectedOnly },
              ]}
            />
          </div>

          <div className="w-full sm:w-48">
            <Select
              sizing="md"
              aria-label={t.admin.filters.typeLabel}
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as AccessRequestType | "all")
              }
              options={[
                { value: "all", label: t.admin.filters.allTypes },
                {
                  value: "subscription",
                  label: t.admin.filters.subscriptionType,
                },
                {
                  value: "language_unlock",
                  label: t.admin.filters.languageUnlockType,
                },
              ]}
            />
          </div>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearRequestFilters}
            >
              {t.admin.filters.clearFilters}
            </Button>
          )}
        </div>
      </Card>

      {isLoading ? (
        <SkeletonCard lines={6} label={t.admin.requests.title} />
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          icon="list-checks"
          title={t.admin.requests.emptyTitle}
          description={t.admin.requests.emptyDescription}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {filteredRequests.map((req) => (
            <AdminRequestCard
              key={req.id}
              request={req}
              t={t}
              locale={locale}
              reviewingId={reviewingId}
              showDetailLink
              onApprove={approveRequest}
              onReject={rejectRequest}
            />
          ))}
        </div>
      )}
    </Container>
  );
}

/**
 * Bandeja administrativa de solicitudes (`/admin/requests`).
 */
export function AdminRequestsView() {
  return (
    <RequireAdmin>
      <AdminRequestsContent />
    </RequireAdmin>
  );
}
