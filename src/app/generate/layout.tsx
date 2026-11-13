import type { Metadata } from "next";
import { type ReactNode } from "react";

export const metadata: Metadata = {
  title: "Generación de Lectura",
  description:
    "Configuración y selección de parámetros de estudio (idioma, categoría, dificultad, longitud) para lecturas asistidas por IA.",
};

export default function GenerateLayout({ children }: { children: ReactNode }) {
  return children;
}
