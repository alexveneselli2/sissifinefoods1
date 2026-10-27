// Aggiorna i prezzi di data/abbinamenti.json da un export di Tilby (.xlsx).
// Uso: npm run aggiorna-prezzi -- percorso/export.xlsx
//
// Cerca i prodotti per ID (colonna "ID") e legge il prezzo dalla colonna "Prezzo 1" (es. "4,90 €").
// Cambia solo il campo "prezzo": non aggiunge e non cancella mai prodotti.
// L'export di Tilby contiene anche i costi: non metterlo mai nel repository.
import ExcelJS from 'exceljs';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const FILE_DATI = resolve('data/abbinamenti.json');
const percorso = process.argv[2];

if (!percorso) {
  console.error('Manca il file. Uso: npm run aggiorna-prezzi -- percorso/export.xlsx');
  process.exit(1);
}

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
const mostra = (v) => (v == null ? 'prezzo da fare' : euro.format(v));

/** "4,90 €" → 4.9; "1.234,50 €" → 1234.5; vuoto → null */
function leggiPrezzo(valore) {
  if (valore == null || valore === '') return null;
  if (typeof valore === 'number') return Math.round(valore * 100) / 100;
  if (typeof valore === 'object' && 'result' in valore) return leggiPrezzo(valore.result);
  const testo = String(valore).replace(/[€\s ]/g, '').replace(/\./g, '').replace(',', '.');
  if (testo === '') return null;
  const numero = Number(testo);
  return Number.isFinite(numero) ? Math.round(numero * 100) / 100 : undefined;
}

function testoCella(valore) {
  if (valore == null) return '';
  if (typeof valore === 'object') {
    if ('richText' in valore) return valore.richText.map((r) => r.text).join('');
    if ('result' in valore) return String(valore.result ?? '');
    if ('text' in valore) return String(valore.text);
  }
  return String(valore);
}

// ---------- lettura dell'export ----------

const libro = new ExcelJS.Workbook();
try {
  await libro.xlsx.readFile(percorso);
} catch (errore) {
  console.error(`Non riesco a leggere ${percorso}: ${errore.message}`);
  process.exit(1);
}

let foglio, colonne;
for (const f of libro.worksheets) {
  for (let r = 1; r <= Math.min(f.rowCount, 10); r++) {
    const intestazioni = new Map();
    f.getRow(r).eachCell((cella, c) => intestazioni.set(testoCella(cella.value).trim().toLowerCase(), c));
    if (intestazioni.has('id') && intestazioni.has('prezzo 1')) {
      foglio = f;
      colonne = { riga: r, id: intestazioni.get('id'), nome: intestazioni.get('nome'), prezzo: intestazioni.get('prezzo 1') };
      break;
    }
  }
  if (foglio) break;
}
if (!foglio) {
  console.error('Nel file non trovo le colonne "ID" e "Prezzo 1". È un export degli articoli di Tilby?');
  process.exit(1);
}

const tilby = new Map();
const illeggibili = [];
for (let r = colonne.riga + 1; r <= foglio.rowCount; r++) {
  const riga = foglio.getRow(r);
  const id = Number(testoCella(riga.getCell(colonne.id).value).trim());
  if (!Number.isInteger(id) || id <= 0) continue;
  const nome = colonne.nome ? testoCella(riga.getCell(colonne.nome).value).trim() : '';
  const grezzo = riga.getCell(colonne.prezzo).value;
  const prezzo = leggiPrezzo(typeof grezzo === 'object' && grezzo && !('result' in grezzo) ? testoCella(grezzo) : grezzo);
  if (prezzo === undefined) {
    illeggibili.push(`${id} ${nome}: "${testoCella(grezzo)}"`);
    continue;
  }
  tilby.set(id, { nome, prezzo });
}

// ---------- aggiornamento del JSON ----------
// Si cambia solo la riga "prezzo" di ogni prodotto, così il resto del file resta identico.

let testo = await readFile(FILE_DATI, 'utf8');
const dati = JSON.parse(testo);
const nelJson = new Map(dati.prodotti.map((p) => [p.id, p]));

// formato dei numeri come nel file: 4.9, 23.0
const scrivi = (v) => (v == null ? 'null' : Number.isInteger(v) ? `${v}.0` : String(v));

const cambiati = [];
for (const p of dati.prodotti) {
  const t = tilby.get(p.id);
  if (!t || t.prezzo === p.prezzo) continue;
  const prodotto = new RegExp(`(\\n  \\{\\n   "id": ${p.id},\\n[\\s\\S]*?\\n   "prezzo": )([^,\\n]+)(,)`);
  if (!prodotto.test(testo)) {
    console.error(`Non trovo il prezzo del prodotto ${p.id} nel file: niente è stato salvato.`);
    process.exit(1);
  }
  testo = testo.replace(prodotto, `$1${scrivi(t.prezzo)}$3`);
  cambiati.push({ p, prima: p.prezzo, dopo: t.prezzo });
}

// controllo di sicurezza: deve cambiare solo il prezzo
const nuovo = JSON.parse(testo);
for (const p of nuovo.prodotti) {
  const vecchio = nelJson.get(p.id);
  const atteso = tilby.has(p.id) ? tilby.get(p.id).prezzo : vecchio.prezzo;
  if (p.prezzo !== atteso || JSON.stringify({ ...p, prezzo: 0 }) !== JSON.stringify({ ...vecchio, prezzo: 0 })) {
    console.error(`Controllo fallito sul prodotto ${p.id}: niente è stato salvato.`);
    process.exit(1);
  }
}
if (nuovo.prodotti.length !== dati.prodotti.length) {
  console.error('Il numero di prodotti è cambiato: niente è stato salvato.');
  process.exit(1);
}

if (cambiati.length) await writeFile(FILE_DATI, testo);

// ---------- report ----------

const titolo = (t) => console.log(`\n${t}\n${'─'.repeat(t.length)}`);

titolo(`Prezzi cambiati: ${cambiati.length}`);
for (const { p, prima, dopo } of cambiati) {
  console.log(`  ${String(p.id).padStart(4)}  ${p.nome.padEnd(42)} ${mostra(prima).padStart(14)} → ${mostra(dopo)}`);
}

const nuovi = [...tilby].filter(([id]) => !nelJson.has(id));
titolo(`In Tilby ma non negli abbinamenti (prodotti nuovi da classificare): ${nuovi.length}`);
for (const [id, t] of nuovi) console.log(`  ${String(id).padStart(4)}  ${t.nome.padEnd(42)} ${mostra(t.prezzo)}`);

const spariti = dati.prodotti.filter((p) => !tilby.has(p.id));
titolo(`Negli abbinamenti ma non più in Tilby: ${spariti.length}`);
for (const p of spariti) console.log(`  ${String(p.id).padStart(4)}  ${p.nome}`);

const daFare = nuovo.prodotti.filter((p) => p.prezzo == null);
if (daFare.length) {
  titolo(`Ancora senza prezzo: ${daFare.length}`);
  for (const p of daFare) console.log(`  ${String(p.id).padStart(4)}  ${p.nome}`);
}

// I totali dei kit sono scritti nel JSON: se i prezzi cambiano, vanno ricontrollati a mano.
const prezzi = new Map(nuovo.prodotti.map((p) => [p.id, p.prezzo]));
const kitDaRivedere = nuovo.famiglie.filter((f) => f.kit).map((f) => {
  const somma = f.kit.prodotti.reduce((s, { id, quantita }) => s + (prezzi.get(id) ?? NaN) * quantita, 0);
  return { kit: f.kit, somma: Math.round(somma * 100) / 100 };
}).filter(({ kit, somma }) => kit.totale !== somma);
if (kitDaRivedere.length) {
  titolo(`Kit con il totale da ricontrollare: ${kitDaRivedere.length}`);
  for (const { kit, somma } of kitDaRivedere) {
    console.log(`  ${kit.nome.padEnd(42)} totale ${mostra(kit.totale)}, somma dei prezzi ${Number.isNaN(somma) ? 'non calcolabile' : mostra(somma)}`);
  }
}

if (illeggibili.length) {
  titolo(`Righe con un prezzo che non riesco a leggere: ${illeggibili.length}`);
  for (const r of illeggibili) console.log(`  ${r}`);
}

console.log(cambiati.length
  ? `\nSalvato ${FILE_DATI}. Ora fai commit e push del solo data/abbinamenti.json.`
  : '\nNessun prezzo da aggiornare: il file non è stato toccato.');
console.log('I prodotti nuovi o spariti non sono stati aggiunti né cancellati: vanno sistemati a mano.');
