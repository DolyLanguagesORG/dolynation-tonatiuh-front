import type { NextConfig } from 'next';
import withFlowbiteReact from 'flowbite-react/plugin/nextjs';

const nextConfig: NextConfig = {
  // `standalone` genera en `.next/standalone` un server minimo con solo lo
  // que la app necesita en runtime (sin node_modules completo). Es lo que
  // hace posible una imagen de produccion petite.
  output: 'standalone',
  allowedDevOrigins: [
    '192.168.1.7',
    '192.168.1.7:3000',
    '192.168.98.86',
    '192.168.98.86:3000',
    'localhost',
    'localhost:3000',
    '127.0.0.1',
    '127.0.0.1:3000',
  ],
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
