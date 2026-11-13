import fs from "node:fs";
import { chromium, defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const IS_LIVE_BACKEND = process.env.E2E_TARGET === "backend";

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
      testIgnore: IS_LIVE_BACKEND ? undefined : /live-backend\.spec\.ts/,
    },
  ],
  webServer:
    process.env.PLAYWRIGHT_SKIP_WEBSERVER === "1"
      ? undefined
      : {
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
});
