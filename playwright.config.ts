import { defineConfig, devices } from "@playwright/test";

const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const mobilePlatformSuite = /mobile-platform\.spec\.ts/;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: externalBaseURL ?? "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop",
      testIgnore: mobilePlatformSuite,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "android-current",
      use: { ...devices["Galaxy S24"] },
    },
    {
      name: "ios-current",
      use: { ...devices["iPhone 16"] },
    },
    {
      name: "android-compact",
      testMatch: mobilePlatformSuite,
      use: { ...devices["Galaxy S9+"] },
    },
    {
      name: "android-landscape",
      testMatch: mobilePlatformSuite,
      use: { ...devices["Pixel 8 landscape"] },
    },
    {
      name: "ios-compact",
      testMatch: mobilePlatformSuite,
      use: { ...devices["iPhone SE (3rd gen)"] },
    },
    {
      name: "ios-landscape",
      testMatch: mobilePlatformSuite,
      use: { ...devices["iPhone 16 landscape"] },
    },
  ],
  webServer: externalBaseURL
    ? undefined
    : {
        command: process.env.CI
          ? "npm run build -- --webpack && npm start -- --hostname 127.0.0.1 --port 3100"
          : "npm run dev -- --hostname 127.0.0.1 --port 3100",
        url: "http://127.0.0.1:3100",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
