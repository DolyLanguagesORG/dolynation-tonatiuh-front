import type { NextConfig } from 'next';
import withFlowbiteReact from 'flowbite-react/plugin/nextjs';

const nextConfig: NextConfig = {
  // `standalone` genera en `.next/standalone` un server minimo con solo lo
  // que la app necesita en runtime (sin node_modules completo). Es lo que
  // hace posible una imagen de produccion petite.
  output: 'standalone',
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
