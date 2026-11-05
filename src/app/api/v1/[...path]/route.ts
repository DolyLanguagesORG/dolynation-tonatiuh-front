import { type NextRequest } from "next/server";

import { backendInternalUrl } from "@/lib/server/backend-url";

/**
 * Proxy del frontend hacia el backend (patron BFF de Next.js).
 *
 * El navegador nunca ve la direccion del backend: pide `/api/v1/<ruta>` a
 * este mismo origen y es el servidor de Next.js quien reenvia la peticion a
 * `BACKEND_INTERNAL_URL`, que es una variable **de servidor** (no lleva
 * `NEXT_PUBLIC_`, asi que no se compila en el bundle del navegador).
 *
 * Ventajas frente a llamar al backend desde el navegador:
 *
 * - La URL y el puerto del backend no se filtran al cliente.
 * - Se puede anadir la sesion en el servidor (front#3, front#4) sin
 *   exponer tokens en el JS del navegador.
 * - El navegador solo habla con un origen: no hay CORS ni preflight.
 * - `BACKEND_INTERNAL_URL` se lee en tiempo de ejecucion, no se hornea en
 *   el build: staging y produccion pueden apuntar a backends distintos.
 *
 * La ruta canonica del backend es `/api/v1` (ver `API_PREFIX` en el backend),
 * de modo que aqui la ruta publica coincide con la interna y no hay que
 * traducir prefijos.
 */

/**
 * Cabeceras que se reenvian al backend. Todo lo demas se descarta: las
 * cookies del navegador no deben viajar a la API, y las cabeceras `host` o
 * `connection` harian que el backend creyera estar en otro servidor.
 */
const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "authorization",
  "content-type",
] as const;

/**
 * Methods que el backend expone.
 */
const ALLOWED_METHODS = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
]);

/**
 * Error con la misma forma que el envelope del backend
 * (`{ message, data, error }`), para que el cliente del frontend pueda
 * tratarlo sin cambiar su manejo de errores.
 */
function apiError(
  status: number,
  code: string,
  message: string,
): Response {
  return Response.json(
    {
      message,
      data: null,
      error: { code, message },
    },
    { status },
  );
}

/**
 * Normaliza los segmentos de la ruta para impedir path traversal
 * (`..`, `.`) y separadores incrustados. Devuelve `null` si la ruta es
 * invalida.
 */
function sanitizeSegments(segments: string[]): string[] | null {
  const clean: string[] = [];

  for (const raw of segments) {
    let segment: string;
    try {
      segment = decodeURIComponent(raw);
    } catch {
      // Segmento con percent-encoding invalido.
      return null;
    }

    if (segment === "" || segment === "." || segment === "..") {
      return null;
    }

    // Un separador incrustado permitiria salir del prefijo de la URL base.
    if (segment.includes("/") || segment.includes("\\")) {
      return null;
    }

    // Caracteres de control: no tienen sentido en una ruta y se usan para
    // inyectar cabeceras.
    if (/[\u0000-\u001f\u007f]/.test(segment)) {
      return null;
    }

    clean.push(encodeURIComponent(segment));
  }

  return clean;
}

/**
 * Construye la URL final en el backend a partir de los segmentos de la ruta
 * y los parametros de consulta.
 */
function buildTargetUrl(
  segments: string[],
  searchParams: URLSearchParams,
): URL {
  const base = new URL(backendInternalUrl);
  const basePath = base.pathname.replace(/\/+$/, "");
  const path = segments.length > 0 ? `/${segments.join("/")}` : "";

  // La ruta se resuelve sobre el origen de la URL base: `new URL` exige una
  // URL absoluta.
  const target = new URL(`${basePath}${path}`, base);

  // Los parametros de consulta se copian tal cual, incluidos los repetidos.
  searchParams.forEach((value, key) => {
    target.searchParams.append(key, value);
  });

  return target;
}

async function proxy(request: NextRequest, path: string[]): Promise<Response> {
  const method = request.method.toUpperCase();

  if (!ALLOWED_METHODS.has(method)) {
    return apiError(
      405,
      "METHOD_NOT_ALLOWED",
      `El metodo ${method} no esta permitido en el proxy.`,
    );
  }

  const segments = sanitizeSegments(path);
  if (segments === null) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "La ruta solicitada no es valida.",
    );
  }

  let target: URL;
  try {
    target = buildTargetUrl(segments, request.nextUrl.searchParams);
  } catch {
    return apiError(
      500,
      "INTERNAL_ERROR",
      "No se pudo construir la URL del backend.",
    );
  }

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }

  // El backend necesita saber quien es el llamante real.
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = request.headers.get("x-real-ip") ?? forwardedFor;
  if (clientIp) {
    headers.set("x-forwarded-for", clientIp);
  }
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));

  const hasBody = method !== "GET" && method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method,
      headers,
      body,
      redirect: "manual",
      // La peticion es a un servicio interno: no debe cachearse.
      cache: "no-store",
    });
  } catch {
    // El backend no respondio. Se devuelve 503 con el envelope del
    // backend para que el cliente lo trate igual que un fallo de la API.
    return apiError(
      503,
      "SERVICE_UNAVAILABLE",
      "No se pudo contactar con el servicio de lectura. Intenta de nuevo en unos segundos.",
    );
  }

  const responseHeaders = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) {
    responseHeaders.set("content-type", contentType);
  }

  // Cabecera para diagnostico: deja ver que el proxy esta en el camino.
  responseHeaders.set("x-dolynation-proxy", "nextjs");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

/**
 * Next.js App Router: captura cualquier subruta bajo `/api/v1`.
 */
async function handler(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
): Promise<Response> {
  const { path } = await context.params;
  return proxy(request, path ?? []);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const HEAD = handler;
export const OPTIONS = handler;

/**
 * El proxy no debe cachearse: cada peticion refleja el estado actual del
 * backend.
 */
export const dynamic = "force-dynamic";
