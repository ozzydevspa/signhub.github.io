import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  use: {baseURL: 'http://127.0.0.1:4173', viewport: {width: 1280, height: 900}, trace: 'retain-on-failure'},
  webServer: {command: 'node serve.mjs', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI},
  workers: 1,
  reporter: 'list'
});
