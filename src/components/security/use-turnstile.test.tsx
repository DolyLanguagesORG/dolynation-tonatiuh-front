import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { ReactNode } from "react";

import {
  resetTurnstileLoaderForTests,
  type TurnstileApi,
  type TurnstileRenderOptions,
  useTurnstile,
} from "@/components/security";
import { LocaleProvider } from "@/i18n";
import {
  ApiClientError,
  ErrorCode,
  resetCaptchaConfigCache,
  securityService,
} from "@/lib";

function Wrapper({ children }: { children: ReactNode }) {
  return <LocaleProvider initialLocale="es">{children}</LocaleProvider>;
}

describe("useTurnstile", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    resetCaptchaConfigCache();
    resetTurnstileLoaderForTests();
    delete window.turnstile;
  });

  afterEach(() => {
    delete window.turnstile;
    document
      .querySelectorAll("[data-turnstile-fallback], [data-turnstile-loader]")
      .forEach((el) => el.remove());
  });

  it("returns null on execute when backend disables CAPTCHA", async () => {
    jest.spyOn(securityService, "getCaptchaConfig").mockResolvedValue({
      message: "OK",
      data: {
        enabled: false,
        provider: "disabled",
        siteKey: null,
        appearance: "interaction-only",
      },
    });

    const { result } = renderHook(() => useTurnstile("login"), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isEnabled).toBe(false);
    });

    let token: string | null = "unexpected";
    await act(async () => {
      token = await result.current.execute();
    });
    expect(token).toBeNull();
  });

  it("renders invisible Turnstile widget, executes token for expected action, and resets", async () => {
    jest.spyOn(securityService, "getCaptchaConfig").mockResolvedValue({
      message: "OK",
      data: {
        enabled: true,
        provider: "turnstile",
        siteKey: "1x00000000000000000000AA",
        appearance: "interaction-only",
      },
    });

    let renderedOptions: TurnstileRenderOptions | null = null;
    let counter = 0;

    window.turnstile = {
      render: jest.fn<TurnstileApi["render"]>((_container, options) => {
        renderedOptions = options;
        counter += 1;
        return `widget-${counter}`;
      }),
      execute: jest.fn<TurnstileApi["execute"]>(() => {
        renderedOptions?.callback?.(`token-for-${renderedOptions.action}`);
      }),
      reset: jest.fn<TurnstileApi["reset"]>(),
      remove: jest.fn<TurnstileApi["remove"]>(),
      getResponse: jest.fn<TurnstileApi["getResponse"]>(() => undefined),
    };

    const { result, unmount } = renderHook(() => useTurnstile("login"), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isEnabled).toBe(true);
    });

    let token: string | null = null;
    await act(async () => {
      token = await result.current.execute();
    });

    expect(token).toBe("token-for-login");
    expect(renderedOptions).toMatchObject({
      sitekey: "1x00000000000000000000AA",
      action: "login",
      theme: "light",
      language: "es",
      appearance: "interaction-only",
      execution: "execute",
    });

    act(() => {
      result.current.reset();
    });
    expect(window.turnstile.reset).toHaveBeenCalledWith("widget-1");

    // Changing action removes old widget and renders one bound to the new action
    let nextToken: string | null = null;
    await act(async () => {
      nextToken = await result.current.execute("access_request");
    });
    expect(window.turnstile.remove).toHaveBeenCalledWith("widget-1");
    expect(nextToken).toBe("token-for-access_request");

    unmount();
    expect(window.turnstile.remove).toHaveBeenCalledWith("widget-2");
  });

  it("rejects with CAPTCHA_VERIFICATION_FAILED when Turnstile triggers error-callback", async () => {
    jest.spyOn(securityService, "getCaptchaConfig").mockResolvedValue({
      message: "OK",
      data: {
        enabled: true,
        provider: "turnstile",
        siteKey: "2x00000000000000000000AB",
        appearance: "interaction-only",
      },
    });

    let renderedOptions: TurnstileRenderOptions | null = null;
    window.turnstile = {
      render: jest.fn<TurnstileApi["render"]>((_container, options) => {
        renderedOptions = options;
        return "widget-err";
      }),
      execute: jest.fn<TurnstileApi["execute"]>(() => {
        renderedOptions?.["error-callback"]?.("110200");
      }),
      reset: jest.fn<TurnstileApi["reset"]>(),
      remove: jest.fn<TurnstileApi["remove"]>(),
      getResponse: jest.fn<TurnstileApi["getResponse"]>(() => undefined),
    };

    const { result } = renderHook(() => useTurnstile("register"), {
      wrapper: Wrapper,
    });

    let caught: unknown = null;
    await act(async () => {
      try {
        await result.current.execute();
      } catch (err) {
        caught = err;
      }
    });

    expect(caught).toBeInstanceOf(ApiClientError);
    expect((caught as ApiClientError).code).toBe(
      ErrorCode.CAPTCHA_VERIFICATION_FAILED,
    );
  });
});
