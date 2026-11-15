import type { Metadata } from "next";

import { ProfileView } from "@/app/profile/_components/profile-view";

export const metadata: Metadata = {
  title: "Perfil y Progreso",
  description:
    "Expediente académico del estudiante, racha de 4 semanas, métricas de precisión y preferencias de idiomas.",
};

/**
 * Ruta `/profile` alineada con el wireframe `04-perfil-y-progreso.png`.
 */
export default function ProfilePage() {
  return <ProfileView />;
}
