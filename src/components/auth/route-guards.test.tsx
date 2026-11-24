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

jest.mock("@/i18n", () => {
  const actual = jest.requireActual<typeof import("@/i18n")>("@/i18n");
  return {
    ...actual,
    useLocale: () => ({
      locale: "es" as const,
      locales: actual.UI_LOCALE_LIST,
      t: actual.getDictionary("es"),
      setLocale: jest.fn(),
      toggleLocale: jest.fn(),
    }),
  };
});

import { RequireAdmin } from "@/components/auth/require-admin";
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

  it("redirects ready users on /select-plan to /setup-preferences when preferences are still incomplete", () => {
    mockAuthState = {
      isLoading: false,
      isAuthenticated: true,
      accessPhase: "ready",
      onboarding: {
        hasSelectedPlan: true,
        canGenerateReadings: false,
      },
    };
    mockPathname = "/select-plan";

    render(
      <RouteAccessGuard>
        <div>Select Plan</div>
      </RouteAccessGuard>,
    );

    expect(mockReplace).toHaveBeenCalledWith("/setup-preferences");
    expect(screen.queryByText("Select Plan")).not.toBeInTheDocument();
  });

  it("isolates admin users to /admin via RouteAccessGuard, RequireAuth and RequireAdmin", () => {
    mockAuthState = {
      isLoading: false,
      isAuthenticated: true,
      accessPhase: "admin",
      user: {
        id: 99,
        email: "admin@example.com",
        role: "admin",
      },
    };
    mockPathname = "/profile";

    const { unmount } = render(
      <RouteAccessGuard>
        <RequireAuth>
          <div>Student Profile</div>
        </RequireAuth>
      </RouteAccessGuard>,
    );

    expect(mockReplace).toHaveBeenCalledWith("/admin");
    expect(screen.queryByText("Student Profile")).not.toBeInTheDocument();
    unmount();

    mockReplace.mockClear();
    mockPathname = "/admin";
    render(
      <RequireAdmin>
        <div>Admin Panel</div>
      </RequireAdmin>,
    );
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
  });

  it("consumes pending invite redirect for already authenticated ready users on auth pages", () => {
    window.sessionStorage.setItem(
      "doly.pending_invite_redirect",
      "/friends/invite/tok-123",
    );
    mockAuthState = {
      isLoading: false,
      isAuthenticated: true,
      accessPhase: "ready",
      onboarding: {
        hasSelectedPlan: true,
        canGenerateReadings: true,
      },
    };
    mockPathname = "/login";

    render(
      <RouteAccessGuard>
        <div>Login</div>
      </RouteAccessGuard>,
    );

    expect(mockReplace).toHaveBeenCalledWith("/friends/invite/tok-123");
    expect(
      window.sessionStorage.getItem("doly.pending_invite_redirect"),
    ).toBeNull();
  });

  it("allows unauthenticated and onboarded users to view public /friends/invite/[token] links without forced redirect", () => {
    mockPathname = "/friends/invite/public-token-1";

    for (const phase of [
      "unauthenticated",
      "unverified_email",
      "plan_required",
      "ready",
      "admin",
    ] as const) {
      mockReplace.mockClear();
      mockAuthState = {
        isLoading: false,
        isAuthenticated: phase !== "unauthenticated",
        accessPhase: phase,
      };
      const { unmount } = render(
        <RouteAccessGuard>
          <div>Invite Preview</div>
        </RouteAccessGuard>,
      );

      expect(mockReplace).not.toHaveBeenCalled();
      expect(screen.getByText("Invite Preview")).toBeInTheDocument();
      unmount();
    }
  });

  it("blocks ready student users from RequireAdmin and redirects to /", () => {
    mockAuthState = {
      isLoading: false,
      isAuthenticated: true,
      accessPhase: "ready",
      user: {
        id: 1,
        email: "student@example.com",
        role: "student",
      },
    };
    mockPathname = "/admin";

    render(
      <RequireAdmin>
        <div>Admin Panel</div>
      </RequireAdmin>,
    );

    expect(mockReplace).toHaveBeenCalledWith("/");
    expect(screen.queryByText("Admin Panel")).not.toBeInTheDocument();
  });
});
