import { expect, test } from '@playwright/test';
import { apri, cerca, risultati, telefono, titolo } from './aiuti';

test('toccando un risultato si apre la scheda; Indietro torna alla ricerca', async ({ page }) => {
  await apri(page);
  await cerca(page, 'ragu');
  await risultati(page).filter({ hasText: 'Ragù di tonno' }).click();
  await expect(titolo(page)).toHaveText('Ragù di tonno');
  if (telefono(page)) {
    await expect(page.locator('.colonna-ricerca')).toBeHidden();
    await expect(page.getByRole('link', { name: 'Ricerca', exact: true })).toBeVisible();
  } else {
    // su tablet risultati e scheda sono visibili insieme
    await expect(risultati(page).first()).toBeVisible();
    await expect(page.locator('.barra-indietro')).toBeHidden();
  }
  await page.goBack();
  await expect(page).not.toHaveURL(/prodotto/);
  await expect(page.locator('.colonna-ricerca')).toBeVisible();
  await expect(page.getByLabel('Cerca un prodotto')).toHaveValue('ragu');
  await expect(risultati(page)).toHaveCount(2);
});

test('toccando un chip si apre la scheda giusta e Indietro torna alla precedente', async ({ page }) => {
  await apri(page, '#/prodotto/84-ragu-di-tonno');
  const chip = page.locator('#vista .chip').first();
  const nome = (await chip.locator('.chip-nome').textContent())!;
  await chip.click();
  await expect(titolo(page)).toHaveText(nome);
  const secondo = page.locator('#vista .chip-bevanda, #vista .chip-cibo').nth(1);
  const nome2 = (await secondo.locator('.chip-nome').textContent())!;
  await secondo.click();
  await expect(titolo(page)).toHaveText(nome2);
  await page.goBack();
  await expect(titolo(page)).toHaveText(nome);
  await page.goBack();
  await expect(titolo(page)).toHaveText('Ragù di tonno');
});

test('"← Ricerca" torna alla ricerca anche dopo vari chip', async ({ page }) => {
  test.skip(!telefono(page), 'il tasto "← Ricerca" c\'è solo su iPhone');
  await apri(page);
  await cerca(page, 'Amarone');
  await risultati(page).first().click();
  await page.locator('#vista .chip').first().click();
  await page.locator('#vista .chip').first().click();
  await page.getByRole('link', { name: 'Ricerca', exact: true }).click();
  await expect(page.locator('.colonna-ricerca')).toBeVisible();
  await expect(page.getByLabel('Cerca un prodotto')).toHaveValue('Amarone');
  await expect(page).not.toHaveURL(/prodotto/);
});

test('Invio apre il primo risultato', async ({ page }) => {
  await apri(page);
  await cerca(page, 'Amarone');
  await page.getByLabel('Cerca un prodotto').press('Enter');
  await expect(titolo(page)).toHaveText('Amarone Brigaldara');
});

test('famiglie: dalla scheda alla famiglia e ritorno', async ({ page }) => {
  await apri(page, '#/prodotto/84-ragu-di-tonno');
  await page.locator('#vista .sezione-famiglie .pillola').first().click();
  await expect(page).toHaveURL(/#\/famiglia\/primi-mare$/);
  await expect(titolo(page)).toHaveText('Primi di mare al pomodoro');
  await page.goBack();
  await expect(titolo(page)).toHaveText('Ragù di tonno');
});

test('un indirizzo condiviso apre direttamente la scheda', async ({ page }) => {
  await apri(page, '#/famiglia/cioccolato');
  await expect(titolo(page)).toHaveText('Cioccolato e frutti rossi');
  await apri(page, '#/prodotto/9999-non-esiste');
  await expect(titolo(page)).toHaveText('Prodotto non trovato');
});
