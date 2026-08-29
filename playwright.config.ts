import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(__dirname, ".env.local") });
config({ path: path.resolve(__dirname, ".env") });

const baseURL = (process.env.TEST_BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Use system Chrome by default (avoids flaky headless-shell downloads).
        // Override with PW_CHANNEL=msedge|chromium or PW_CHANNEL= to unset.
        channel:
          process.env.PW_CHANNEL === ""
            ? undefined
            : process.env.PW_CHANNEL || "chrome",
      },
    },
  ],
  webServer: process.env.PW_WEB_SERVER
    ? {
        command: "npm run start",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
});
