import type { Metadata } from "next";
import { type ReactNode } from "react";

export const metadata: Metadata = {
  title: "Definir Nueva Contraseña",
  description:
    "Valida tu enlace de recuperación y actualiza la contraseña de tu cuenta en DolyNation.",
};

export default function ResetPasswordLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
