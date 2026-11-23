import fs from "node:fs";
import { chromium, defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const IS_LIVE_BACKEND = process.env.E2E_TARGET === "backend";

// El modo offline necesita el **build de produccion**: el service worker
// solo se registra en produccion (en desarrollo no, para no cachear el
// codigo que se esta editando). Por eso tiene su propio servidor.
const OFFLINE_PORT = Number(process.env.PLAYWRIGHT_OFFLINE_PORT ?? 3200);
const OFFLINE_BASE_URL =
  process.env.PLAYWRIGHT_OFFLINE_BASE_URL ?? `http://127.0.0.1:${OFFLINE_PORT}`;

function resolveChromiumExecutablePath(): string | undefined {
  const fromEnv = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
  if (fromEnv && fs.existsSync(fromEnv)) {
    return fromEnv;
  }

  const managedPath = chromium.executablePath();
  if (managedPath && fs.existsSync(managedPath)) {
    return undefined;
  }

  if (fs.existsSync("/usr/bin/chromium")) {
    return "/usr/bin/chromium";
  }

  return undefined;
}

const executablePath = resolveChromiumExecutablePath();

export default defineConfig({
  testDir: "./e2e",
  // Next.js dev server compiles routes lazily; serial execution prevents
  // concurrent cold-compilation HMR reloads that abort in-flight navigations.
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    launchOptions: executablePath ? { executablePath } : undefined,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      // El modo offline va en su propio proyecto (contra el build de
      // produccion), asi que aqui se excluye.
      testIgnore: [
        ...(IS_LIVE_BACKEND ? [] : [/live-backend\.spec\.ts/]),
        /offline.*\.spec\.ts/,
      ],
    },
    {
      // El modo offline, contra el build de produccion (con el service
      // worker registrado): el unico sitio donde se puede comprobar que la
      // app arranca sin servidor.
      name: "offline",
      use: { ...devices["Desktop Chrome"], baseURL: OFFLINE_BASE_URL },
      testMatch: /offline.*\.spec\.ts/,
    },
  ],
  webServer:
    process.env.PLAYWRIGHT_SKIP_WEBSERVER === "1"
      ? undefined
      : [
          {
            command: `npx next dev --webpack --hostname 127.0.0.1 --port ${PORT}`,
            env: {
              ...process.env,
              NODE_OPTIONS: [
                process.env.NODE_OPTIONS,
                "--dns-result-order=ipv4first",
              ]
                .filter(Boolean)
                .join(" "),
              NEXT_DIST_DIR:
                process.env.PLAYWRIGHT_NEXT_DIST_DIR ?? ".next-playwright",
            },
            url: `${BASE_URL}/login`,
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
          },
          // El servidor del modo offline: el **build de produccion** (con el
          // service worker registrado).
          {
            // El build `standalone` no incluye `public/` ni `.next/static`:
            // los copia el Dockerfile. Aqui, lo mismo (si no, los assets
            // devuelven 404 y la app no arranca).
            command:
              "npm run build && rm -rf .next/standalone/public .next/standalone/.next/static && mkdir -p .next/standalone/public && cp -r public/. .next/standalone/public/ && cp -r .next/static .next/standalone/.next/static && node .next/standalone/server.js",
            env: {
              ...process.env,
              PORT: String(OFFLINE_PORT),
              HOSTNAME: "127.0.0.1",
              NODE_ENV: "production",
            },
            url: `${OFFLINE_BASE_URL}/login`,
            reuseExistingServer: !process.env.CI,
            timeout: 240_000,
          },
        ],
});
