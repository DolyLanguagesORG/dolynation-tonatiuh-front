"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/context";
import { useToast } from "@/context/toast-context";
import { formatMessage, useLocale } from "@/i18n";
import {
  type AccessRequestStatus,
  type AccessRequestType,
  type AdminAccessRequest,
  adminService,
  type AdminUserRow,
  ApiClientError,
  type UserRole,
} from "@/lib";

export type UserPendingFilter = "all" | "with_pending";

export function useAdminDashboard() {
  const { t, locale } = useLocale();
  const { accessPhase, isAuthenticated, user } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [requests, setRequests] = useState<AdminAccessRequest[]>([]);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toastRef = useRef(toast);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const [statusFilter, setStatusFilter] = useState<AccessRequestStatus | "all">(
    "all",
  );
  const [typeFilter, setTypeFilter] = useState<AccessRequestType | "all">(
    "all",
  );
  const [requestSearch, setRequestSearch] = useState("");

  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("student");
  const [pendingFilter, setPendingFilter] = useState<UserPendingFilter>("all");
  const [userSearch, setUserSearch] = useState("");

  const [reviewingId, setReviewingId] = useState<number | null>(null);

  const canLoadAdminData =
    isAuthenticated && accessPhase === "admin" && user?.role === "admin";
  const isLoading = canLoadAdminData && !hasInitialLoad;

  const loadData = useCallback(async (): Promise<void> => {
    if (!canLoadAdminData) {
      return;
    }

    setIsRefreshing(true);

    try {
      const [usersRes, requestsRes] = await Promise.all([
        adminService.listUsers(),
        adminService.listRequests(),
      ]);
      setUsers(usersRes.data);
      setRequests(requestsRes.data);
    } catch (error) {
      const msg =
        error instanceof ApiClientError
          ? error.getUserMessage(locale)
          : t.admin.syncErrorTitle;
      toastRef.current.error(msg, { title: t.admin.syncErrorTitle });
    } finally {
      setHasInitialLoad(true);
      setIsRefreshing(false);
    }
  }, [canLoadAdminData, locale, t.admin.syncErrorTitle]);

  useEffect(() => {
    if (!canLoadAdminData) {
      return;
    }

    let cancelled = false;

    Promise.all([adminService.listUsers(), adminService.listRequests()])
      .then(([usersRes, requestsRes]) => {
        if (cancelled) return;
        setUsers(usersRes.data);
        setRequests(requestsRes.data);
      })
      .catch((error) => {
        if (cancelled) return;
        const msg =
          error instanceof ApiClientError
            ? error.getUserMessage(locale)
            : t.admin.syncErrorTitle;
        toastRef.current.error(msg, { title: t.admin.syncErrorTitle });
      })
      .finally(() => {
        if (!cancelled) {
          setHasInitialLoad(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [canLoadAdminData, locale, t.admin.syncErrorTitle]);

  const stats = useMemo(() => {
    const students = users.filter((entry) => entry.role === "student");
    const pendingRequests = requests.filter(
      (req) => req.status === "pending",
    ).length;
    const activePlans = students.filter(
      (entry) => entry.subscriptionTier !== null,
    ).length;

    return {
      totalStudents: students.length,
      pendingRequests,
      activePlans,
    };
  }, [requests, users]);

  const pendingByUserId = useMemo(() => {
    const grouped = new Map<number, AdminAccessRequest[]>();
    for (const req of requests) {
      if (req.status !== "pending") continue;
      const existing = grouped.get(req.userId);
      if (existing) {
        existing.push(req);
      } else {
        grouped.set(req.userId, [req]);
      }
    }
    return grouped;
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const query = requestSearch.trim().toLowerCase();
    return requests.filter((req) => {
      if (statusFilter !== "all" && req.status !== statusFilter) {
        return false;
      }
      if (typeFilter !== "all" && req.requestType !== typeFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      const haystack = [
        req.userEmail,
        req.userFullName ?? "",
        req.userMessage ?? "",
        req.rejectionReason ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [requestSearch, requests, statusFilter, typeFilter]);

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    return users.filter((entry) => {
      if (roleFilter !== "all" && entry.role !== roleFilter) {
        return false;
      }
      if (
        pendingFilter === "with_pending" &&
        (pendingByUserId.get(entry.id)?.length ?? entry.pendingRequestsCount) ===
          0
      ) {
        return false;
      }
      if (!query) {
        return true;
      }
      const haystack = [entry.email, entry.fullName ?? ""].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [pendingByUserId, pendingFilter, roleFilter, userSearch, users]);

  const approveRequest = async (
    request: AdminAccessRequest,
  ): Promise<boolean> => {
    if (reviewingId !== null) return false;
    setReviewingId(request.id);

    try {
      const response = await adminService.approveRequest(request.id, {});
      const message = formatMessage(
        response.data.emailSent
          ? t.admin.requests.approveSuccessNotice
          : t.admin.requests.approveSuccessNoMailNotice,
        { email: request.userEmail },
      );
      toast.success(message);
      await loadData();
      return true;
    } catch (error) {
      const msg =
        error instanceof ApiClientError
          ? error.getUserMessage(locale)
          : t.admin.requests.actionErrorFallback;
      toast.error(msg);
      return false;
    } finally {
      setReviewingId(null);
    }
  };

  const rejectRequest = async (
    request: AdminAccessRequest,
    reason: string,
  ): Promise<boolean> => {
    if (reviewingId !== null) return false;
    const cleanReason = reason.trim();
    if (cleanReason.length < 5) {
      return false;
    }

    setReviewingId(request.id);

    try {
      const response = await adminService.rejectRequest(request.id, {
        reason: cleanReason,
      });
      const message = formatMessage(
        response.data.emailSent
          ? t.admin.requests.rejectSuccessNotice
          : t.admin.requests.rejectSuccessNoMailNotice,
        { email: request.userEmail },
      );
      toast.success(message);
      await loadData();
      return true;
    } catch (error) {
      const msg =
        error instanceof ApiClientError
          ? error.getUserMessage(locale)
          : t.admin.requests.actionErrorFallback;
      toast.error(msg);
      return false;
    } finally {
      setReviewingId(null);
    }
  };

  const clearRequestFilters = (): void => {
    setStatusFilter("all");
    setTypeFilter("all");
    setRequestSearch("");
  };

  const clearUserFilters = (): void => {
    setRoleFilter("student");
    setPendingFilter("all");
    setUserSearch("");
  };

  return {
    t,
    locale,
    users,
    requests,
    pendingByUserId,
    filteredUsers,
    filteredRequests,
    stats,
    isLoading,
    isRefreshing,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    requestSearch,
    setRequestSearch,
    roleFilter,
    setRoleFilter,
    pendingFilter,
    setPendingFilter,
    userSearch,
    setUserSearch,
    reviewingId,
    reload: () => loadData(),
    approveRequest,
    rejectRequest,
    clearRequestFilters,
    clearUserFilters,
  };
}
