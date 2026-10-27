import { defineConfig } from '@playwright/test';

// I quattro formati del collaudo: iPhone 15, iPad verticale e orizzontale, Sunmi 15,6" della cassa.
export const FORMATI = {
  iphone: { width: 393, height: 852 },
  'ipad-verticale': { width: 820, height: 1180 },
  'ipad-orizzontale': { width: 1180, height: 820 },
  sunmi: { width: 1920, height: 1080 },
} as const;

const PORTA = 4173;

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORTA}/sissifinefoods1/`,
    browserName: 'chromium',
    locale: 'it-IT',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'iphone', use: { viewport: FORMATI.iphone, deviceScaleFactor: 3, isMobile: true, hasTouch: true } },
    { name: 'ipad-verticale', use: { viewport: FORMATI['ipad-verticale'], deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
    { name: 'ipad-orizzontale', use: { viewport: FORMATI['ipad-orizzontale'], deviceScaleFactor: 2, isMobile: true, hasTouch: true } },
    { name: 'sunmi', use: { viewport: FORMATI.sunmi, deviceScaleFactor: 1, hasTouch: true } },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORTA} --strictPort`,
    url: `http://localhost:${PORTA}/sissifinefoods1/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
