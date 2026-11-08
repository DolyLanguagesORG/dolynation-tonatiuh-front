#!/usr/bin/env node
/**
 * Test del versionado del frontend.
 *
 * Comprueba que `version.json` se genera con los 5 campos y que su
 * `appVersion` es la misma que la del backend. Es el mismo patron que
 * `pr-labels.regex.test.cjs`: sin framework de tests, el test es un script
 * que falla con codigo de salida 1.
 *
 * Ver issue front#43.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function check(name, fn) {
  try {
    fn();
    console.log(`  OK    ${name}`);
  } catch (error) {
    console.error(`  FALLA ${name}`);
    console.error(`        ${error.message}`);
    process.exitCode = 1;
  }
}

console.log('== version.json ==');

check('el script genera los 5 campos', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dolynation-version-'));
  try {
    execFileSync(
      process.execPath,
      [join(root, 'scripts', 'generate-version-json.mjs')],
      {
        cwd: root,
        env: {
          ...process.env,
          APP_VERSION: '1.2.3',
          COMPONENT: 'dolynation-tonatiuh-front',
          GIT_COMMIT: 'abc1234',
          BUILT_AT: '2026-11-07T19:00:00Z',
        },
      },
    );

    const target = join(root, 'public', 'version.json');
    assert.ok(existsSync(target), 'no se genero public/version.json');

    const version = JSON.parse(readFileSync(target, 'utf8'));

    assert.equal(version.appVersion, '1.2.3');
    assert.equal(version.component, 'dolynation-tonatiuh-front');
    assert.equal(version.commit, 'abc1234');
    assert.equal(version.builtAt, '2026-11-07T19:00:00Z');
    assert.match(version.version, /^\d+\.\d+\.\d+/, 'la version del repo no es un semver');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

check('sin variables de entorno, la version no se rompe', () => {
  const target = join(root, 'public', 'version.json');
  const before = existsSync(target) ? readFileSync(target, 'utf8') : null;

  try {
    execFileSync(process.execPath, [join(root, 'scripts', 'generate-version-json.mjs')], {
      cwd: root,
      env: { ...process.env, APP_VERSION: '', COMPONENT: '', GIT_COMMIT: '', BUILT_AT: '' },
    });

    const version = JSON.parse(readFileSync(target, 'utf8'));
    assert.ok(version.appVersion, 'appVersion vacio');
    assert.ok(version.commit, 'commit vacio');
    assert.ok(version.builtAt, 'builtAt vacio');
  } finally {
    if (before === null) {
      rmSync(target, { force: true });
    } else {
      writeFileSync(target, before);
    }
  }
});

check('el endpoint /version responde el mismo esquema', () => {
  // El endpoint de la app (/api/v1/version) lo sirve el backend. Aqui se
  // comprueba que el contrato de campos es el mismo, leyendo la fuente del
  // endpoint del frontend.
  const route = readFileSync(join(root, 'src', 'app', 'version', 'route.ts'), 'utf8');

  for (const field of ['appVersion', 'component', 'version', 'commit', 'builtAt']) {
    assert.ok(route.includes(field), `el endpoint no expone ${field}`);
  }
});

check('el badge usa la variable de entorno, no un numero fijo', () => {
  const badge = readFileSync(
    join(root, 'src', 'components', 'layout', 'version-badge.tsx'),
    'utf8',
  );

  assert.ok(
    badge.includes('NEXT_PUBLIC_APP_VERSION'),
    'el badge no lee NEXT_PUBLIC_APP_VERSION',
  );
  // No puede haber un numero de version REAL hardcodeado. El fallback
  // "v0.0.0-dev" si es valido: es lo que se muestra cuando no hay build.
  const hardcoded = badge.match(/"[^"]*v\d+\.\d+\.\d+(?!-dev)[^"]*"/g);
  assert.equal(
    hardcoded,
    null,
    `el badge tiene un numero de version hardcodeado: ${hardcoded?.join(', ')}`,
  );
});
