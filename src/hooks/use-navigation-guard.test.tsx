import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => "/readings/14/evaluate",
}));

import { NavigationGuardProvider } from "@/context/navigation-guard-context";
import { useNavigationGuard } from "@/hooks/use-navigation-guard";
import { LocaleProvider } from "@/i18n";

function GuardHarness({
  active,
  message = "Cambios sin guardar",
  href = "/profile",
  onConfirmLeave,
}: {
  active: boolean;
  message?: string;
  href?: string;
  onConfirmLeave?: () => void;
}) {
  const { allowNextNavigation } = useNavigationGuard({
    active,
    message,
    onConfirmLeave,
  });

  return (
    <div>
      <a href={href}>Ir al destino</a>
      <button
        type="button"
        onClick={() => {
          allowNextNavigation();
        }}
      >
        Permitir siguiente
      </button>
    </div>
  );
}

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider initialLocale="es">
      <NavigationGuardProvider>{children}</NavigationGuardProvider>
    </LocaleProvider>
  );
}

describe("useNavigationGuard & NavigationGuardProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.replaceState({}, "", "/readings/14/evaluate");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("cancels beforeunload while active and allows navigation once bypassed", () => {
    render(<GuardHarness active />, { wrapper: Wrapper });

    const blockedEvent = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(blockedEvent);
    expect(blockedEvent.defaultPrevented).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Permitir siguiente" }));

    const allowedEvent = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(allowedEvent);
    expect(allowedEvent.defaultPrevented).toBe(false);
  });

  it("intercepts internal link clicks with a stay/leave dialog", async () => {
    const user = userEvent.setup();
    render(<GuardHarness active message="Tu resumen aún no se envía." />, {
      wrapper: Wrapper,
    });

    await user.click(screen.getByRole("link", { name: "Ir al destino" }));

    expect(
      screen.getByText("Tu resumen aún no se envía."),
    ).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Permanecer aquí" }));
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();

    await user.click(screen.getByRole("link", { name: "Ir al destino" }));
    await user.click(
      screen.getByRole("button", { name: "Salir de todos modos" }),
    );
    expect(mockReplace).toHaveBeenCalledWith("/profile");
  });

  it("intercepts browser back popstate and offers confirmation", async () => {
    const user = userEvent.setup();
    const goSpy = jest.spyOn(window.history, "go").mockImplementation(() => {});

    render(<GuardHarness active message="No salgas todavía." />, {
      wrapper: Wrapper,
    });

    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
    });

    expect(screen.getByText("No salgas todavía.")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Salir de todos modos" }),
    );
    expect(goSpy).toHaveBeenCalledWith(-2);
  });

  it("falls back safely to local beforeunload outside NavigationGuardProvider", () => {
    render(
      <LocaleProvider initialLocale="es">
        <GuardHarness active />
      </LocaleProvider>,
    );

    const blockedEvent = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(blockedEvent);
    expect(blockedEvent.defaultPrevented).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Permitir siguiente" }));

    const allowedEvent = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(allowedEvent);
    expect(allowedEvent.defaultPrevented).toBe(false);
  });

  it("invokes onConfirmLeave only when leaving and preserves Next.js history metadata", async () => {
    const user = userEvent.setup();
    const onConfirmLeave = jest.fn();
    window.history.replaceState(
      {
        __NA: true,
        __PRIVATE_NEXTJS_INTERNALS_TREE: ["root", { children: ["evaluate"] }],
      },
      "",
      "/readings/14/evaluate",
    );

    render(
      <GuardHarness active message="Proceso crítico." onConfirmLeave={onConfirmLeave} />,
      { wrapper: Wrapper },
    );

    expect(window.history.state).toEqual(
      expect.objectContaining({
        __NA: true,
        __PRIVATE_NEXTJS_INTERNALS_TREE: ["root", { children: ["evaluate"] }],
        __dolyNavGuard: "active",
        __dolyNavDepth: 1,
      }),
    );

    act(() => {
      window.dispatchEvent(
        new PopStateEvent("popstate", {
          state: {
            __NA: true,
            __PRIVATE_NEXTJS_INTERNALS_TREE: ["root", { children: ["evaluate"] }],
            __dolyNavGuard: "sentinel",
            __dolyNavDepth: 0,
          },
        }),
      );
    });

    expect(screen.getByText("Proceso crítico.")).toBeInTheDocument();
    expect(window.history.state).toEqual(
      expect.objectContaining({
        __NA: true,
        __dolyNavGuard: "active",
        __dolyNavDepth: 1,
      }),
    );

    await user.click(screen.getByRole("button", { name: "Permanecer aquí" }));
    expect(onConfirmLeave).not.toHaveBeenCalled();

    await user.click(screen.getByRole("link", { name: "Ir al destino" }));
    await user.click(
      screen.getByRole("button", { name: "Salir de todos modos" }),
    );
    expect(onConfirmLeave).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/profile");
  });

  it("opens confirmation on first back press after multi-depth gesture re-arm", async () => {
    const user = userEvent.setup();
    const goSpy = jest.spyOn(window.history, "go").mockImplementation(() => {});
    const originalUserActivation = Object.getOwnPropertyDescriptor(
      navigator,
      "userActivation",
    );
    const mockActivation = { isActive: false, hasBeenActive: false };

    Object.defineProperty(navigator, "userActivation", {
      configurable: true,
      get: () => mockActivation,
    });

    try {
      render(<GuardHarness active message="No salgas en re-armado." />, {
        wrapper: Wrapper,
      });

      expect(window.history.state).toEqual(
        expect.objectContaining({
          __dolyNavGuard: "active",
          __dolyNavDepth: 1,
        }),
      );

      mockActivation.isActive = true;
      mockActivation.hasBeenActive = true;
      act(() => {
        window.dispatchEvent(new Event("pointerdown", { bubbles: true }));
      });

      expect(window.history.state).toEqual(
        expect.objectContaining({
          __dolyNavGuard: "active",
          __dolyNavDepth: 2,
        }),
      );

      act(() => {
        window.dispatchEvent(
          new PopStateEvent("popstate", {
            state: { __dolyNavGuard: "active", __dolyNavDepth: 1 },
          }),
        );
      });

      expect(screen.getByText("No salgas en re-armado.")).toBeInTheDocument();
      expect(window.history.state).toEqual(
        expect.objectContaining({
          __dolyNavGuard: "active",
          __dolyNavDepth: 2,
        }),
      );

      await user.click(
        screen.getByRole("button", { name: "Salir de todos modos" }),
      );
      expect(goSpy).toHaveBeenCalledWith(-3);
    } finally {
      if (originalUserActivation) {
        Object.defineProperty(navigator, "userActivation", originalUserActivation);
      } else {
        delete (navigator as { userActivation?: unknown }).userActivation;
      }
    }
  });
});
