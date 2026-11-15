import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { ToastViewport } from "@/components/ui/toast-viewport";
import { ToastProvider, useToast } from "@/context/toast-context";
import { LocaleProvider } from "@/i18n";

function ToastHarness() {
  const toast = useToast();
  return (
    <div>
      <button
        type="button"
        onClick={() => toast.error("Categoría rechazada", { title: "Error" })}
      >
        Trigger error
      </button>
      <button
        type="button"
        onClick={() => toast.success("Preferencias guardadas")}
      >
        Trigger success
      </button>
      <ToastViewport />
    </div>
  );
}

describe("ToastProvider and ToastViewport", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("displays toasts, deduplicates repeated messages, and allows dismissal", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <LocaleProvider initialLocale="es">
        <ToastProvider>
          <ToastHarness />
        </ToastProvider>
      </LocaleProvider>,
    );

    const errBtn = screen.getByRole("button", { name: "Trigger error" });
    await user.click(errBtn);
    await user.click(errBtn);

    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.getByText("Categoría rechazada")).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", {
      name: "Cerrar notificación",
    });
    await user.click(closeBtn);
    expect(screen.queryByText("Categoría rechazada")).not.toBeInTheDocument();
  });

  it("auto-dismisses toasts after their duration expires", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <LocaleProvider initialLocale="en">
        <ToastProvider>
          <ToastHarness />
        </ToastProvider>
      </LocaleProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Trigger success" }));
    expect(screen.getByText("Preferencias guardadas")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(
      screen.queryByText("Preferencias guardadas"),
    ).not.toBeInTheDocument();
  });
});
