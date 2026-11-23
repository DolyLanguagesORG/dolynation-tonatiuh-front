import type { Appearance, Stripe } from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js";

/**
 * Mapa de tokens editoriales Blanco y Negro de DolyNation → Stripe `Appearance` API.
 * Garantiza que `<PaymentElement>` renderice sin saturación de color y con geometría recta.
 */
export const dolyStripeAppearance: Appearance = {
  theme: "flat",
  variables: {
    colorPrimary: "#000000",
    colorBackground: "#ffffff",
    colorText: "#0a0a0a",
    colorTextSecondary: "#525252",
    colorTextPlaceholder: "#737373",
    colorDanger: "#b91c1c",
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    borderRadius: "2px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "1px solid #d4d4d4",
      boxShadow: "none",
      backgroundColor: "#ffffff",
      color: "#0a0a0a",
    },
    ".Input:focus": {
      border: "1px solid #000000",
      boxShadow: "0 0 0 1px #000000",
    },
    ".Label": {
      color: "#0a0a0a",
      fontWeight: "600",
      fontSize: "13px",
    },
    ".Tab": {
      border: "1px solid #e5e5e5",
      backgroundColor: "#fafafa",
    },
    ".Tab--selected": {
      border: "1px solid #000000",
      backgroundColor: "#ffffff",
      color: "#000000",
    },
  },
};

const stripePromiseCache = new Map<string, Promise<Stripe | null>>();

/**
 * Obtiene y memoiza la promesa de `loadStripe(publishableKey)` por llave pública.
 */
export function getStripePromise(
  publishableKey: string | null | undefined,
): Promise<Stripe | null> | null {
  const cleanKey = publishableKey?.trim();
  if (!cleanKey) {
    return null;
  }

  const existing = stripePromiseCache.get(cleanKey);
  if (existing) {
    return existing;
  }

  const promise = loadStripe(cleanKey);
  stripePromiseCache.set(cleanKey, promise);
  return promise;
}

/**
 * Formatea un monto en centavos (`amountCents`) y moneda ISO (`currency`) a una etiqueta
 * monetaria legible (por ejemplo `9900`, `'mxn'` → `"$99.00 MXN"`).
 * Nunca usa montos hardcodeados: si `amountCents === null`, devuelve `null`.
 */
export function formatBillingAmount(
  amountCents: number | null | undefined,
  currency = "mxn",
): string | null {
  if (
    typeof amountCents !== "number" ||
    !Number.isFinite(amountCents) ||
    amountCents < 0
  ) {
    return null;
  }

  const upperCurrency = (currency || "mxn").trim().toUpperCase();
  const majorUnits = (amountCents / 100).toFixed(2);
  return `$${majorUnits} ${upperCurrency}`;
}
