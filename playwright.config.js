// Browser checks for hotdaw.gs, in Chrome's engine (Chromium), Firefox and Safari's (WebKit).
// Build the site first (jekyll build), then: npm test
// The tests serve the built _site folder themselves. To test another copy instead, set
// SITE_DIR=path/to/built/site, or BASE_URL=http://... for one that's already running.
const { defineConfig } = require("@playwright/test");

const port = 4173;
const baseURL = process.env.BASE_URL || `http://127.0.0.1:${port}`;

module.exports = defineConfig({
  testDir: "tests",
  outputDir: "test-results",
  reporter: [["list"]],
  timeout: 60000,
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
  use: { baseURL },
  webServer: process.env.BASE_URL ? undefined : {
    command: `python3 tests/serve.py "${process.env.SITE_DIR || "_site"}" ${port}`,
    url: baseURL,
    reuseExistingServer: true,
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
});
