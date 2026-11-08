#!/usr/bin/env node
/**
 * Genera `public/version.json` con la version del build.
 *
 * Lo ejecuta el build de la imagen (ver Dockerfile). Los valores llegan por
 * variables de entorno:
 *
 *   APP_VERSION  la version UNICA de la aplicacion (la del manifiesto)
 *   COMPONENT    que pieza de la aplicacion es este
 *   GIT_COMMIT   el SHA del codigo desplegado
 *   BUILT_AT     cuando se construyo el artefacto
 *
 * La version de ESTE repositorio sale del package.json.
 *
 * El archivo se escribe en `public/` porque Next.js lo sirve tal cual en
 * `/version.json`. No se versiona: sus valores cambian en cada build.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const version = {
  appVersion: process.env.APP_VERSION || '0.0.0-dev',
  component: process.env.COMPONENT || 'dolynation-tonatiuh-front',
  version: pkg.version || '0.0.0-dev',
  commit: process.env.GIT_COMMIT || 'unknown',
  builtAt: process.env.BUILT_AT || new Date().toISOString(),
};

const target = join(root, 'public', 'version.json');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(version, null, 2)}\n`);

console.log(`[version] ${target}: ${version.appVersion} (${version.commit})`);
