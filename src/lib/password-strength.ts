import { getDictionary, type Locale } from "@/i18n";

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
  const labels = getDictionary(locale).errors.passwordStrength;
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
      label: labels.empty,
      tone: "default",
    };
  }

  if (score <= 1) {
    return {
      activeSegments: 1,
      label: labels.weak,
      tone: "warning",
    };
  }

  if (score === 2) {
    return {
      activeSegments: 2,
      label: labels.medium,
      tone: "warning",
    };
  }

  return {
    activeSegments: 3,
    label: labels.strong,
    tone: "success",
  };
}
