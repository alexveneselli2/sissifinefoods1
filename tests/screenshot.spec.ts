import { test } from '@playwright/test';
import { apri, cerca, risultati, telefono } from './aiuti';

// Screenshot per la revisione: finiscono in screenshot/<formato>-<schermata>.png (non nel repository).
for (const tema of ['light', 'dark'] as const) {
  test(`screenshot ${tema === 'light' ? 'tema chiaro' : 'tema scuro'}`, async ({ page }, info) => {
    await page.emulateMedia({ colorScheme: tema });
    const nome = (s: string) => `screenshot/${info.project.name}-${tema === 'light' ? 'chiaro' : 'scuro'}-${s}.png`;

    await apri(page);
    await page.screenshot({ path: nome('1-inizio') });
    await cerca(page, 'ragu');
    await page.getByLabel('Cerca un prodotto').blur();
    await page.screenshot({ path: nome('2-ricerca') });
    await risultati(page).filter({ hasText: 'Ragù di tonno' }).click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: nome('3-scheda') });
    if (telefono(page)) await page.screenshot({ path: nome('3-scheda-intera'), fullPage: true });
    await apri(page, '#/prodotto/41');
    await page.screenshot({ path: nome('4-bevanda') });
    await apri(page, '#/famiglia/aperitivo');
    await page.screenshot({ path: nome('5-famiglia') });
    await apri(page, '#/famiglie');
    await page.screenshot({ path: nome('6-famiglie') });
  });
}
