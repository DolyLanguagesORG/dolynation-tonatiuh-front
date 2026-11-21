import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { OAuthProvidersSection } from "@/components/auth/oauth-providers-section";
import { LocaleProvider } from "@/i18n";
import { authService } from "@/lib";

describe("OAuthProvidersSection", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders nothing when no OAuth provider is enabled or backend request fails", async () => {
    const spy = jest
      .spyOn(authService, "getOAuthProviders")
      .mockResolvedValueOnce({
        message: "OK",
        data: { providers: [{ provider: "google", enabled: false }] },
        error: null,
      })
      .mockRejectedValueOnce(new Error("offline"));

    const { container, rerender } = render(
      <LocaleProvider initialLocale="es">
        <OAuthProvidersSection mode="login" />
      </LocaleProvider>,
    );

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
    expect(container.firstChild).toBeNull();

    rerender(
      <LocaleProvider initialLocale="es">
        <OAuthProvidersSection mode="register" />
      </LocaleProvider>,
    );
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it("renders Google sign-in button and navigates to BFF OAuth start route on click", async () => {
    jest.spyOn(authService, "getOAuthProviders").mockResolvedValue({
      message: "OK",
      data: {
        providers: [
          {
            provider: "google",
            enabled: true,
            authorizationEndpoint:
              "https://accounts.google.com/o/oauth2/v2/auth",
            clientId: "client-id",
            redirectUri: "http://localhost:3000/api/auth/oauth/google/callback",
            scopes: ["openid", "email", "profile"],
          },
        ],
      },
      error: null,
    });

    const onNavigate = jest.fn();
    render(
      <LocaleProvider initialLocale="es">
        <OAuthProvidersSection
          mode="login"
          redirectTarget="/generate"
          onNavigate={onNavigate}
        />
      </LocaleProvider>,
    );

    const button = await screen.findByRole("button", {
      name: /continuar con cuenta de google/i,
    });
    expect(screen.getByText(/o con correo electrónico/i)).toBeInTheDocument();

    fireEvent.click(button);

    expect(onNavigate).toHaveBeenCalledWith(
      "/api/auth/oauth/google?origin=login&locale=es&redirect=%2Fgenerate",
    );
  });

  it("uses register labels and respects disabled state in register mode", async () => {
    jest.spyOn(authService, "getOAuthProviders").mockResolvedValue({
      message: "OK",
      data: {
        providers: [{ provider: "google", enabled: true }],
      },
      error: null,
    });

    const onNavigate = jest.fn();
    render(
      <LocaleProvider initialLocale="es">
        <OAuthProvidersSection
          mode="register"
          disabled
          onNavigate={onNavigate}
        />
      </LocaleProvider>,
    );

    const button = await screen.findByRole("button", {
      name: /registrarse con cuenta de google/i,
    });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
