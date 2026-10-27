import { expect, test } from '@playwright/test';
import { apri, cerca, risultati, titolo } from './aiuti';

test('funziona offline dopo la prima visita', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'iphone' && info.project.name !== 'sunmi', 'basta su telefono e cassa');
  await apri(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((ok) => navigator.serviceWorker.addEventListener('controllerchange', ok, { once: true }));
    }
  });
  await context.setOffline(true);
  const inizio = Date.now();
  await page.reload();
  await expect(page.locator('body.pronto')).toBeAttached();
  // senza rete il listino deve comparire subito, non dopo l'attesa della rete
  expect(Date.now() - inizio).toBeLessThan(3000);
  await cerca(page, 'ragu');
  await expect(risultati(page)).toHaveCount(2);
  await risultati(page).first().click();
  await expect(titolo(page)).toHaveText('Ragù di pesce spada');
  // i font arrivano dalla cache
  const font = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('500 20px "Bodoni Moda"'); });
  expect(font).toBe(true);
  await context.setOffline(false);
});

test('manifest, icone e service worker per l\'installazione', async ({ page, request }) => {
  await apri(page);
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  const manifest = await (await request.get(href!)).json();
  expect(manifest.display).toBe('standalone');
  expect(manifest.start_url).toBe('./');
  for (const icona of manifest.icons) {
    const r = await request.get(new URL(icona.src, new URL(href!, page.url())).href);
    expect(r.ok(), icona.src).toBe(true);
  }
  // Chrome conferma che il sito si può installare (aggiungi a schermata Home)
  await page.evaluate(() => navigator.serviceWorker.ready);
  const cdp = await page.context().newCDPSession(page);
  const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
  expect(installabilityErrors).toEqual([]);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', /apple-touch-icon\.png$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  expect((await request.get('robots.txt')).ok()).toBe(true);
});
