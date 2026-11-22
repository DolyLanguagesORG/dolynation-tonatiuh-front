"use client";

import { useEffect, useState } from "react";

import {
  ActionLink,
  Badge,
  Card,
  Container,
  Heading,
  Text,
} from "@/components/ui";
import { useLocale } from "@/i18n";

/**
 * Página "sin conexión".
 *
 * Es lo que ve el usuario cuando el navegador no puede contactar con el
 * servidor y no hay ninguna copia local de la ruta que pidió.
 *
 * **Por qué existe y por qué no es el service worker**: el service worker
 *_cachea_ la "shell" de la aplicación (el JS y el CSS) y sirve una ruta
 * mínima cuando no hay red. Esta página es esa ruta mínima: al abrirla, la
 * app ya está hydrated y puede leer de la **capa de datos local**
 * (IndexedDB), que es donde vive lo que el usuario ya descargó.
 *
 * Lo que el usuario hace aquí **no** se pierde: queda en la cola local
 * ("outbox") y se sube solo al volver la red.
 */
export default function OfflinePage() {
  const { t } = useLocale();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <Container size="md" className="py-12">
      <Card padding="lg" className="flex flex-col items-start gap-5">
        <Badge variant="primary">{t.offline.eyebrow}</Badge>

        <div className="flex flex-col gap-2">
          <Heading as="h1" variant="display" mainHeading>
            {t.offline.title}
          </Heading>
          <Text variant="editorial" tone="muted" className="italic">
            {t.offline.description}
          </Text>
        </div>

        <Text variant="body" tone="subtle">
          {t.offline.pending}
        </Text>

        {online ? (
          <ActionLink href="/">{t.offline.retry}</ActionLink>
        ) : null}
      </Card>
    </Container>
  );
}
