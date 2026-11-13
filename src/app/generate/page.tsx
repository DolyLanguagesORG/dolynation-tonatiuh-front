import { GenerateView } from "@/app/generate/_components/generate-view";

/**
 * Ruta `/generate` como Server Component ligero (la metadata vive en `generate/layout.tsx`).
 */
export default function GeneratePage() {
  return <GenerateView />;
}
