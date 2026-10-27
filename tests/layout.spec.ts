import { expect, test, type Page } from '@playwright/test';
import { apri, cerca } from './aiuti';

const PAGINE = ['', '#/prodotto/84-ragu-di-tonno', '#/prodotto/41', '#/prodotto/28', '#/famiglie', '#/famiglia/cioccolato', '#/famiglia/aperitivo'];

async function senzaScrollOrizzontale(page: Page) {
  const eccesso = await page.evaluate(() => {
    const larghezza = document.documentElement.clientWidth;
    const fuori = [...document.querySelectorAll<HTMLElement>('body *')]
      .filter((el) => el.getClientRects().length && el.getBoundingClientRect().right > larghezza + 1)
      .map((el) => el.className || el.tagName);
    return { scroll: document.documentElement.scrollWidth - larghezza, fuori: fuori.slice(0, 5) };
  });
  expect(eccesso.scroll, `elementi che sbordano: ${eccesso.fuori.join(', ')}`).toBeLessThanOrEqual(0);
}

for (const percorso of PAGINE) {
  test(`nessuno scroll orizzontale: ${percorso || 'ricerca'}`, async ({ page }) => {
    await apri(page, percorso);
    if (!percorso) await cerca(page, 'Casa Iuorio');
    await senzaScrollOrizzontale(page);
  });
}

test('aree toccabili di almeno 44×44 px', async ({ page }) => {
  for (const percorso of ['', '#/prodotto/84-ragu-di-tonno', '#/famiglia/aperitivo']) {
    await apri(page, percorso);
    if (!percorso) await cerca(page, 'ragu');
    const piccoli = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('a[href], button, input')]
        .filter((el) => el.getClientRects().length && !el.closest('[hidden]') && !el.classList.contains('salta'))
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.width > 0 && (r.height < 44 || r.width < 44))
        .map(({ el, r }) => `${el.textContent?.trim().slice(0, 30) || el.className} ${Math.round(r.width)}×${Math.round(r.height)}`));
    expect(piccoli, `in ${percorso || 'ricerca'}`).toEqual([]);
  }
});

test('campo di ricerca a 16 px o più (niente zoom su iOS) e prezzi a cifre tabellari', async ({ page }) => {
  await apri(page, '#/prodotto/84-ragu-di-tonno');
  const corpo = await page.getByLabel('Cerca un prodotto').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(corpo).toBeGreaterThanOrEqual(16);
  const cifre = await page.locator('.prezzo-grande, .chip-prezzo').evaluateAll((els) =>
    els.every((el) => getComputedStyle(el).fontVariantNumeric.includes('tabular-nums')));
  expect(cifre).toBe(true);
});

test('su iPhone la ricerca resta fissata in alto mentre scorri', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 768, 'solo iPhone');
  await apri(page);
  await cerca(page, 'Casa Iuorio');
  await page.mouse.wheel(0, 1200);
  await page.evaluate(() => window.scrollTo(0, 1200));
  const alto = await page.locator('.barra-ricerca').evaluate((el) => el.getBoundingClientRect().top);
  expect(alto).toBeLessThanOrEqual(1);
  await expect(page.getByLabel('Cerca un prodotto')).toBeInViewport();
});
