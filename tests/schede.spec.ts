import { expect, test } from '@playwright/test';
import dati from '../data/abbinamenti.json' with { type: 'json' };
import { apri, titolo } from './aiuti';

// Controlli sui contenuti: bastano su un formato.
test.beforeEach(({}, info) => { test.skip(info.project.name !== 'sunmi', 'contenuti verificati sul formato Sunmi'); });

test(`tutti i ${dati.prodotti.length} prodotti mostrano "Da evitare" e ogni gruppo ha il suo Perché`, async ({ page }) => {
  expect(dati.prodotti).toHaveLength(127);
  await apri(page);
  for (const p of dati.prodotti) {
    await page.evaluate((id) => { location.hash = `#/prodotto/${id}`; }, p.id);
    await expect(titolo(page)).toHaveText(p.nome);
    const evitare = page.locator('.sezione-evitare .gruppo');
    expect(await evitare.count(), `${p.nome}: gruppi da evitare`).toBeGreaterThan(0);
    const gruppi = page.locator('#vista .gruppo');
    const senzaPerche = await gruppi.evaluateAll((els) =>
      els.filter((g) => !g.querySelector('.perche .perche-etichetta')?.textContent?.includes('Perché')).length);
    expect(senzaPerche, `${p.nome}: gruppi senza Perché`).toBe(0);
    // l'indirizzo ha la forma #/prodotto/84-ragu-di-tonno
    expect(new URL(page.url()).hash).toMatch(new RegExp(`^#/prodotto/${p.id}-[a-z0-9-]+$`));
  }
});

test('scheda di un cibo: intestazione e gruppi giusti', async ({ page }) => {
  await apri(page, '#/prodotto/84');
  await expect(titolo(page)).toHaveText('Ragù di tonno');
  await expect(page).toHaveURL(/#\/prodotto\/84-ragu-di-tonno$/);
  const v = page.locator('#vista');
  await expect(v.locator('.tipo')).toContainText('Cibo');
  await expect(v.locator('.prezzo-grande')).toHaveText(/6,10\s€/);
  await expect(v.locator('.tilby')).toContainText('In Tilby: RAGU DI TONNO');
  await expect(v.getByRole('heading', { name: 'Abbinalo con' })).toBeVisible();
  await expect(v.getByRole('heading', { name: 'Vini e bevande' })).toBeVisible();
  await expect(v.getByRole('heading', { name: 'Da evitare' })).toBeVisible();
});

test('scheda di una bevanda: "Cibi da abbinare" e "Stanno bene vicino"', async ({ page }) => {
  await apri(page, '#/prodotto/41');
  const v = page.locator('#vista');
  await expect(v.locator('.tipo')).toContainText('Bevanda · Rossi strutturati');
  await expect(v.getByRole('heading', { name: 'Cibi da abbinare' })).toBeVisible();
  await expect(v.getByRole('heading', { name: 'Stanno bene vicino' })).toBeVisible();
});

test('prezzo mancante: "prezzo da fare"', async ({ page }) => {
  const senza = dati.prodotti.find((p) => p.prezzo === null)!;
  await apri(page, `#/prodotto/${senza.id}`);
  await expect(page.locator('.prezzo-grande')).toHaveText('prezzo da fare');
});

test('oltre 14 prodotti: "e altri N" si espande', async ({ page }) => {
  const gruppi = ['abbinaConCibi', 'viniEBevande', 'cibiDaAbbinare', 'stannoBeneVicino', 'daEvitare'] as const;
  const p = dati.prodotti.find((x) => gruppi.some((k) => (x[k as keyof typeof x] as { ids: number[] }[] | undefined)?.some((g) => g.ids.length > 14)))!;
  await apri(page, `#/prodotto/${p.id}`);
  const altri = page.locator('#vista .altri').first();
  const testo = await altri.textContent();
  const n = Number(/(\d+)/.exec(testo ?? '')?.[1]);
  const elenco = page.locator('#vista ul.chips').filter({ has: page.locator('.altri') }).first();
  const chips = elenco.locator('.chip');
  await expect(chips).toHaveCount(14);
  const id = await elenco.evaluate((el) => { el.id = 'da-espandere'; return el.id; });
  await altri.click();
  await expect(page.locator(`#${id} .chip`)).toHaveCount(14 + n);
});

test('kit e famiglie in fondo alla scheda', async ({ page }) => {
  await apri(page, '#/prodotto/102');
  const kit = page.locator('#vista .kit').first();
  await expect(kit.locator('.kit-nome')).toHaveText('Aperitivo per due');
  await expect(kit.locator('.kit-prezzo-totale')).toHaveText(/21,10\s€/);
  await expect(page.locator('#vista .sezione-famiglie .pillola').first()).toHaveAttribute('href', /#\/famiglia\//);
});

test('le 12 famiglie: indice e pagine con perché, bevande, da evitare, kit e nota', async ({ page }) => {
  await apri(page, '#/famiglie');
  await expect(page.locator('.carta-famiglia')).toHaveCount(12);
  for (const f of dati.famiglie) {
    await page.evaluate((id) => { location.hash = `#/famiglia/${id}`; }, f.id);
    await expect(titolo(page)).toHaveText(f.nome);
    await expect(page.locator('.intestazione .perche')).toContainText(f.perche);
    await expect(page.locator('.sezione-bevande .gruppo')).toHaveCount(f.bevande.length);
    if (f.daEvitare) await expect(page.locator('.sezione-evitare .perche')).toContainText(f.daEvitare.perche);
    if (f.kit) await expect(page.locator('.kit-nome')).toHaveText(f.kit.nome);
    if (f.nota) await expect(page.locator('.nota')).toHaveText(f.nota);
    const senzaPerche = await page.locator('#vista .gruppo').evaluateAll((els) =>
      els.filter((g) => !g.querySelector('.perche')).length);
    expect(senzaPerche).toBe(0);
  }
});
