"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/context";
import { useToast } from "@/context/toast-context";
import { formatMessage, useLocale } from "@/i18n";
import {
  type AdminAccessRequest,
  adminService,
  type AdminUserDetail,
  ApiClientError,
  ErrorCode,
} from "@/lib";

export function useAdminUserDetail(userId: number) {
  const { t, locale } = useLocale();
  const { accessPhase, isAuthenticated, user } = useAuth();
  const toast = useToast();

  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const toastRef = useRef(toast);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const canLoad =
    isAuthenticated &&
    accessPhase === "admin" &&
    user?.role === "admin" &&
    Number.isFinite(userId) &&
    userId > 0;

  const isLoading = canLoad && !hasInitialLoad;

  const reload = useCallback(async (): Promise<void> => {
    if (!canLoad) return;

    setIsRefreshing(true);
    setNotFound(false);

    try {
      const response = await adminService.getUserDetail(userId);
      setDetail(response.data);
    } catch (error) {
      if (
        error instanceof ApiClientError &&
        error.code === ErrorCode.RESOURCE_NOT_FOUND
      ) {
        setNotFound(true);
        setDetail(null);
      } else {
        const msg =
          error instanceof ApiClientError
            ? error.getUserMessage(locale)
            : t.admin.syncErrorTitle;
        toastRef.current.error(msg, { title: t.admin.syncErrorTitle });
      }
    } finally {
      setHasInitialLoad(true);
      setIsRefreshing(false);
    }
  }, [canLoad, locale, t.admin.syncErrorTitle, userId]);

  useEffect(() => {
    if (!canLoad) return;

    let cancelled = false;

    adminService
      .getUserDetail(userId)
      .then((response) => {
        if (cancelled) return;
        setDetail(response.data);
        setNotFound(false);
      })
      .catch((error) => {
        if (cancelled) return;
        if (
          error instanceof ApiClientError &&
          error.code === ErrorCode.RESOURCE_NOT_FOUND
        ) {
          setNotFound(true);
          setDetail(null);
        } else {
          const msg =
            error instanceof ApiClientError
              ? error.getUserMessage(locale)
              : t.admin.syncErrorTitle;
          toastRef.current.error(msg, { title: t.admin.syncErrorTitle });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setHasInitialLoad(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [canLoad, locale, t.admin.syncErrorTitle, userId]);

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
      await reload();
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
      await reload();
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

  return {
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
  };
}
