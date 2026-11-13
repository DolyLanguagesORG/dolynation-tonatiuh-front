import { beforeEach, describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react";

const mockReplace = jest.fn();
let mockPathname = "/";
let mockSearchParams = new URLSearchParams();
let mockAuthState: Record<string, unknown> = {};

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

jest.mock("@/context", () => ({
  useAuth: () => mockAuthState,
}));

jest.mock("@/i18n", () => ({
  useLocale: () => ({ locale: "es" }),
}));

import { RequireAuth } from "@/components/auth/require-auth";
import { RouteAccessGuard } from "@/components/auth/route-access-guard";

describe("RouteAccessGuard & RequireAuth", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockPathname = "/generate";
    mockSearchParams = new URLSearchParams();
    mockAuthState = {
      isLoading: false,
      isAuthenticated: false,
      accessPhase: "unauthenticated",
    };
  });

  it("redirects unverified users away from system views to /verify-email", () => {
    mockAuthState = {
      isLoading: false,
      isAuthenticated: false,
      accessPhase: "unverified_email",
    };

    for (const path of ["/", "/generate", "/readings", "/profile", "/select-plan"]) {
      mockReplace.mockClear();
      mockPathname = path;
      render(
        <RouteAccessGuard>
          <div>Protected content</div>
        </RouteAccessGuard>,
      );

      expect(mockReplace).toHaveBeenCalledWith("/verify-email");
      expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
    }
  });

  it("allows unverified user to open /verify-email with or without verification token", () => {
    mockAuthState = {
      isLoading: false,
      isAuthenticated: false,
      accessPhase: "unverified_email",
    };
    mockPathname = "/verify-email";
    mockSearchParams = new URLSearchParams("token=signed-jwt");

    render(
      <RouteAccessGuard>
        <div>Verify Email Page</div>
      </RouteAccessGuard>,
    );

    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByText("Verify Email Page")).toBeInTheDocument();
  });

  it("redirects verified users with no plan to /select-plan across all protected views", () => {
    mockAuthState = {
      isLoading: false,
      isAuthenticated: true,
      accessPhase: "plan_required",
    };

    for (const path of ["/", "/generate", "/readings", "/glossary", "/profile", "/setup-preferences"]) {
      mockReplace.mockClear();
      mockPathname = path;
      const { unmount } = render(
        <RouteAccessGuard>
          <div>Blocked View</div>
        </RouteAccessGuard>,
      );

      expect(mockReplace).toHaveBeenCalledWith("/select-plan");
      expect(screen.queryByText("Blocked View")).not.toBeInTheDocument();
      unmount();
    }
  });

  it("enforces RequireAuth redirects with return redirect path when unauthenticated", () => {
    mockAuthState = {
      isLoading: false,
      isAuthenticated: false,
      accessPhase: "unauthenticated",
    };
    mockPathname = "/readings/7";

    render(
      <RequireAuth>
        <div>Secret Reading</div>
      </RequireAuth>,
    );

    expect(mockReplace).toHaveBeenCalledWith("/login?redirect=%2Freadings%2F7");
    expect(screen.queryByText("Secret Reading")).not.toBeInTheDocument();
  });

  it("redirects plan_required users via RequireAuth straight to /select-plan", () => {
    mockAuthState = {
      isLoading: false,
      isAuthenticated: true,
      accessPhase: "plan_required",
    };
    mockPathname = "/readings";

    render(
      <RequireAuth>
        <div>Readings History</div>
      </RequireAuth>,
    );

    expect(mockReplace).toHaveBeenCalledWith("/select-plan");
    expect(screen.queryByText("Readings History")).not.toBeInTheDocument();
  });
});
