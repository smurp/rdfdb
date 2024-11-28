// playwright.config.js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  retries: 0,
  testDir: './test/playwright',
  timeout: 2000,
  reporter: 'list',
});
