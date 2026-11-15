import { HomeDashboard } from "@/app/_components/home-dashboard";

/**
 * Ruta principal `/` como Server Component ligero que delega al dashboard modular.
 */
export default function HomePage() {
  return <HomeDashboard />;
}
