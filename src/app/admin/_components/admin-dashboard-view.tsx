"use client";

import Link from "next/link";
import { useState } from "react";

import {
  formatAdminShortDate,
  formatAdminTierLabel,
  formatPendingRequestSummary,
} from "@/app/admin/_components/admin-formatters";
import { RequestReviewModal } from "@/app/admin/_components/request-review-modal";
import {
  useAdminDashboard,
  type UserPendingFilter,
} from "@/app/admin/_hooks/use-admin-dashboard";
import { RequireAdmin } from "@/components/auth";
import {
  ActionLink,
  Badge,
  Button,
  Card,
  Container,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeadCell,
  DataTableRow,
  EmptyState,
  Icon,
  Input,
  PageHeader,
  Select,
  SkeletonCard,
  StatCard,
  Text,
} from "@/components/ui";
import { formatMessage } from "@/i18n";
import { type AdminUserRow, type UserRole } from "@/lib";

function AdminUsersContent() {
  const {
    t,
    locale,
    pendingByUserId,
    filteredUsers,
    stats,
    isLoading,
    isRefreshing,
    roleFilter,
    setRoleFilter,
    pendingFilter,
    setPendingFilter,
    userSearch,
    setUserSearch,
    reviewingId,
    reload,
    approveRequest,
    rejectRequest,
    clearUserFilters,
  } = useAdminDashboard();

  const [modalUserId, setModalUserId] = useState<number | null>(null);

  const modalUser: AdminUserRow | null =
    modalUserId !== null
      ? (filteredUsers.find((entry) => entry.id === modalUserId) ?? null)
      : null;
  const modalPendingRequests = modalUser
    ? (pendingByUserId.get(modalUser.id) ?? [])
    : [];

  const hasActiveFilters =
    roleFilter !== "student" ||
    pendingFilter !== "all" ||
    userSearch.trim().length > 0;

  return (
    <Container size="xl" className="flex max-w-6xl flex-col gap-6">
      <PageHeader
        eyebrow={t.admin.eyebrow}
        title={t.admin.title}
        subtitle={t.admin.subtitle}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ActionLink
              href="/admin/requests"
              variant="primary"
              size="sm"
              leftIcon={<Icon name="list-checks" size="xs" />}
            >
              <span>{t.admin.openRequestsButton}</span>
              {stats.pendingRequests > 0 && (
                <Badge variant="warning" className="ml-1">
                  {stats.pendingRequests}
                </Badge>
              )}
            </ActionLink>

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
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label={t.admin.stats.totalStudents}
          value={stats.totalStudents}
          footer={t.admin.stats.studentsSubtitle}
          footerIcon="user"
        />
        <StatCard
          label={t.admin.stats.pendingRequests}
          value={stats.pendingRequests}
          footer={t.admin.stats.pendingSubtitle}
          footerIcon="clock"
        />
        <StatCard
          label={t.admin.stats.activePlans}
          value={stats.activePlans}
          footer={t.admin.stats.plansSubtitle}
          footerIcon="layers"
        />
      </div>

      <Card
        padding="sm"
        className="flex flex-col gap-3 md:flex-row md:items-center"
      >
        <div className="min-w-0 flex-1">
          <Input
            type="search"
            visuallyHiddenLabel
            label={t.admin.filters.searchUsersPlaceholder}
            value={userSearch}
            onChange={(event) => setUserSearch(event.target.value)}
            placeholder={t.admin.filters.searchUsersPlaceholder}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-full sm:w-48">
            <Select
              sizing="md"
              aria-label={t.admin.filters.pendingFilterAll}
              value={pendingFilter}
              onChange={(event) =>
                setPendingFilter(event.target.value as UserPendingFilter)
              }
              options={[
                { value: "all", label: t.admin.filters.pendingFilterAll },
                {
                  value: "with_pending",
                  label: t.admin.filters.pendingFilterOnly,
                },
              ]}
            />
          </div>

          <div className="w-full sm:w-44">
            <Select
              sizing="md"
              aria-label={t.admin.filters.roleLabel}
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as UserRole | "all")
              }
              options={[
                { value: "student", label: t.admin.filters.studentsRole },
                { value: "all", label: t.admin.filters.allRoles },
                { value: "admin", label: t.admin.filters.adminsRole },
              ]}
            />
          </div>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearUserFilters}
            >
              {t.admin.filters.clearFilters}
            </Button>
          )}
        </div>
      </Card>

      {isLoading ? (
        <SkeletonCard lines={6} label={t.admin.title} />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon="user"
          title={t.admin.users.emptyTitle}
          description={t.admin.users.emptyDescription}
        />
      ) : (
        <div className="overflow-x-auto rounded-base border border-default bg-surface">
          <DataTable>
            <DataTableHead>
              <DataTableRow>
                <DataTableHeadCell>{t.admin.users.userCol}</DataTableHeadCell>
                <DataTableHeadCell>{t.admin.users.verifiedCol}</DataTableHeadCell>
                <DataTableHeadCell>{t.admin.users.planCol}</DataTableHeadCell>
                <DataTableHeadCell>{t.admin.users.requestCol}</DataTableHeadCell>
                <DataTableHeadCell>{t.admin.users.createdCol}</DataTableHeadCell>
                <DataTableHeadCell className="text-right">
                  {t.admin.users.actionsCol}
                </DataTableHeadCell>
              </DataTableRow>
            </DataTableHead>

            <DataTableBody>
              {filteredUsers.map((entry) => {
                const pendingList = pendingByUserId.get(entry.id) ?? [];
                const firstPending = pendingList[0] ?? null;

                return (
                  <DataTableRow key={entry.id}>
                    <DataTableCell>
                      <div className="flex flex-col">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Link
                            href={`/admin/users/${entry.id}`}
                            className="font-semibold text-heading underline-offset-4 hover:underline"
                          >
                            {entry.fullName || t.admin.requests.noName}
                          </Link>
                          {entry.role === "admin" && (
                            <Badge variant="primary">
                              {t.admin.users.adminBadge}
                            </Badge>
                          )}
                        </div>
                        <span className="font-mono text-xs text-muted">
                          {entry.email}
                        </span>
                      </div>
                    </DataTableCell>

                    <DataTableCell>
                      <Badge
                        variant={entry.emailVerifiedAt ? "success" : "warning"}
                      >
                        {entry.emailVerifiedAt
                          ? t.admin.users.verifiedYes
                          : t.admin.users.verifiedNo}
                      </Badge>
                    </DataTableCell>

                    <DataTableCell>
                      {entry.subscriptionTier ? (
                        <Badge variant="outline">
                          {formatAdminTierLabel(entry.subscriptionTier, t)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted">
                          {t.admin.users.noPlan}
                        </span>
                      )}
                    </DataTableCell>

                    <DataTableCell>
                      {firstPending ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="warning">
                            {formatPendingRequestSummary(firstPending, t)}
                          </Badge>
                          {pendingList.length > 1 && (
                            <Text variant="caption" tone="muted">
                              {formatMessage(t.admin.users.extraPendingSuffix, {
                                count: pendingList.length - 1,
                              })}
                            </Text>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted">
                          {t.admin.users.noPendingLabel}
                        </span>
                      )}
                    </DataTableCell>

                    <DataTableCell className="whitespace-nowrap text-xs text-muted">
                      {formatAdminShortDate(entry.createdAt, locale)}
                    </DataTableCell>

                    <DataTableCell className="text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-2">
                        {pendingList.length > 0 && (
                          <Button
                            type="button"
                            variant="primary"
                            size="xs"
                            onClick={() => setModalUserId(entry.id)}
                          >
                            {t.admin.users.reviewActionButton}
                          </Button>
                        )}
                        <ActionLink
                          href={`/admin/users/${entry.id}`}
                          variant="outline"
                          size="xs"
                        >
                          {t.admin.users.detailActionButton}
                        </ActionLink>
                      </div>
                    </DataTableCell>
                  </DataTableRow>
                );
              })}
            </DataTableBody>
          </DataTable>
        </div>
      )}

      <RequestReviewModal
        user={modalUser}
        pendingRequests={modalPendingRequests}
        t={t}
        locale={locale}
        reviewingId={reviewingId}
        onClose={() => setModalUserId(null)}
        onApprove={approveRequest}
        onReject={rejectRequest}
      />
    </Container>
  );
}

/**
 * Vista principal del módulo de Usuarios (`/admin`) para cuentas `admin`.
 */
export function AdminDashboardView() {
  return (
    <RequireAdmin>
      <AdminUsersContent />
    </RequireAdmin>
  );
}
