import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

/** @type {import("jest").Config} */
const customJestConfig = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: [
    "<rootDir>/src/**/*.test.{ts,tsx}",
    "<rootDir>/tests/unit/**/*.test.{ts,tsx}",
  ],
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/.next/",
    "<rootDir>/.next-playwright/",
    "<rootDir>/e2e/",
  ],
  modulePathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/.next-playwright/"],
  collectCoverageFrom: [
    "src/lib/**/*.{ts,tsx}",
    "src/context/**/*.{ts,tsx}",
    "src/components/auth/**/*.{ts,tsx}",
    "src/components/study/**/*.{ts,tsx}",
    "src/app/**/use-*.{ts,tsx}",
    "!src/**/*.d.ts",
  ],
};

export default async function jestConfig() {
  const generated = await createJestConfig(customJestConfig)();
  return {
    ...generated,
    transformIgnorePatterns: [
      "/node_modules/(?!(debounce|flowbite-react|lucide-react)/)",
      "^.+\\.module\\.(css|sass|scss)$",
    ],
  };
}
