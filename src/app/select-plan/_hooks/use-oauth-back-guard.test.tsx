/**
 * @jest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react";

import {
  OAUTH_BACK_GUARD_STORAGE_KEY,
  OAUTH_HISTORY_STATE_KEY,
  useOAuthBackGuard,
} from "@/app/select-plan/_hooks/use-oauth-back-guard";
import type { AccountAccessPhase } from "@/lib";

describe("useOAuthBackGuard", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({ __NA: true, tree: ["select-plan"] }, "", "/select-plan");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    window.sessionStorage.clear();
    window.history.replaceState(null, "", "/select-plan");
  });

  it("does not touch history on direct visits without oauth query param or stored marker", () => {
    const replaceSpy = jest.spyOn(window.history, "replaceState");
    const pushSpy = jest.spyOn(window.history, "pushState");
    const onBackIntercepted = jest.fn();

    renderHook(() =>
      useOAuthBackGuard({
        accessPhase: "plan_required",
        onBackIntercepted,
      }),
    );

    expect(replaceSpy).not.toHaveBeenCalled();
    expect(pushSpy).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem(OAUTH_BACK_GUARD_STORAGE_KEY)).toBeNull();
    expect(onBackIntercepted).not.toHaveBeenCalled();
  });

  it("strips ?oauth=microsoft, preserves Next.js history state, arms idempotently, and intercepts popstate", () => {
    window.history.replaceState(
      { __NA: true, tree: ["select-plan"] },
      "",
      "/select-plan?oauth=microsoft",
    );
    const replaceSpy = jest.spyOn(window.history, "replaceState");
    const pushSpy = jest.spyOn(window.history, "pushState");
    const onBackIntercepted = jest.fn();

    const { rerender } = renderHook(
      ({ phase }: { phase: AccountAccessPhase }) =>
        useOAuthBackGuard({
          accessPhase: phase,
          onBackIntercepted,
        }),
      { initialProps: { phase: "loading" as AccountAccessPhase } },
    );

    expect(window.location.pathname).toBe("/select-plan");
    expect(window.location.search).toBe("");
    expect(window.sessionStorage.getItem(OAUTH_BACK_GUARD_STORAGE_KEY)).toBe(
      "microsoft",
    );
    expect(replaceSpy).toHaveBeenCalledTimes(1);
    expect(pushSpy).toHaveBeenCalledTimes(1);
    expect(window.history.state).toEqual({
      __NA: true,
      tree: ["select-plan"],
      [OAUTH_HISTORY_STATE_KEY]: "active",
    });

    // Transition from loading -> plan_required must remain idempotent.
    rerender({ phase: "plan_required" });
    expect(replaceSpy).toHaveBeenCalledTimes(1);
    expect(pushSpy).toHaveBeenCalledTimes(1);

    // Unrelated popstate does not trigger the notice.
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate", { state: { other: 1 } }));
    });
    expect(onBackIntercepted).not.toHaveBeenCalled();

    // Pressing Back hits the sentinel entry, re-pushes active state, and warns user.
    act(() => {
      window.dispatchEvent(
        new PopStateEvent("popstate", {
          state: {
            __NA: true,
            tree: ["select-plan"],
            [OAUTH_HISTORY_STATE_KEY]: "sentinel",
          },
        }),
      );
    });
    expect(onBackIntercepted).toHaveBeenCalledTimes(1);
    expect(pushSpy).toHaveBeenCalledTimes(2);
    expect(window.history.state).toEqual({
      __NA: true,
      tree: ["select-plan"],
      [OAUTH_HISTORY_STATE_KEY]: "active",
    });
  });

  it("re-arms once on first user activation gesture to counter Chromium back-skip intervention", () => {
    window.history.replaceState({ __NA: true }, "", "/select-plan?oauth=microsoft");
    const replaceSpy = jest.spyOn(window.history, "replaceState");
    const pushSpy = jest.spyOn(window.history, "pushState");
    const onBackIntercepted = jest.fn();

    renderHook(() =>
      useOAuthBackGuard({
        accessPhase: "plan_required",
        onBackIntercepted,
      }),
    );

    expect(replaceSpy).toHaveBeenCalledTimes(1);
    expect(pushSpy).toHaveBeenCalledTimes(1);

    act(() => {
      window.dispatchEvent(new Event("pointerdown"));
    });
    expect(replaceSpy).toHaveBeenCalledTimes(2);
    expect(pushSpy).toHaveBeenCalledTimes(2);

    // Subsequent interactions must not spam additional history entries.
    act(() => {
      window.dispatchEvent(new Event("keydown"));
      window.dispatchEvent(new Event("pointerdown"));
    });
    expect(replaceSpy).toHaveBeenCalledTimes(2);
    expect(pushSpy).toHaveBeenCalledTimes(2);
  });

  it("persists guard across reload via sessionStorage and clears marker once authenticated phase is ready or logged out", () => {
    window.sessionStorage.setItem(OAUTH_BACK_GUARD_STORAGE_KEY, "microsoft");
    const pushSpy = jest.spyOn(window.history, "pushState");
    const onBackIntercepted = jest.fn();

    const { rerender } = renderHook(
      ({ phase }: { phase: AccountAccessPhase }) =>
        useOAuthBackGuard({
          accessPhase: phase,
          onBackIntercepted,
        }),
      { initialProps: { phase: "plan_required" as AccountAccessPhase } },
    );

    expect(pushSpy).toHaveBeenCalledTimes(1);

    rerender({ phase: "ready" });
    expect(window.sessionStorage.getItem(OAUTH_BACK_GUARD_STORAGE_KEY)).toBeNull();

    window.sessionStorage.setItem(OAUTH_BACK_GUARD_STORAGE_KEY, "google");
    rerender({ phase: "unauthenticated" });
    expect(window.sessionStorage.getItem(OAUTH_BACK_GUARD_STORAGE_KEY)).toBeNull();
  });
});
