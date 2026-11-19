import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "@jest/globals";
import type { ReactNode } from "react";

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  usePathname: () => "/admin",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...rest
  }: {
    children: ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock("@/context", () => ({
  useAuth: () => ({
    user: {
      id: 99,
      email: "admin@dolynation.test",
      fullName: "Admin Owner",
      role: "admin",
      subscriptionTier: null,
      currentStreak: 0,
      lastStreakDate: null,
      emailVerifiedAt: "2026-11-10T00:00:00.000Z",
      locale: "es",
      createdAt: "2026-11-10T00:00:00.000Z",
    },
    accessPhase: "admin",
    isAuthenticated: true,
    isLoading: false,
  }),
}));

jest.mock("@/context/toast-context", () => ({
  useToast: () => ({
    toasts: [],
    showToast: jest.fn(),
    success: mockToastSuccess,
    error: mockToastError,
    warning: jest.fn(),
    info: jest.fn(),
    dismiss: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    clear: jest.fn(),
  }),
}));

import { AdminDashboardView } from "@/app/admin/_components/admin-dashboard-view";
import { AdminRequestsView } from "@/app/admin/_components/admin-requests-view";
import { AdminUserDetailView } from "@/app/admin/_components/admin-user-detail-view";
import { LocaleProvider } from "@/i18n";
import {
  type AdminAccessRequest,
  adminService,
  type AdminUserRow,
} from "@/lib";

describe("Admin Users, Requests & Client Detail Views", () => {
  let usersState: AdminUserRow[];
  let requestsState: AdminAccessRequest[];

  beforeEach(() => {
    jest.clearAllMocks();
    usersState = [
      {
        id: 1,
        email: "lucia@example.com",
        fullName: "Lucía Mendoza",
        role: "student",
        subscriptionTier: "dolly",
        emailVerifiedAt: "2026-11-12T00:00:00.000Z",
        locale: "es",
        pendingRequestsCount: 2,
        createdAt: "2026-11-12T00:00:00.000Z",
      },
      {
        id: 99,
        email: "admin@dolynation.test",
        fullName: "Admin Owner",
        role: "admin",
        subscriptionTier: null,
        emailVerifiedAt: "2026-11-10T00:00:00.000Z",
        locale: "es",
        pendingRequestsCount: 0,
        createdAt: "2026-11-10T00:00:00.000Z",
      },
    ];

    requestsState = [
      {
        id: 11,
        userId: 1,
        userEmail: "lucia@example.com",
        userFullName: "Lucía Mendoza",
        userLocale: "es",
        userEmailVerifiedAt: "2026-11-12T00:00:00.000Z",
        userCurrentTier: "dolly",
        requestType: "subscription",
        requestedTier: "dolly_pro",
        currentTier: "dolly",
        userMessage: "Quiero probar los 4 idiomas este semestre.",
        status: "pending",
        rejectionReason: null,
        reviewedByUserId: null,
        reviewedAt: null,
        createdAt: "2026-11-15T10:00:00.000Z",
        updatedAt: "2026-11-15T10:00:00.000Z",
      },
      {
        id: 12,
        userId: 1,
        userEmail: "lucia@example.com",
        userFullName: "Lucía Mendoza",
        userLocale: "es",
        userEmailVerifiedAt: "2026-11-12T00:00:00.000Z",
        userCurrentTier: "dolly",
        requestType: "language_unlock",
        requestedTier: null,
        currentTier: "dolly",
        userMessage: "Necesito cambiar de alemán a italiano.",
        status: "pending",
        rejectionReason: null,
        reviewedByUserId: null,
        reviewedAt: null,
        createdAt: "2026-11-15T11:00:00.000Z",
        updatedAt: "2026-11-15T11:00:00.000Z",
      },
    ];

    jest.spyOn(adminService, "listUsers").mockImplementation(async () => ({
      message: "OK",
      data: usersState,
    }));

    jest.spyOn(adminService, "listRequests").mockImplementation(async () => ({
      message: "OK",
      data: requestsState,
    }));

    jest.spyOn(adminService, "getUserDetail").mockImplementation(async (id) => {
      const targetUser = usersState.find((u) => u.id === id)!;
      return {
        message: "OK",
        data: {
          user: targetUser,
          requests: requestsState.filter((r) => r.userId === id),
        },
      };
    });
  });

  it("renders Users directory by default (hiding UI locale and admins), links to Requests, and reviews via modal", async () => {
    const user = userEvent.setup();
    const approveSpy = jest
      .spyOn(adminService, "approveRequest")
      .mockImplementation(async (id) => {
        requestsState = requestsState.map((item) =>
          item.id === id ? { ...item, status: "approved" } : item,
        );
        return {
          message: "OK",
          data: {
            request: requestsState.find((item) => item.id === id)!,
            emailSent: true,
          },
        };
      });

    const rejectSpy = jest
      .spyOn(adminService, "rejectRequest")
      .mockImplementation(async (id, input) => {
        requestsState = requestsState.map((item) =>
          item.id === id
            ? { ...item, status: "rejected", rejectionReason: input.reason }
            : item,
        );
        return {
          message: "OK",
          data: {
            request: requestsState.find((item) => item.id === id)!,
            emailSent: true,
          },
        };
      });

    render(
      <LocaleProvider initialLocale="es">
        <AdminDashboardView />
      </LocaleProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText("Lucía Mendoza")).toBeInTheDocument(),
    );

    expect(
      screen.getByRole("heading", { name: /^Usuarios$/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Solicitudes/i })).toHaveAttribute(
      "href",
      "/admin/requests",
    );
    expect(screen.queryByText(/IDIOMA UI/i)).not.toBeInTheDocument();
    expect(screen.queryByText("admin@dolynation.test")).not.toBeInTheDocument();

    const row = screen.getByRole("row", { name: /lucia@example\.com/i });
    expect(within(row).getByText(/Pendiente: Dolly Pro/i)).toBeInTheDocument();

    await user.click(within(row).getByRole("button", { name: /^Revisar$/i }));
    const modal = screen.getByRole("dialog");

    const card12 = within(modal).getByTestId("admin-request-card-12");
    await user.click(
      within(card12).getByRole("button", { name: /^Rechazar$/i }),
    );
    await user.type(
      within(card12).getByPlaceholderText(/Explica claramente/i),
      "No",
    );
    await user.click(
      within(card12).getByRole("button", { name: /Confirmar rechazo/i }),
    );
    expect(
      within(card12).getByText(/al menos 5 caracteres/i),
    ).toBeInTheDocument();
    expect(rejectSpy).not.toHaveBeenCalled();

    await user.clear(
      within(card12).getByPlaceholderText(/Explica claramente/i),
    );
    await user.type(
      within(card12).getByPlaceholderText(/Explica claramente/i),
      "Primero completa tu nivel actual.",
    );
    await user.click(
      within(card12).getByRole("button", { name: /Confirmar rechazo/i }),
    );
    await waitFor(() =>
      expect(rejectSpy).toHaveBeenCalledWith(12, {
        reason: "Primero completa tu nivel actual.",
      }),
    );

    const card11 = within(modal).getByTestId("admin-request-card-11");
    await user.click(
      within(card11).getByRole("button", { name: /Aceptar solicitud/i }),
    );
    await waitFor(() => expect(approveSpy).toHaveBeenCalledWith(11, {}));
  });

  it("renders dedicated Requests queue and specific Client Detail view with empty activity logs", async () => {
    const { unmount } = render(
      <LocaleProvider initialLocale="es">
        <AdminRequestsView />
      </LocaleProvider>,
    );

    await waitFor(() =>
      expect(
        screen.getByText("Quiero probar los 4 idiomas este semestre."),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("link", { name: /Volver a Usuarios/i }),
    ).toHaveAttribute("href", "/admin");
    unmount();

    render(
      <LocaleProvider initialLocale="es">
        <AdminUserDetailView userId={1} />
      </LocaleProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText(/Cliente desde:/i)).toBeInTheDocument(),
    );
    expect(
      screen.getByText("Quiero probar los 4 idiomas este semestre."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Sin registros de actividad disponibles/i),
    ).toBeInTheDocument();
  });
});
