import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import type { ReactNode } from "react";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockLogin = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => "/login",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/context", () => ({
  sanitizeRedirectPath: (_path: string, fallback: string) => fallback,
  useAuth: () => ({
    login: mockLogin,
    logout: jest.fn(),
    isAuthenticated: false,
    user: null,
  }),
}));

import { LoginView } from "@/app/login/_components/login-view";
import { LocaleProvider } from "@/i18n";
import { ApiClientError, ErrorCode, resolveErrorMessage } from "@/lib/api-errors";

function Wrapper({ children }: { children: ReactNode }) {
  return <LocaleProvider initialLocale="es">{children}</LocaleProvider>;
}

describe("LoginView language switcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.documentElement.lang = "es";
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("cambia el idioma de la interfaz desde el login con el mismo selector del dashboard", async () => {
    const user = userEvent.setup();
    render(<LoginView />, { wrapper: Wrapper });

    expect(screen.getByText("Reanudar DolySesion")).toBeInTheDocument();

    const trigger = screen.getByRole("button", { name: /Idioma de interfaz/i });
    expect(trigger).toBeInTheDocument();
    expect(screen.getByText("ES")).toBeInTheDocument();

    await user.click(trigger);

    const options = screen.getAllByRole("menuitemradio");
    expect(options).toHaveLength(4);

    await user.click(screen.getByRole("menuitemradio", { name: /English/i }));

    // La interfaz completa pasa a ingles.
    expect(screen.getByText("Resume DolySession")).toBeInTheDocument();
    expect(screen.getByText("EN")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Interface language/i }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("en");
  });

  it("muestra solo un mensaje amigable sin códigos técnicos al fallar el inicio de sesión", async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce(
      new ApiClientError({
        code: ErrorCode.AUTH_INVALID_CREDENTIALS,
        message: "Invalid email or password",
        status: 401,
      }),
    );

    render(<LoginView />, { wrapper: Wrapper });

    await user.type(
      screen.getByLabelText(/Correo electrónico/i),
      "usuario@ejemplo.com",
    );
    await user.type(screen.getByLabelText(/^Contraseña/i), "WrongPass123!");
    await user.click(
      screen.getByRole("button", { name: "Iniciar sesión en DolyNation" }),
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      resolveErrorMessage(ErrorCode.AUTH_INVALID_CREDENTIALS, "es"),
    );
    expect(alert).not.toHaveTextContent("AUTH_INVALID_CREDENTIALS");
    expect(
      screen.queryByText("AUTH_INVALID_CREDENTIALS"),
    ).not.toBeInTheDocument();
  });
});
