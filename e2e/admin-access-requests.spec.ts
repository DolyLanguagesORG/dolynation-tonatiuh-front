import { expect, test } from "@playwright/test";

import { attachMockBackend } from "./support/mock-api";

test.describe("Admin Isolation, Waitlist Plan Requests & Approval Flows", () => {
  test("student in waitlist mode submits plan request, reloads after approval, and can request language unlock in profile", async ({
    page,
    context,
    baseURL,
  }) => {
    test.setTimeout(90_000);
    const mock = await attachMockBackend(page, context, baseURL!, {
      accessRequestsEnabled: true,
      initialAuthenticated: true,
      initialUser: {
        id: 501,
        email: "clara@example.com",
        fullName: "Clara Zetkin",
        role: "student",
        subscriptionTier: null,
        emailVerifiedAt: "2026-11-10T00:00:00.000Z",
      },
    });

    await page.goto("/select-plan");
    await expect(
      page.getByText(/La pasarela de pago aún no está activa/i),
    ).toBeVisible();

    await page.getByText("Dolly Pro", { exact: true }).click();
    await page
      .getByPlaceholder(/Cuéntanos brevemente/i)
      .fill("Soy estudiante de posgrado y quiero probar los 4 idiomas.");
    await page
      .getByRole("button", { name: /Solicitar acceso a este plan/i })
      .click();

    await expect(
      page.getByText("EN LISTA DE ESPERA", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(/Solicitud enviada \(En lista de espera\)/i).first(),
    ).toBeVisible();
    expect(mock.state.accessRequests).toHaveLength(1);
    expect(mock.state.accessRequests[0]?.requestedTier).toBe("dolly_pro");

    // Simulate admin approval backend-side, then student clicks "Actualizar estado"
    mock.state.accessRequests[0]!.status = "approved";
    mock.state.user = {
      ...mock.state.user!,
      subscriptionTier: "dolly_pro",
    };

    await page
      .getByRole("button", { name: /Actualizar estado/i })
      .click();
    await expect(page).toHaveURL(/\/setup-preferences$/);
  });

  test("profile handles language-unlock and plan-change waitlist requests without altering active plan", async ({
    page,
    context,
    baseURL,
  }) => {
    test.setTimeout(90_000);
    const mock = await attachMockBackend(page, context, baseURL!, {
      accessRequestsEnabled: true,
      initialAuthenticated: true,
      initialUser: {
        id: 502,
        email: "elena@example.com",
        fullName: "Elena Poniatowska",
        role: "student",
        subscriptionTier: "dolly",
        emailVerifiedAt: "2026-11-10T00:00:00.000Z",
      },
      initialSelectedLanguages: ["en"],
      initialSelectedCategories: ["technology", "history", "science"],
      initialLastLanguageChangeAt: "2026-11-01T00:00:00.000Z",
      initialLanguageChangeCredits: 0,
    });

    await page.goto("/profile");

    // Language unlock request in waitlist mode
    await page
      .getByRole("button", { name: /Solicitar desbloqueo de idioma/i })
      .click();
    await page
      .getByPlaceholder(/Explica brevemente/i)
      .fill("Voy a viajar a Montreal y necesito practicar francés.");
    await page
      .getByRole("button", { name: /Enviar solicitud de desbloqueo/i })
      .click();

    await expect(
      page.getByText(/Solicitud de desbloqueo en revisión/i),
    ).toBeVisible();

    // Plan switch request keeps current Dolly plan untouched while pending
    await page
      .getByRole("button", { name: /Solicitar cambio a Dolly Plus/i })
      .click();
    await page
      .getByPlaceholder(/Agrega un mensaje opcional/i)
      .fill("Quiero estudiar dos idiomas al mismo tiempo.");
    await page
      .getByRole("button", { name: /Enviar solicitud para Dolly Plus/i })
      .click();

    await expect(
      page.getByText(/Hay una solicitud pendiente para cambiar a Dolly Plus\./i),
    ).toBeVisible();
    await expect(
      page.getByText("SOLICITUD PENDIENTE", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Solicitud pendiente \(en revisión\)/i }),
    ).toBeDisabled();

    const subscriptionSection = page.locator("#subscription");
    await expect(
      subscriptionSection.getByRole("button", { name: /Actualizar estado/i }),
    ).toHaveCount(0);

    // User cancels the pending plan-change request directly from the subscription banner
    await subscriptionSection
      .getByRole("button", { name: /Cancelar solicitud/i })
      .click();
    await subscriptionSection
      .getByRole("button", { name: /Confirmar cancelación/i })
      .click();

    await expect(
      page.getByText(/Solicitud pendiente cancelada/i).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Solicitar cambio a Dolly Plus/i }),
    ).toBeEnabled();
    expect(mock.state.user?.subscriptionTier).toBe("dolly");
    expect(mock.state.accessRequests).toHaveLength(2);
    expect(
      mock.state.accessRequests.some((r) => r.status === "cancelled"),
    ).toBe(true);
  });

  test("admin account is strictly isolated to /admin and can review requests and inspect users", async ({
    page,
    context,
    baseURL,
  }) => {
    test.setTimeout(90_000);
    const mock = await attachMockBackend(page, context, baseURL!, {
      accessRequestsEnabled: true,
      initialAuthenticated: true,
      initialUser: {
        id: 1,
        email: "owner@dolynation.test",
        fullName: "Owner Admin",
        role: "admin",
        subscriptionTier: null,
        emailVerifiedAt: "2026-11-10T00:00:00.000Z",
      },
      initialAdminUsers: [
        {
          id: 1,
          email: "owner@dolynation.test",
          fullName: "Owner Admin",
          role: "admin",
          subscriptionTier: null,
          emailVerifiedAt: "2026-11-10T00:00:00.000Z",
          locale: "es",
          pendingRequestsCount: 0,
          createdAt: "2026-11-10T00:00:00.000Z",
        },
        {
          id: 77,
          email: "applicant@example.com",
          fullName: "Juan Pérez",
          role: "student",
          subscriptionTier: null,
          emailVerifiedAt: "2026-11-15T00:00:00.000Z",
          locale: "es",
          pendingRequestsCount: 2,
          createdAt: "2026-11-15T00:00:00.000Z",
        },
      ],
      initialAccessRequests: [
        {
          id: 301,
          userId: 77,
          userEmail: "applicant@example.com",
          userFullName: "Juan Pérez",
          userLocale: "es",
          userEmailVerifiedAt: "2026-11-15T00:00:00.000Z",
          userCurrentTier: null,
          requestType: "subscription",
          requestedTier: "dolly_plus",
          currentTier: null,
          userMessage: "Quiero probar Dolly Plus para estudiar inglés y francés.",
          status: "pending",
          rejectionReason: null,
          reviewedByUserId: null,
          reviewedAt: null,
          createdAt: "2026-11-16T08:00:00.000Z",
          updatedAt: "2026-11-16T08:00:00.000Z",
        },
        {
          id: 302,
          userId: 77,
          userEmail: "applicant@example.com",
          userFullName: "Juan Pérez",
          userLocale: "es",
          userEmailVerifiedAt: "2026-11-15T00:00:00.000Z",
          userCurrentTier: "dolly",
          requestType: "language_unlock",
          requestedTier: null,
          currentTier: "dolly",
          userMessage: null,
          status: "pending",
          rejectionReason: null,
          reviewedByUserId: null,
          reviewedAt: null,
          createdAt: "2026-11-16T09:00:00.000Z",
          updatedAt: "2026-11-16T09:00:00.000Z",
        },
      ],
    });

    // Attempting to visit any student page bounces admin to /admin ("Usuarios")
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/admin$/);
    await expect(
      page.getByText("ADMINISTRADOR", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /^Usuarios$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /NUEVA LECTURA/i }),
    ).not.toBeVisible();
    await expect(page.getByText(/IDIOMA UI/i)).not.toBeVisible();

    const userRow = page.getByRole("row", { name: /applicant@example\.com/i });
    await expect(userRow).toContainText(/Pendiente: Dolly Plus/i);

    // Quick review directly from user row modal -> reject request #302
    await userRow.getByRole("button", { name: /^Revisar$/i }).click();
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    const modalCard302 = modal.getByTestId("admin-request-card-302");
    await modalCard302.getByRole("button", { name: /^Rechazar$/i }).click();
    await modalCard302
      .getByPlaceholder(/Explica claramente/i)
      .fill("Necesitas completar tus lecturas actuales primero.");
    await modalCard302
      .getByRole("button", { name: /Confirmar rechazo/i })
      .click();
    await expect(
      page.getByText(/rechazada y notificación enviada/i).first(),
    ).toBeVisible();
    await modal.getByRole("button", { name: /Cerrar ventana de revisión/i }).click();

    // Open dedicated Requests view from "Solicitudes" button in Usuarios
    await page.getByRole("link", { name: /Solicitudes/i }).click();
    await expect(page).toHaveURL(/\/admin\/requests$/);
    const card301 = page.getByTestId("admin-request-card-301");
    await card301.getByRole("button", { name: /Aceptar solicitud/i }).click();
    await expect(
      page.getByText(/aprobada y correo enviado/i).first(),
    ).toBeVisible();

    expect(
      mock.state.accessRequests.find((r) => r.id === 301)?.status,
    ).toBe("approved");
    expect(
      mock.state.accessRequests.find((r) => r.id === 302)?.status,
    ).toBe("rejected");

    // Return to Usuarios, confirm updated plan, then enter client detail view
    await page.getByRole("link", { name: /Volver a Usuarios/i }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(userRow).toContainText("Dolly Plus");

    await userRow.getByRole("link", { name: /Ver detalle/i }).click();
    await expect(page).toHaveURL(/\/admin\/users\/77$/);
    await expect(page.getByText(/Cliente desde:/i)).toBeVisible();
    await expect(
      page.getByText(/Quiero probar Dolly Plus para estudiar inglés y francés\./i),
    ).toBeVisible();
    await expect(
      page.getByText(/Sin registros de actividad disponibles/i),
    ).toBeVisible();
  });
});
