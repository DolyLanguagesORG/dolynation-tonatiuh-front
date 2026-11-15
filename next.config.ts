import type { NextConfig } from 'next';
import withFlowbiteReact from 'flowbite-react/plugin/nextjs';

/**
 * Origins desde los que se permite el dev server.
 *
 * Next 16 bloquea los recursos cross-site del dev server (`/_next/*`) cuando
 * el `Origin` de la peticion no esta en `allowedDevOrigins`. El websocket de
 * HMR (`/_next/hmr`) tambien: Next responde con un 403 **sin cabeceras HTTP**
 * (escribe "Unauthorized" crudo en el socket), y el proxy de Cloudflare lo
 * traduce a un **520**, que el navegador reporta como:
 *
 *   WebSocket connection to 'wss://.../_next/hmr' failed
 *
 * El host publico de desarrollo entra por variable (`NEXT_ALLOWED_DEV_ORIGINS`)
 * para que cambiar de dominio no obligue a tocar codigo. Admite comodines:
 * `**.yacaterkos.tech` matchea cualquier subdominio (no el apex).
 *
 * Solo aplica al dev server: en rehearsal, staging y produccion la app corre
 * compilada (`output: 'standalone'`), sin HMR y sin websocket.
 */
const allowedDevOrigins = [
  'localhost',
  'localhost:3000',
  '127.0.0.1',
  '127.0.0.1:3000',
  ...(process.env.NEXT_ALLOWED_DEV_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? []),
];

const nextConfig: NextConfig = {
  ...(process.env.NEXT_DIST_DIR?.trim()
    ? { distDir: process.env.NEXT_DIST_DIR.trim() }
    : {}),
  // `standalone` genera en `.next/standalone` un server minimo con solo lo
  // que la app necesita en runtime (sin node_modules completo). Es lo que
  // hace posible una imagen de produccion petite.
  output: 'standalone',
  // Los documentos legales (privacidad, terminos, soporte) se leen del disco
  // en el servidor: sin esto, el build `standalone` no los incluye en la
  // imagen y las rutas /terms, /privacy y /support darian 404 en produccion.
  outputFileTracingIncludes: {
    '/terms': ['./src/i18n/content/**/*.md'],
    '/privacy': ['./src/i18n/content/**/*.md'],
    '/support': ['./src/i18n/content/**/*.md'],
  },
  // De develop: el host publico de desarrollo entra por variable
  // (`NEXT_ALLOWED_DEV_ORIGINS`), no hardcodeado. La rama traia las IPs de su
  // maquina (192.168.1.7, 192.168.98.86): con la variable, cambiar de dominio
  // no obliga a tocar codigo.
  allowedDevOrigins,
  experimental: {
    // Desactiva el auto-upgrade experimental en segundo plano que falla en Windows
    // al invocar npx next upgrade --agent=security
    agentUpgrade: false,
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default withFlowbiteReact(nextConfig);
