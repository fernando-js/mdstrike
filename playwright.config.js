import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:8088",
    headless: true,
    viewport: { width: 1536, height: 1040 },
    launchOptions: { channel: "chrome" },
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:8088",
    reuseExistingServer: true,
    timeout: 15000,
  },
  reporter: "list",
  outputDir: "/private/tmp/mdstrike-test-results",
});
