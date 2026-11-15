"use client";

import {
  ActionLink,
  Badge,
  Card,
  Container,
  Divider,
  Eyebrow,
  Heading,
  Icon,
  Text,
} from "@/components/ui";
import { useAuth } from "@/context";
import { useLocale } from "@/i18n";

export type InfoPageKind = "terms" | "privacy" | "support";

interface InfoSection {
  title: string;
  body: string;
}

interface InfoCopy {
  eyebrow: string;
  badge: string;
  title: string;
  subtitle: string;
  sections: readonly InfoSection[];
}

function getInfoCopy(kind: InfoPageKind, locale: "es" | "en"): InfoCopy {
  if (kind === "terms") {
    return locale === "es"
      ? {
          eyebrow: "MARCO ACADÉMICO Y DE USO",
          badge: "TÉRMINOS VIGENTES",
          title: "Términos Académicos de Uso",
          subtitle:
            "Condiciones claras sobre uso de cuentas, planes de lectura y generación asistida por IA en DolyNation.",
          sections: [
            {
              title: "1. Cuenta y verificación",
              body: "Cada cuenta es personal y requiere verificación de correo electrónico antes de elegir plan o generar lecturas. Puedes cerrar todas tus sesiones activas desde Perfil en cualquier momento.",
            },
            {
              title: "2. Planes, idiomas y categorías",
              body: "Los límites diarios de lecturas, consultas al tutor IA, categorías e idiomas simultáneos dependen del plan seleccionado (Dolly, Dolly Plus o Dolly Pro). Los idiomas elegidos están sujetos a la política anual de bloqueo o desbloqueo por crédito.",
            },
            {
              title: "3. Uso responsable del contenido IA",
              body: "Las lecturas, explicaciones y evaluaciones son herramientas formativas generadas con IA sobre textos de estudio. Las categorías personalizadas pasan por moderación automática para mantener un entorno académico.",
            },
          ],
        }
      : {
          eyebrow: "ACADEMIC & USAGE FRAMEWORK",
          badge: "ACTIVE TERMS",
          title: "Academic Terms of Use",
          subtitle:
            "Clear rules governing accounts, reading plans, and AI-assisted study on DolyNation.",
          sections: [
            {
              title: "1. Account & verification",
              body: "Each account is personal and requires email verification before selecting a plan or generating readings. You can revoke all active sessions from your Profile at any time.",
            },
            {
              title: "2. Plans, languages & categories",
              body: "Daily limits on generated readings, AI tutor questions, categories, and simultaneous languages follow your active tier (Dolly, Dolly Plus, or Dolly Pro). Selected languages follow the annual lock / unlock-credit policy.",
            },
            {
              title: "3. Responsible AI study usage",
              body: "Readings, contextual explanations, and comprehension evaluations are educational tools. Custom study categories undergo automated moderation to preserve an academic environment.",
            },
          ],
        };
  }

  if (kind === "privacy") {
    return locale === "es"
      ? {
          eyebrow: "ÉTICA DE DATOS Y PRIVACIDAD",
          badge: "PROTECCIÓN DE SESIÓN",
          title: "Política de Privacidad y Ética de Datos",
          subtitle:
            "Cómo resguarda DolyNation tus credenciales, sesiones e historial de comprensión.",
          sections: [
            {
              title: "1. Tokens en cookies HttpOnly",
              body: "Tus credenciales de sesión (`access_token` y `refresh_token`) se gestionan exclusivamente en cookies HttpOnly mediante el servidor BFF; nunca se exponen en `localStorage` ni en scripts del navegador.",
            },
            {
              title: "2. Datos de progreso e historial",
              body: "Las lecturas generadas, evaluaciones, puntajes y entradas del glosario personal se almacenan asociadas a tu cuenta exclusivamente para mostrar tu progreso y calcular tus cuotas del plan.",
            },
            {
              title: "3. Control de sesiones y bajas",
              body: "Puedes consultar tu perfil, revocar todas las sesiones abiertas en otros dispositivos y eliminar lecturas de tu historial en cualquier momento desde la aplicación.",
            },
          ],
        }
      : {
          eyebrow: "DATA ETHICS & PRIVACY",
          badge: "SESSION PROTECTION",
          title: "Privacy Policy & Data Ethics",
          subtitle:
            "How DolyNation safeguards your credentials, sessions, and reading comprehension history.",
          sections: [
            {
              title: "1. HttpOnly session cookies",
              body: "Authentication tokens (`access_token` and `refresh_token`) live strictly in HttpOnly cookies handled by the BFF proxy and are never stored in browser `localStorage`.",
            },
            {
              title: "2. Progress & reading records",
              body: "Generated readings, comprehension evaluations, scores, and personal glossary bookmarks remain scoped to your account solely to display progress and enforce plan quotas.",
            },
            {
              title: "3. Session & record control",
              body: "You can inspect your profile, terminate all active sessions across devices, and delete readings from your list at any time inside the application.",
            },
          ],
        };
  }

  return locale === "es"
    ? {
        eyebrow: "ATENCIÓN Y DIAGNÓSTICO",
        badge: "SOPORTE TÉCNICO",
        title: "Soporte Académico y Técnico",
        subtitle:
          "Guía rápida para recuperación de acceso, verificación de correo y cuotas del sistema.",
        sections: [
          {
            title: "1. Verificación y recuperación de contraseña",
            body: "Si no encuentras el correo de confirmación o el enlace expiró, solicita un reenvío en Verificación de Correo o utiliza la opción de Recuperar Contraseña en Inicio de Sesión.",
          },
          {
            title: "2. Límite de lecturas pendientes (máx. 3)",
            body: "Por regla pedagógica puedes mantener hasta 3 lecturas pendientes de evaluación simultáneamente. Evalúa o elimina una lectura pendiente desde Mis Lecturas para generar nuevas.",
          },
          {
            title: "3. Límites diarios y cambio de idioma",
            body: "Las cuotas diarias se reinician a medianoche (zona America/Mexico_City). Puedes revisar tu consumo diario en vivo, cambiar de plan o desbloquear un cambio anticipado de idioma desde Perfil.",
          },
        ],
      }
    : {
        eyebrow: "HELP & TROUBLESHOOTING",
        badge: "TECHNICAL SUPPORT",
        title: "Academic & Technical Support",
        subtitle:
          "Quick reference for account recovery, email verification, and system study quotas.",
        sections: [
          {
            title: "1. Email verification & password reset",
            body: "If you missed your verification link or it expired, request a new link from Verify Email or use Password Recovery on the Sign In screen.",
          },
          {
            title: "2. Pending reading cap (max 3)",
            body: "To keep focus high, up to 3 pending readings can stay open at once. Evaluate or remove a pending reading from My Readings to unlock new generations.",
          },
          {
            title: "3. Daily limits & language locks",
            body: "Daily quotas reset at midnight (America/Mexico_City). Review live daily usage, switch subscription tiers, or unlock an early language change directly from Profile.",
          },
        ],
      };
}

export function InfoPageView({ kind }: { kind: InfoPageKind }) {
  const { locale } = useLocale();
  const { isAuthenticated } = useAuth();
  const copy = getInfoCopy(kind, locale);

  return (
    <Container size="md" className="flex flex-col gap-6 py-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Eyebrow tone="muted">{copy.eyebrow}</Eyebrow>
        <Badge variant="outline">{copy.badge}</Badge>
      </div>

      <div className="flex flex-col gap-2">
        <Heading as="h1" id="main-heading" variant="display">
          {copy.title}
        </Heading>
        <Text variant="lead" tone="muted">
          {copy.subtitle}
        </Text>
      </div>

      <div className="flex flex-col gap-4">
        {copy.sections.map((section) => (
          <Card key={section.title} padding="lg" className="flex flex-col gap-2">
            <Heading as="h2" variant="subsection">
              {section.title}
            </Heading>
            <Text variant="body" tone="body" className="leading-relaxed">
              {section.body}
            </Text>
          </Card>
        ))}
      </div>

      <Divider />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ActionLink
          href={isAuthenticated ? "/" : "/login"}
          variant="primary"
          size="sm"
          leftIcon={<Icon name="arrow-left" size="xs" />}
        >
          {isAuthenticated
            ? locale === "es"
              ? "Volver al inicio"
              : "Back to dashboard"
            : locale === "es"
              ? "Ir a iniciar sesión"
              : "Go to sign in"}
        </ActionLink>

        <div className="flex flex-wrap items-center gap-2">
          {kind !== "terms" && (
            <ActionLink href="/terms" variant="ghost" size="sm">
              {locale === "es" ? "Términos" : "Terms"}
            </ActionLink>
          )}
          {kind !== "privacy" && (
            <ActionLink href="/privacy" variant="ghost" size="sm">
              {locale === "es" ? "Privacidad" : "Privacy"}
            </ActionLink>
          )}
          {kind !== "support" && (
            <ActionLink href="/support" variant="ghost" size="sm">
              {locale === "es" ? "Soporte" : "Support"}
            </ActionLink>
          )}
        </div>
      </div>
    </Container>
  );
}
