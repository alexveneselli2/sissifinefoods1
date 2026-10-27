import { expect, test } from '@playwright/test';
import { apri, cerca, risultati } from './aiuti';

test.beforeEach(async ({ page }) => { await apri(page); });

test('"Casa Iuorio" trova 19 prodotti', async ({ page }) => {
  await cerca(page, 'Casa Iuorio');
  await expect(risultati(page)).toHaveCount(19);
  await expect(page.locator('#stato')).toHaveText('19 prodotti');
});

test('"piccante" trova la Salsa Osé (piccante)', async ({ page }) => {
  await cerca(page, 'piccante');
  await expect(risultati(page).filter({ hasText: 'Salsa Osé (piccante)' })).toHaveCount(1);
});

test('"bollicine" trova 5 bevande: 4 bollicine secche e l\'Asti', async ({ page }) => {
  await cerca(page, 'bollicine');
  await expect(risultati(page)).toHaveCount(5);
  await expect(page.locator('#risultati .segno-bevanda')).toHaveCount(5);
  await expect(risultati(page).filter({ hasText: 'Asti Bel Piasi' })).toHaveCount(1);
});

test('"ragu" trova i due ragù, senza badare agli accenti', async ({ page }) => {
  await cerca(page, 'ragu');
  await expect(page.locator('#risultati .risultato-nome')).toHaveText(['Ragù di pesce spada', 'Ragù di tonno']);
  await cerca(page, 'RAGÙ');
  await expect(risultati(page)).toHaveCount(2);
});

test('con più parole servono tutte', async ({ page }) => {
  await cerca(page, 'tonno');
  const tutti = await risultati(page).count();
  await cerca(page, 'tonno mentuccia');
  await expect(risultati(page)).toHaveCount(1);
  expect(tutti).toBeGreaterThan(1);
});

test('ordine: prima il nome che inizia con il testo, poi quello che lo contiene', async ({ page }) => {
  await cerca(page, 'tonno');
  const nomi = await page.locator('#risultati .risultato-nome').allTextContents();
  const inizia = nomi.map((n) => n.toLowerCase().startsWith('tonno'));
  // tutti i "true" vengono prima di tutti i "false"
  expect(inizia.indexOf(false) === -1 || inizia.lastIndexOf(true) < inizia.indexOf(false)).toBe(true);
  const iniziano = nomi.filter((_, i) => inizia[i]);
  expect(iniziano).toEqual([...iniziano].sort((a, b) => a.localeCompare(b, 'it')));
});

test('ogni risultato mostra nome, marca, prezzo e il segno cibo/bevanda', async ({ page }) => {
  await cerca(page, 'Amarone');
  const r = risultati(page).first();
  await expect(r.locator('.risultato-nome')).toHaveText('Amarone Brigaldara');
  await expect(r.locator('.risultato-marca')).toContainText('Brigaldara');
  await expect(r.locator('.risultato-prezzo')).toHaveText(/37,50\s€/);
  await expect(r.locator('.segno-bevanda')).toHaveCount(1);
});

test('le scorciatoie lanciano la ricerca', async ({ page }) => {
  await page.locator('.scorciatoie').getByRole('button', { name: 'fondente' }).click();
  await expect(page.getByLabel('Cerca un prodotto')).toHaveValue('fondente');
  await expect(risultati(page).first()).toBeVisible();
});

test('se non trova nulla dà un suggerimento utile', async ({ page }) => {
  await cerca(page, 'zzzz');
  await expect(risultati(page)).toHaveCount(0);
  await expect(page.locator('#stato')).toContainText('Prova con una parola sola o con la marca');
});
