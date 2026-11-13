import { type Locale } from "@/i18n";

export interface PasswordStrengthAssessment {
  activeSegments: number;
  label: string;
  tone: "default" | "success" | "warning";
}

/**
 * Evalúa la fortaleza de una contraseña para los medidores segmentados de registro
 * y restablecimiento de contraseña.
 */
export function evaluatePasswordStrength(
  password: string,
  locale: Locale,
): PasswordStrengthAssessment {
  const hasMinLength = password.length >= 8;
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasDigitOrSymbol = /\d/.test(password) || /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (hasMinLength) score += 1;
  if (hasMixedCase) score += 1;
  if (hasDigitOrSymbol) score += 1;

  if (password.length === 0) {
    return {
      activeSegments: 0,
      label: locale === "es" ? "Seguridad: Sin definir" : "Strength: Empty",
      tone: "default",
    };
  }

  if (score <= 1) {
    return {
      activeSegments: 1,
      label: locale === "es" ? "Seguridad: Débil" : "Strength: Weak",
      tone: "warning",
    };
  }

  if (score === 2) {
    return {
      activeSegments: 2,
      label: locale === "es" ? "Seguridad: Media" : "Strength: Medium",
      tone: "warning",
    };
  }

  return {
    activeSegments: 3,
    label: locale === "es" ? "Seguridad: Segura" : "Strength: Strong",
    tone: "success",
  };
}
