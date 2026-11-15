import type { Metadata } from "next";
import { type ReactNode } from "react";

export const metadata: Metadata = {
  title: "Recuperar Contraseña",
  description:
    "Solicita un enlace seguro por correo electrónico para restablecer tu contraseña en DolyNation.",
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
