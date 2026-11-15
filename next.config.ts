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
