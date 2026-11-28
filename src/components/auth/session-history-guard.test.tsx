import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { act, render, screen } from "@testing-library/react";

const mockReplace = jest.fn();
let mockPathname = "/";
let mockAuthState = {
  isAuthenticated: false,
  isLoading: false,
  accessPhase: "unauthenticated" as
    | "loading"
    | "unauthenticated"
    | "unverified_email"
    | "plan_required"
    | "ready"
    | "admin",
};
let mockHasActiveNavGuard = false;

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("@/context", () => ({
  LOGGED_OUT_BARRIER_STORAGE_KEY: "doly.logged_out_barrier",
  OAUTH_RETURN_HINT_COOKIE_NAME: "doly_oauth_return",
  OAUTH_SESSION_PROVIDER_STORAGE_KEY: "doly.oauth_session_provider",
  useAuth: () => mockAuthState,
  useNavigationGuardContext: () => ({
    hasActiveGuard: mockHasActiveNavGuard,
    registerGuard: jest.fn(),
    unregisterGuard: jest.fn(),
    allowNextNavigation: jest.fn(),
  }),
}));

import { SessionHistoryGuard } from "@/components/auth/session-history-guard";
import { ToastViewport } from "@/components/ui";
import { ToastProvider } from "@/context/toast-context";
import { LocaleProvider } from "@/i18n";
import { dictionaries } from "@/i18n/dictionaries";

function renderGuard() {
  return render(
    <LocaleProvider initialLocale="es">
      <ToastProvider>
        <SessionHistoryGuard />
        <ToastViewport />
      </ToastProvider>
    </LocaleProvider>,
  );
}

describe("SessionHistoryGuard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.sessionStorage.clear();
    document.cookie = "doly_oauth_return=; Path=/; Max-Age=0; SameSite=Lax";
    window.history.replaceState({}, "", "/");
    mockPathname = "/";
    mockHasActiveNavGuard = false;
    mockAuthState = {
      isAuthenticated: false,
      isLoading: false,
      accessPhase: "unauthenticated",
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("blocks navigating back past the authenticated floor while allowing in-app history transitions", () => {
    mockAuthState = {
      isAuthenticated: true,
      isLoading: false,
      accessPhase: "ready",
    };

    renderGuard();

    expect(window.history.state).toEqual(
      expect.objectContaining({
        __dolySessionGuard: "active",
        __dolySessionMode: "auth",
      }),
    );

    // Normal Back between two internal routes does NOT show sessionFloorNotice
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
    });
    expect(
      screen.queryByText(dictionaries.es.navigationGuard.sessionFloorNotice),
    ).not.toBeInTheDocument();

    // Hitting the auth floor restores active sentinel and notifies user
    act(() => {
      window.dispatchEvent(
        new PopStateEvent("popstate", {
          state: { __dolySessionGuard: "floor", __dolySessionMode: "auth" },
        }),
      );
    });

    expect(
      screen.getByText(dictionaries.es.navigationGuard.sessionFloorNotice),
    ).toBeInTheDocument();
    expect(window.history.state).toEqual(
      expect.objectContaining({
        __dolySessionGuard: "active",
        __dolySessionMode: "auth",
      }),
    );
  });

  it("consumes doly_oauth_return hint cookie and surfaces provider-specific OAuth floor notice", () => {
    document.cookie = "doly_oauth_return=google; Path=/; SameSite=Lax";
    mockAuthState = {
      isAuthenticated: true,
      isLoading: false,
      accessPhase: "ready",
    };

    renderGuard();

    expect(
      window.sessionStorage.getItem("doly.oauth_session_provider"),
    ).toBe("Google");

    act(() => {
      window.dispatchEvent(
        new PopStateEvent("popstate", {
          state: { __dolySessionGuard: "floor", __dolySessionMode: "auth" },
        }),
      );
    });

    expect(
      screen.getByText(
        dictionaries.es.navigationGuard.oauthSessionFloorNotice.replace(
          "{provider}",
          "Google",
        ),
      ),
    ).toBeInTheDocument();
  });

  it("enforces the post-logout barrier on /login only when logged_out_barrier is present", () => {
    mockPathname = "/login";
    window.history.replaceState({}, "", "/login");

    const { rerender } = renderGuard();
    expect(window.history.state).toEqual({});

    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
    });
    expect(
      screen.queryByText(dictionaries.es.navigationGuard.loggedOutBackNotice),
    ).not.toBeInTheDocument();

    window.sessionStorage.setItem("doly.logged_out_barrier", "1");
    mockPathname = "/profile";
    rerender(
      <LocaleProvider initialLocale="es">
        <ToastProvider>
          <SessionHistoryGuard />
          <ToastViewport />
        </ToastProvider>
      </LocaleProvider>,
    );
    mockPathname = "/login";
    rerender(
      <LocaleProvider initialLocale="es">
        <ToastProvider>
          <SessionHistoryGuard />
          <ToastViewport />
        </ToastProvider>
      </LocaleProvider>,
    );

    expect(window.history.state).toEqual(
      expect.objectContaining({
        __dolySessionGuard: "active",
        __dolySessionMode: "logged_out",
      }),
    );

    act(() => {
      window.dispatchEvent(
        new PopStateEvent("popstate", {
          state: {
            __dolySessionGuard: "floor",
            __dolySessionMode: "logged_out",
          },
        }),
      );
    });

    expect(
      screen.getByText(dictionaries.es.navigationGuard.loggedOutBackNotice),
    ).toBeInTheDocument();
    expect(window.history.state).toEqual(
      expect.objectContaining({
        __dolySessionGuard: "active",
        __dolySessionMode: "logged_out",
      }),
    );
  });

  it("enforces onboarding back guard on /verify-email and yields to #199 on /select-plan", () => {
    mockPathname = "/verify-email";
    mockAuthState = {
      isAuthenticated: true,
      isLoading: false,
      accessPhase: "unverified_email",
    };
    window.history.replaceState({}, "", "/verify-email");

    const { unmount } = renderGuard();

    expect(window.history.state).toEqual(
      expect.objectContaining({
        __dolySessionGuard: "active",
        __dolySessionMode: "onboarding",
      }),
    );

    act(() => {
      window.dispatchEvent(
        new PopStateEvent("popstate", {
          state: {
            __dolySessionGuard: "floor",
            __dolySessionMode: "onboarding",
          },
        }),
      );
    });

    expect(
      screen.getByText(
        dictionaries.es.navigationGuard.onboardingStepBackNotice,
      ),
    ).toBeInTheDocument();

    unmount();
    window.history.replaceState({}, "", "/select-plan");
    window.sessionStorage.setItem("doly.select_plan_oauth_guard", "google");
    mockPathname = "/select-plan";
    mockAuthState = {
      isAuthenticated: true,
      isLoading: false,
      accessPhase: "plan_required",
    };

    renderGuard();

    expect(window.history.state).toEqual({});
  });

  it("yields completely when NavigationGuardProvider has an active guard", () => {
    mockAuthState = {
      isAuthenticated: true,
      isLoading: false,
      accessPhase: "ready",
    };
    mockHasActiveNavGuard = true;

    renderGuard();

    expect(window.history.state).toEqual({});

    act(() => {
      window.dispatchEvent(
        new PopStateEvent("popstate", {
          state: { __dolySessionGuard: "floor", __dolySessionMode: "auth" },
        }),
      );
    });

    expect(
      screen.queryByText(dictionaries.es.navigationGuard.sessionFloorNotice),
    ).not.toBeInTheDocument();
  });
});
