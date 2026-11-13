import { redirect } from "next/navigation";

/**
 * Redirección limpia de `/history` hacia `/readings` para mantener URLs únicas
 * entre la barra de navegación, los enlaces editoriales y el historial.
 */
export default function HistoryRedirectPage() {
  redirect("/readings");
}
