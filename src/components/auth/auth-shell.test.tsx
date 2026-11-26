import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "@jest/globals";
import type { ReactNode } from "react";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => "/login",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/context", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    logout: jest.fn(),
  }),
}));

import { AuthShell } from "@/components/auth/auth-shell";
import { toBusinessCalendarDate } from "@/app/profile/_components/streak-calendar-utils";
import { FloatingLocaleSelector } from "@/components/layout/floating-locale-selector";
import { LocaleProvider } from "@/i18n";

function Wrapper({ children }: { children: ReactNode }) {
  return <LocaleProvider initialLocale="es">{children}</LocaleProvider>;
}

describe("AuthShell headerAction", () => {
  it("ancla la acción fuera de la tarjeta, en la esquina superior derecha", () => {
    render(
      <AuthShell
        title="Reanudar DolySesion"
        subtitle="Sincroniza tu serie activa"
        headerAction={<FloatingLocaleSelector />}
      >
        <form aria-label="formulario" />
      </AuthShell>,
      { wrapper: Wrapper },
    );

    const action = screen.getByRole("button", { name: /Idioma de interfaz/i });
    const card = screen
      .getByRole("heading", { level: 1 })
      .closest("div.rounded-base");

    expect(card).not.toBeNull();
    // La acción NO vive dentro de la tarjeta (queda fuera del formulario).
    expect(card).not.toContainElement(action);
    // ...y se ancla arriba a la derecha de la pantalla.
    const anchor = action.closest("div.fixed");
    expect(anchor?.className).toContain("fixed");
    expect(anchor?.className).toContain("right-4");
    expect(anchor?.className).toContain("top-4");
    expect(anchor?.className).toContain("sm:right-6");
    expect(anchor?.className).toContain("lg:right-8");
  });

  it("no renderiza nada extra cuando no se pasa acción", () => {
    const { container } = render(
      <AuthShell title="Reanudar DolySesion">
        <form aria-label="formulario" />
      </AuthShell>,
      { wrapper: Wrapper },
    );

    expect(container.querySelector(".fixed")).toBeNull();
  });

  it("interpola dinámicamente el año calendario vigente en copyrightText", () => {
    const currentYear = String(toBusinessCalendarDate().getFullYear());
    render(
      <AuthShell
        title="Reanudar DolySesion"
        copyrightText="© {year} DolyNation Editorial."
      >
        <form aria-label="formulario" />
      </AuthShell>,
      { wrapper: Wrapper },
    );

    expect(
      screen.getByText(`© ${currentYear} DolyNation Editorial.`),
    ).toBeInTheDocument();
    expect(screen.queryByText(/\{year\}/)).toBeNull();
    expect(screen.queryByText(/2024/)).toBeNull();
  });
});
