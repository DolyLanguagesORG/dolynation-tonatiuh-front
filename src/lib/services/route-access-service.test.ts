import { describe, expect, it } from "@jest/globals";

import {
  createRouteAccessPolicy,
  INFORMATIONAL_ROUTES,
  ROUTE_SELECT_PLAN,
  ROUTE_VERIFY_EMAIL,
  routeAccessService,
} from "@/lib/services/route-access-service";

describe("routeAccessService", () => {
  it("blocks all private/onboarding routes when phase is unverified_email", () => {
    const blockedRoutes = [
      "/",
      "/generate",
      "/readings",
      "/readings/42",
      "/readings/42/evaluate",
      "/glossary",
      "/profile",
      "/select-plan",
      "/setup-preferences",
      "/login",
      "/register",
    ];

    for (const pathname of blockedRoutes) {
      expect(
        routeAccessService.evaluate({
          pathname,
          phase: "unverified_email",
        }),
      ).toEqual({
        allowed: false,
        redirectTo: ROUTE_VERIFY_EMAIL,
        reason: "email_verification_required",
      });
    }

    expect(
      routeAccessService.evaluate({
        pathname: ROUTE_VERIFY_EMAIL,
        phase: "unverified_email",
      }),
    ).toEqual({
      allowed: true,
      redirectTo: null,
      reason: "allowed",
    });
  });

  it("blocks system views and readings when email is verified but no plan is selected", () => {
    const blockedWithoutPlan = [
      "/",
      "/generate",
      "/readings",
      "/readings/10",
      "/readings/10/evaluate",
      "/readings/10/result",
      "/glossary",
      "/profile",
      "/setup-preferences",
    ];

    for (const pathname of blockedWithoutPlan) {
      expect(
        routeAccessService.evaluate({
          pathname,
          phase: "plan_required",
        }),
      ).toEqual({
        allowed: false,
        redirectTo: ROUTE_SELECT_PLAN,
        reason: "subscription_plan_required",
      });
    }

    expect(
      routeAccessService.evaluate({
        pathname: ROUTE_SELECT_PLAN,
        phase: "plan_required",
      }),
    ).toEqual({
      allowed: true,
      redirectTo: null,
      reason: "allowed",
    });
  });

  it("blocks private views when unauthenticated while allowing public routes", () => {
    expect(
      routeAccessService.evaluate({
        pathname: "/generate",
        phase: "unauthenticated",
      }),
    ).toEqual({
      allowed: false,
      redirectTo: "/login",
      reason: "authentication_required",
    });

    for (const entry of INFORMATIONAL_ROUTES) {
      expect(
        routeAccessService.evaluate({
          pathname: entry.path,
          phase: "unauthenticated",
        }),
      ).toEqual({
        allowed: true,
        redirectTo: null,
        reason: "allowed",
      });
    }
  });

  it("allows /verify-email with token from any phase and blocks auth/plan routes once ready", () => {
    expect(
      routeAccessService.evaluate({
        pathname: "/verify-email",
        phase: "ready",
        hasVerifyToken: true,
      }),
    ).toEqual({
      allowed: true,
      redirectTo: null,
      reason: "allowed",
    });

    for (const blockedWhenReady of [
      "/login",
      "/register",
      "/forgot-password",
      "/select-plan",
      "/verify-email",
    ]) {
      expect(
        routeAccessService.evaluate({
          pathname: blockedWhenReady,
          phase: "ready",
        }),
      ).toEqual({
        allowed: false,
        redirectTo: "/",
        reason: "already_authenticated",
      });
    }

    expect(
      routeAccessService.evaluate({
        pathname: "/setup-preferences/",
        phase: "ready",
      }),
    ).toEqual({
      allowed: true,
      redirectTo: null,
      reason: "allowed",
    });
  });

  it("enforces minimal shell on unverified_email and plan_required phases", () => {
    expect(routeAccessService.isMinimalShellRoute("/", "unverified_email")).toBe(
      true,
    );
    expect(routeAccessService.isMinimalShellRoute("/", "plan_required")).toBe(
      true,
    );
    expect(routeAccessService.isMinimalShellRoute("/generate", "ready")).toBe(
      false,
    );
    expect(
      routeAccessService.isMinimalShellRoute("/setup-preferences", "ready"),
    ).toBe(true);
  });

  it("supports custom extensible policy rules via createRouteAccessPolicy", () => {
    const policy = createRouteAccessPolicy({
      routesAllowedWithoutPlan: [
        { path: "/select-plan", match: "exact" },
        { path: "/billing-help", match: "prefix" },
      ],
    });

    expect(
      policy.evaluate({
        pathname: "/billing-help/faq",
        phase: "plan_required",
      }).allowed,
    ).toBe(true);
  });
});
