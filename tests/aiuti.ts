import { expect, type Page } from '@playwright/test';

export const telefono = (page: Page) => (page.viewportSize()?.width ?? 0) < 768;

export async function apri(page: Page, percorso = '') {
  await page.goto(percorso);
  await expect(page.locator('body.pronto')).toBeAttached();
}

export async function cerca(page: Page, testo: string) {
  await page.getByLabel('Cerca un prodotto').fill(testo);
}

export const risultati = (page: Page) => page.locator('#risultati .risultato');
export const titolo = (page: Page) => page.locator('#vista h1');
