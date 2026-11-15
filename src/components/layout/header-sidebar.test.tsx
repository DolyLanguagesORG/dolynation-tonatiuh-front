import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "@jest/globals";
import type { ReactNode } from "react";

const mockLogout = jest.fn(async () => {});
let mockPathname = "/";

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/components/layout/version-badge", () => ({
  VersionBadge: () => null,
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
      id: 7,
      email: "sebastianrdzc04@gmail.com",
      fullName: "sebastian rodriguez",
      subscriptionTier: "dolly",
      currentStreak: 3,
      lastStreakDate: null,
      emailVerifiedAt: "2026-11-10T10:00:00.000Z",
      locale: "es",
      createdAt: "2026-11-10T10:00:00.000Z",
    },
    accessPhase: "ready",
    isAuthenticated: true,
    logout: mockLogout,
  }),
}));

import { AppShell } from "@/components/layout/app-shell";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { LocaleProvider } from "@/i18n";

describe("Header & Sidebar layout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    mockPathname = "/";
  });

  it("renders abbreviated ES/EN locale toggle and user dropdown menu in Header top-right", async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider initialLocale="es">
        <Header isMobileMenuOpen={false} onToggleMobileMenu={() => {}} />
      </LocaleProvider>,
    );

    const localeBtn = screen.getByRole("button", { name: /ES/i });
    expect(localeBtn).toHaveTextContent("ES");
    await user.click(localeBtn);
    expect(localeBtn).toHaveTextContent("EN");

    await user.click(localeBtn);
    expect(localeBtn).toHaveTextContent("ES");

    // No standalone sign out button visible before opening dropdown
    expect(
      screen.queryByRole("button", { name: /^Cerrar sesión$/i }),
    ).not.toBeInTheDocument();

    const trigger = screen.getByRole("button", {
      name: /Menú de cuenta de sebastian rodriguez/i,
    });
    expect(trigger).toHaveTextContent("sebastian rodriguez");
    expect(trigger).toHaveTextContent("sebastianrdzc04@gmail.com");

    await user.click(trigger);

    const profileLink = screen.getByRole("menuitem", {
      name: /Perfil y Progreso/i,
    });
    expect(profileLink).toHaveAttribute("href", "/profile");

    const logoutItem = screen.getByRole("menuitem", {
      name: /Cerrar sesión/i,
    });
    await user.click(logoutItem);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("closes UserMenuDropdown when Escape is pressed", async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider initialLocale="en">
        <Header isMobileMenuOpen={false} onToggleMobileMenu={() => {}} />
      </LocaleProvider>,
    );

    const trigger = screen.getByRole("button", {
      name: /Account menu for sebastian rodriguez/i,
    });
    await user.click(trigger);
    expect(
      screen.getByRole("menu", { name: /Account options/i }),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("menu", { name: /Account options/i }),
    ).not.toBeInTheDocument();
  });

  it("removes profile card, sign out, Create AI Text, and Profile links from Sidebar while preserving compact nav items", () => {
    const { container } = render(
      <LocaleProvider initialLocale="es">
        <Sidebar isOpen={false} onClose={() => {}} />
      </LocaleProvider>,
    );

    expect(screen.getByText("NUEVA LECTURA")).toBeInTheDocument();
    expect(screen.getByText("Inicio")).toBeInTheDocument();
    expect(screen.getByText("Mis Lecturas")).toBeInTheDocument();
    expect(screen.getByText("Glosario")).toBeInTheDocument();

    expect(screen.queryByText("Crear Texto IA")).not.toBeInTheDocument();
    expect(screen.queryByText("Perfil y Progreso")).not.toBeInTheDocument();
    expect(screen.queryByText("sebastian rodriguez")).not.toBeInTheDocument();
    expect(
      screen.queryByText("sebastianrdzc04@gmail.com"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Cerrar sesión/i }),
    ).not.toBeInTheDocument();

    const desktopSidebar = container.querySelector("#doly-sidebar-desktop");
    expect(desktopSidebar).toHaveClass("lg:w-48");
  });

  it("toggles desktop sidebar visibility from the Header button", async () => {
    const user = userEvent.setup();
    const { useState } = await import("react");

    function ShellToggleHarness() {
      const [isDesktopOpen, setIsDesktopOpen] = useState(true);
      return (
        <LocaleProvider initialLocale="es">
          <Header
            isMobileMenuOpen={false}
            onToggleMobileMenu={() => {}}
            isDesktopSidebarOpen={isDesktopOpen}
            onToggleDesktopSidebar={() => setIsDesktopOpen((prev) => !prev)}
          />
          <Sidebar
            isOpen={false}
            onClose={() => {}}
            isDesktopOpen={isDesktopOpen}
          />
        </LocaleProvider>
      );
    }

    const { container } = render(<ShellToggleHarness />);

    expect(container.querySelector("#doly-sidebar-desktop")).toBeInTheDocument();

    const brandSlot = screen.getByTestId("header-brand-slot");
    const hideBtn = screen.getByRole("button", {
      name: /Ocultar barra lateral/i,
    });
    expect(brandSlot).toContainElement(hideBtn);
    expect(brandSlot).toHaveClass("lg:w-48");
    expect(hideBtn).toHaveAttribute("aria-expanded", "true");

    await user.click(hideBtn);

    expect(
      container.querySelector("#doly-sidebar-desktop"),
    ).not.toBeInTheDocument();
    expect(brandSlot).toHaveClass("lg:w-48");

    const showBtn = screen.getByRole("button", {
      name: /Mostrar barra lateral/i,
    });
    expect(showBtn).toHaveAttribute("aria-expanded", "false");

    await user.click(showBtn);
    expect(container.querySelector("#doly-sidebar-desktop")).toBeInTheDocument();
  });

  it("hides Header, Sidebar, streak badge, locale toggle, and Footer on immersive reading routes", () => {
    for (const route of [
      "/readings/42",
      "/readings/42/evaluate",
      "/readings/42/result",
    ]) {
      mockPathname = route;
      const { container, unmount } = render(
        <LocaleProvider initialLocale="es">
          <AppShell>
            <div>Contenido inmersivo de lectura</div>
          </AppShell>
        </LocaleProvider>,
      );

      expect(
        screen.getByText("Contenido inmersivo de lectura"),
      ).toBeInTheDocument();
      expect(container.querySelector("header")).not.toBeInTheDocument();
      expect(container.querySelector("footer")).not.toBeInTheDocument();
      expect(
        container.querySelector("#doly-sidebar-desktop"),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /ES/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/Racha:/i)).not.toBeInTheDocument();
      unmount();
    }
  });

  it("renders Header, Sidebar, streak badge, and Footer on /readings history route", () => {
    mockPathname = "/readings";
    const { container } = render(
      <LocaleProvider initialLocale="es">
        <AppShell>
          <div>Historial de lecturas</div>
        </AppShell>
      </LocaleProvider>,
    );

    expect(screen.getByText("Historial de lecturas")).toBeInTheDocument();
    expect(container.querySelector("header")).toBeInTheDocument();
    expect(container.querySelector("footer")).toBeInTheDocument();
    expect(container.querySelector("#doly-sidebar-desktop")).toBeInTheDocument();
    expect(screen.getByText(/3 días/i)).toBeInTheDocument();
  });
});
