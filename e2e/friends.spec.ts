import { expect, test } from "@playwright/test";

import { attachMockBackend } from "./support/mock-api";

test.describe("Friends Module (Invitations, Private Readings & Streaks)", () => {
  test("manages email requests, shareable invite links, incoming acceptance, remove, block, and unblock", async ({
    page,
    context,
    baseURL,
  }) => {
    test.setTimeout(90_000);
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    const mock = await attachMockBackend(page, context, baseURL!, {
      initialAuthenticated: true,
      initialUser: {
        id: 101,
        email: "juan@example.com",
        fullName: "Juan Student",
        role: "student",
        subscriptionTier: "dolly_pro",
        emailVerifiedAt: "2026-11-01T00:00:00.000Z",
      },
      initialSelectedLanguages: ["es", "en", "fr", "it"],
      initialSelectedCategories: ["Tecnología", "Ciencia", "Historia"],
      initialFriends: [
        {
          id: 12,
          friend: {
            id: 202,
            fullName: "Carlos López",
            since: "2026-11-12T10:00:00.000Z",
          },
          createdAt: "2026-11-12T10:00:00.000Z",
        },
      ],
      initialIncomingFriendRequests: [
        {
          requestId: 501,
          id: 203,
          fullName: "Sofía Ramírez",
          since: "2026-11-21T10:00:00.000Z",
          direction: "incoming",
          origin: "email",
          createdAt: "2026-11-21T10:00:00.000Z",
        },
      ],
      initialFriendInviteLinks: [
        {
          id: 401,
          token: "older-link-token-0123456789abcdef0123",
          inviterUserId: 101,
          inviterName: "Juan Student",
          maxUses: 1,
          usesCount: 0,
          expiresAt: "2099-12-31T00:00:00.000Z",
          revokedAt: null,
        },
      ],
    });

    await page.goto("/friends");
    await expect(
      page.getByRole("heading", { name: "Amigos", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Carlos López" }),
    ).toBeVisible();

    // Tab: Agregar amigo (correo + link existente url:null + link compartible recién creado + WhatsApp + revocar)
    await page.getByRole("tab", { name: /Agregar amigo/i }).click();
    await expect(
      page.getByText(/Por seguridad, la URL solo se muestra justo al crear/i),
    ).toBeVisible();
    await page.getByLabel(/Correo de tu amigo/i).fill("nuevo@example.com");
    await page
      .getByRole("button", { name: /Enviar solicitud por correo/i })
      .click();
    await expect(page.getByText("nuevo").first()).toBeVisible();
    expect(mock.state.outgoingFriendRequests).toHaveLength(1);

    await page
      .getByRole("button", { name: /Generar enlace de amistad/i })
      .click();
    const whatsAppLink = page.getByRole("link", { name: /WhatsApp/i }).first();
    await expect(whatsAppLink).toHaveAttribute(
      "href",
      /https:\/\/wa\.me\/\?text=/,
    );

    await page.getByRole("button", { name: /Copiar enlace/i }).first().click();
    await expect(page.getByText("Copiado").first()).toBeVisible();

    await page.getByRole("button", { name: /^Revocar$/i }).first().click();
    const revokeDialog = page.locator("dialog[open]");
    await revokeDialog
      .getByRole("button", { name: /Sí, revocar enlace/i })
      .click();
    await expect(page.getByText("REVOCADO", { exact: true })).toBeVisible();

    // Tab: Solicitudes (aceptar entrante usando requestId y cancelar saliente usando requestId)
    await page.getByRole("tab", { name: /Solicitudes/i }).click();
    await expect(page.getByText("Sofía Ramírez")).toBeVisible();
    await page.getByRole("button", { name: /^Aceptar$/i }).click();
    await page.getByRole("button", { name: /Cancelar solicitud/i }).click();

    await page.getByRole("tab", { name: /Mis amigos/i }).click();
    await expect(
      page.getByRole("heading", { name: "Sofía Ramírez" }),
    ).toBeVisible();

    // Bloquear y desbloquear a Carlos López
    const carlosCard = page.locator("article", { hasText: "Carlos López" });
    await carlosCard.getByRole("button", { name: /^Bloquear$/i }).click();
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: /Sí, bloquear usuario/i })
      .click();
    await expect(
      page.getByRole("heading", { name: "Carlos López" }),
    ).toHaveCount(0);

    await page.getByRole("tab", { name: /Bloqueados/i }).click();
    await expect(
      page.getByRole("heading", { name: "Carlos López" }),
    ).toBeVisible();
    await page.getByRole("button", { name: /^Desbloquear$/i }).click();
    await page
      .locator("dialog[open]")
      .getByRole("button", { name: /Sí, desbloquear/i })
      .click();
    await expect(
      page.getByRole("heading", { name: "Carlos López" }),
    ).toHaveCount(0);
  });

  test("preserves /friends/invite?token=... through login and accepts invitation cleanly", async ({
    page,
    context,
    baseURL,
  }) => {
    test.setTimeout(90_000);
    const inviteToken = "ana-invite-token-0123456789abcdef0123";
    const mock = await attachMockBackend(page, context, baseURL!, {
      initialAuthenticated: false,
      initialSelectedLanguages: ["en"],
      initialSelectedCategories: ["Tecnología", "Ciencia", "Historia"],
      initialFriendInviteLinks: [
        {
          id: 77,
          token: inviteToken,
          inviterUserId: 202,
          inviterName: "Ana Sofía",
          maxUses: 1,
          usesCount: 0,
          expiresAt: "2099-12-31T00:00:00.000Z",
          revokedAt: null,
        },
      ],
    });
    mock.state.user = {
      id: 101,
      email: "juan@example.com",
      fullName: "Juan Student",
      role: "student",
      subscriptionTier: "dolly_pro",
      currentStreak: 3,
      lastStreakDate: "2026-11-13",
      emailVerifiedAt: "2026-11-01T00:00:00.000Z",
      locale: "es",
      createdAt: "2026-11-01T00:00:00.000Z",
    };

    await page.goto(`/friends/invite?token=${inviteToken}`);
    await expect(
      page.getByRole("heading", {
        name: "¿Quieres ser amigo de Ana Sofía?",
      }),
    ).toBeVisible();

    await page
      .getByRole("link", { name: /Iniciar sesión para aceptar/i })
      .click();
    await expect(page).toHaveURL(/\/login\?redirect=/);

    await page.getByLabel(/Correo electrónico/i).fill("juan@example.com");
    await page.getByRole("textbox", { name: "Contraseña" }).fill("DolyPass2026!");
    await page.getByRole("button", { name: /Iniciar sesión/i }).click();

    await expect(page).toHaveURL(
      new RegExp(`/friends/invite\\?token=${inviteToken}`),
    );
    await expect(
      page.getByRole("heading", {
        name: "¿Quieres ser amigo de Ana Sofía?",
      }),
    ).toBeVisible();

    await page.getByRole("button", { name: /^Aceptar$/i }).click();
    await expect(
      page.getByRole("heading", { name: /¡Ahora son amigos!/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Explorar lecturas de Ana Sofía/i }),
    ).toHaveAttribute("href", "/friends/202");
  });

  test("explores friend readings privately, starts copy, copies categories split by plan, proposes 2+2 streak, and renders /readings origin badges", async ({
    page,
    context,
    baseURL,
  }) => {
    test.setTimeout(90_000);
    await attachMockBackend(page, context, baseURL!, {
      initialAuthenticated: true,
      initialUser: {
        id: 101,
        email: "juan@example.com",
        fullName: "Juan Student",
        role: "student",
        subscriptionTier: "dolly",
        emailVerifiedAt: "2026-11-01T00:00:00.000Z",
      },
      initialSelectedLanguages: ["en"],
      initialSelectedCategories: [
        "Tecnología",
        "Ciencia",
        "Historia",
        "Economía",
        "Arte",
        "Filosofía",
        "Cine",
        "Música",
        "Viajes",
      ],
      initialFriends: [
        {
          id: 12,
          friend: {
            id: 202,
            fullName: "Ana Sofía",
            since: "2026-11-10T00:00:00.000Z",
          },
          createdAt: "2026-11-10T00:00:00.000Z",
        },
      ],
      initialFriendReadingsByUserId: {
        202: [
          {
            id: 901,
            title: "Deep Sea Robotics",
            description: "Autonomous vehicles mapping oceanic trenches.",
            content:
              "First paragraph exploring deep ocean engineering.\n\nSecond paragraph covering acoustic telemetry.",
            category: "Ingeniería",
            difficulty: "medium",
            language: "en",
            wordCount: 280,
            createdAt: "2026-11-22T10:00:00.000Z",
          },
        ],
      },
      initialFriendCategoriesByUserId: {
        202: ["Astrobiología", "Robótica", "Tecnología"],
      },
      initialReadings: [
        {
          id: 400,
          userId: 101,
          title: "Daily Partner Challenge",
          description: "Streak reading",
          content: "Streak content.",
          category: "Ciencia",
          difficulty: "medium",
          language: "en",
          wordCount: 200,
          status: "pending",
          originType: "friend_streak",
          score: null,
          feedback: null,
          userResponse: null,
          passed: null,
          createdAt: "2026-11-23T06:00:00.000Z",
          updatedAt: null,
          deletedAt: null,
        },
      ],
    });

    await page.goto("/friends/202");
    await expect(page.getByText("Deep Sea Robotics")).toBeVisible();
    await expect(page.getByText(/\/100/)).toHaveCount(0);

    // Proponer racha diaria eligiendo 2 categorías propias + 2 categorías aprobadas del amigo
    await page.getByRole("tab", { name: /Racha diaria/i }).click();
    await page
      .getByRole("button", { name: /Proponer racha diaria/i })
      .click();
    const streakDialog = page.locator("dialog[open]");
    const myCatsGroup = streakDialog.getByRole("group", {
      name: /Tus 2 categorías aprobadas/i,
    });
    const friendCatsGroup = streakDialog.getByRole("group", {
      name: /2 categorías aprobadas de Ana Sofía/i,
    });
    await myCatsGroup.getByRole("button", { name: "Tecnología" }).click();
    await myCatsGroup.getByRole("button", { name: "Ciencia" }).click();
    await friendCatsGroup
      .getByRole("button", { name: "Astrobiología" })
      .click();
    await friendCatsGroup.getByRole("button", { name: "Robótica" }).click();
    await streakDialog
      .getByRole("button", { name: /Enviar propuesta/i })
      .click();
    await expect(
      page.getByText(/Esperando a que Ana Sofía acepte/i),
    ).toBeVisible();

    // Copiar categorías con límite plan Básico (maxCategories=10 -> 9 previas => 1 nueva activada + 1 ya activa, 1 solo guardada)
    await page.getByRole("tab", { name: /Categorías/i }).click();
    await page.getByRole("button", { name: /Seleccionar todas/i }).click();
    await page.getByRole("button", { name: /Copiar seleccionadas/i }).click();
    await expect(
      page.getByText(/Activadas en tu plan:.*Astrobiología/i),
    ).toBeVisible();
    await expect(
      page.getByText(/Solo guardadas en biblioteca.*Robótica/i),
    ).toBeVisible();

    // Leer texto y empezar copia privada -> redirige a /readings/[miId]
    await page.getByRole("tab", { name: /Lecturas \(privado\)/i }).click();
    await page.getByRole("button", { name: /Leer texto/i }).click();
    const preview = page.locator("dialog[open]");
    await expect(
      preview.getByText("First paragraph exploring deep ocean engineering."),
    ).toBeVisible();
    await preview
      .getByRole("button", { name: /Leer y contestar en privado/i })
      .click();

    await expect(page).toHaveURL(/\/readings\/\d+/);
    await expect(page.getByText("Deep Sea Robotics")).toBeVisible();

    // Historial /readings muestra badges diferenciados de origen
    await page.goto("/readings");
    await expect(page.getByText("De un amigo").first()).toBeVisible();
    await expect(page.getByText("Racha con amigo").first()).toBeVisible();
  });

  test("runs friend streak lifecycle on mobile viewport, correlates pending streak on / and Sidebar, and blocks admins", async ({
    page,
    context,
    baseURL,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });

    await attachMockBackend(page, context, baseURL!, {
      initialAuthenticated: true,
      initialUser: {
        id: 101,
        email: "juan@example.com",
        fullName: "Juan Student",
        role: "student",
        subscriptionTier: "dolly_pro",
        emailVerifiedAt: "2026-11-01T00:00:00.000Z",
      },
      initialSelectedLanguages: ["en"],
      initialSelectedCategories: ["Tecnología", "Ciencia", "Historia"],
      initialFriends: [
        {
          id: 12,
          friend: {
            id: 202,
            fullName: "Ana Sofía",
            since: "2026-11-10T00:00:00.000Z",
          },
          createdAt: "2026-11-10T00:00:00.000Z",
        },
      ],
      initialFriendStreaks: [
        {
          id: 88,
          status: "pending_partner",
          myCategories: ["Tecnología", "Historia"],
          partnerCategories: ["Cine", "Música"],
          language: "en",
          difficulty: "medium",
          size: "medium",
          currentStreak: 0,
          longestStreak: 0,
          lastCompletedDate: null,
          myCompletedToday: false,
          partnerCompletedToday: false,
          friendUserId: 202,
        },
      ],
    });

    await page.goto("/friends?tab=streaks");
    await expect(
      page.getByText(/Ana Sofía te propuso esta racha diaria/i),
    ).toBeVisible();

    await page
      .getByRole("button", { name: /Aceptar propuesta/i })
      .click();
    const modal = page.locator("dialog[open]");
    await modal.getByRole("button", { name: "Historia" }).click();
    await modal.getByRole("button", { name: "Ciencia" }).click();
    await modal.getByRole("button", { name: /Aceptar y activar racha/i }).click();

    await expect(page.getByText("ACTIVA", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Leer lectura de hoy/i }),
    ).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);

    // Inicio `/` muestra la lectura compartida pendiente correlacionada con /readings/pending
    await page.goto("/");
    await expect(
      page.getByText(/Lecturas diarias pendientes de racha/i),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Leer hoy/i }),
    ).toHaveAttribute("href", /\/readings\/\d+/);

    // Sidebar escritorio refleja el badge pendiente en Amigos
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await expect(
      page.getByLabel(/Solicitudes o lecturas de racha pendientes/i).first(),
    ).toHaveText("1");

    // Cuenta admin queda aislada fuera de /friends
    await page.unrouteAll({ behavior: "ignoreErrors" });
    await attachMockBackend(page, context, baseURL!, {
      initialAuthenticated: true,
      initialUser: {
        id: 1,
        email: "admin@example.com",
        fullName: "Admin Doly",
        role: "admin",
        subscriptionTier: null,
        emailVerifiedAt: "2026-11-01T00:00:00.000Z",
      },
    });
    await page.goto("/friends");
    await expect(page).toHaveURL(/\/admin$/);
    await expect(
      page.getByRole("link", { name: /Amigos/i }),
    ).toHaveCount(0);
  });
});
