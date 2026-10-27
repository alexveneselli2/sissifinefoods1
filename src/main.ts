import '@fontsource/figtree/latin-400.css';
import '@fontsource/figtree/latin-600.css';
import '@fontsource/bodoni-moda/latin-400.css';
import '@fontsource/bodoni-moda/latin-500.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import './stile.css';

import { caricaDati, type Archivio, type Prodotto } from './dati';
import { h } from './dom';
import { cerca, creaIndice } from './ricerca';
import { normalizza, prezzo, slug } from './testo';
import { hrefFamiglia, hrefProdotto, Viste, type Vista } from './viste';

// ---------- elementi della pagina ----------

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;
const campo = $<HTMLInputElement>('#q');
const modulo = $<HTMLFormElement>('.barra-ricerca');
const pulisci = $<HTMLButtonElement>('.pulisci');
const stato = $<HTMLParagraphElement>('#stato');
const risultati = $<HTMLUListElement>('#risultati');
const sfoglia = $<HTMLElement>('#sfoglia');
const vista = $<HTMLDivElement>('#vista');
const colonnaScheda = $<HTMLElement>('.colonna-scheda');

const tablet = window.matchMedia('(min-width: 768px)');
const CHIAVE_RICERCA = 'abbinamenti-ricerca';

// ---------- rotte ----------

type Rotta =
  | { vista: 'ricerca' }
  | { vista: 'prodotto'; id: number; slug: string }
  | { vista: 'famiglie' }
  | { vista: 'famiglia'; id: string };

function leggiRotta(hash: string): Rotta {
  const parti = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (parti[0] === 'prodotto' && parti[1]) {
    const m = /^(\d+)(?:-(.*))?$/.exec(parti[1]);
    if (m) return { vista: 'prodotto', id: Number(m[1]), slug: m[2] ?? '' };
  }
  if (parti[0] === 'famiglie') return { vista: 'famiglie' };
  if (parti[0] === 'famiglia' && parti[1]) return { vista: 'famiglia', id: parti[1] };
  return { vista: 'ricerca' };
}

// Ogni voce della cronologia sa a che profondità si trova (d) e dov'è la ricerca da cui è partita (r):
// così "← Ricerca" torna indietro di quanti passi servono, come il tasto Indietro.
interface StatoStoria { d: number; r: number }

function statoStoria(): StatoStoria | null {
  const s = history.state as Partial<StatoStoria> | null;
  return s && typeof s.d === 'number' && typeof s.r === 'number' ? { d: s.d, r: s.r } : null;
}

let archivio: Archivio;
let viste: Viste;
let indice: ReturnType<typeof creaIndice>;
let corrente: { hash: string; vista: Rotta['vista']; stato: StatoStoria } | null = null;
const scorrimenti = new Map<number, { pagina: number; scheda: number }>();

function mostra(v: Vista, rotta: Rotta): void {
  document.body.dataset.vista = rotta.vista;
  vista.replaceChildren(v.contenuto);
  document.title = rotta.vista === 'ricerca' ? 'Abbinamenti · Sissi Fine Foods' : `${v.titolo} · Abbinamenti`;
  for (const a of document.querySelectorAll<HTMLAnchorElement>('.nav-link')) {
    const attivo = a.dataset.nav === (rotta.vista === 'famiglie' || rotta.vista === 'famiglia' ? 'famiglie' : 'ricerca');
    if (attivo) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  segnaRisultatoAttivo();
}

function gestisciRotta(): void {
  if (!archivio) return;
  const hash = location.hash || '#/';
  if (corrente && corrente.hash === hash) return;

  let s = statoStoria();
  const nuova = !s || !corrente;
  if (corrente) {
    scorrimenti.set(corrente.stato.d, { pagina: window.scrollY, scheda: colonnaScheda.scrollTop });
  }
  if (!s) {
    s = corrente
      ? { d: corrente.stato.d + 1, r: corrente.vista === 'ricerca' ? corrente.stato.d : corrente.stato.r }
      : { d: 0, r: -1 };
    history.replaceState(s, '');
  }

  const rotta = leggiRotta(hash);
  let v: Vista;
  let canonico: string | null = null;
  switch (rotta.vista) {
    case 'prodotto': {
      const p = archivio.prodotto.get(rotta.id);
      v = p ? viste.prodotto(p) : viste.nonTrovato('Prodotto');
      if (p && rotta.slug !== slug(p.nome)) canonico = hrefProdotto(p);
      break;
    }
    case 'famiglia': {
      const f = archivio.famiglia.get(rotta.id);
      v = f ? viste.famiglia(f) : viste.nonTrovato('Famiglia');
      break;
    }
    case 'famiglie':
      v = viste.famiglie();
      break;
    default:
      v = viste.benvenuto();
      if (hash !== '#/' && hash !== '#' && location.hash) canonico = '#/';
  }
  if (canonico) history.replaceState(s, '', canonico);

  mostra(v, rotta);
  corrente = { hash: location.hash || '#/', vista: rotta.vista, stato: s };

  // Scorrimento: tornando indietro si ritrova il punto di prima; su una scheda nuova si parte dall'alto.
  const salvato = scorrimenti.get(s.d);
  if (!nuova && salvato) {
    window.scrollTo(0, salvato.pagina);
    colonnaScheda.scrollTop = salvato.scheda;
  } else if (rotta.vista !== 'ricerca' || tablet.matches) {
    if (!tablet.matches) window.scrollTo(0, 0);
    colonnaScheda.scrollTop = 0;
  }

  // Il fuoco va sul titolo della scheda (per tastiera e lettori di schermo), senza far scorrere.
  if (corrente && rotta.vista !== 'ricerca' && document.activeElement !== campo) {
    vista.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  }
}

// "← Ricerca" e il logo tornano alla ricerca da cui si era partiti, come il tasto Indietro.
document.addEventListener('click', (evento) => {
  const link = (evento.target as Element).closest<HTMLAnchorElement>('a[href="#/"]');
  if (!link || !corrente || corrente.vista === 'ricerca') return;
  const { d, r } = corrente.stato;
  if (r >= 0 && r < d) {
    evento.preventDefault();
    history.go(r - d);
  }
});

window.addEventListener('hashchange', gestisciRotta);
window.addEventListener('popstate', gestisciRotta);

// ---------- ricerca ----------

function segno(p: Prodotto): HTMLElement {
  return h('span', { class: `segno segno-${p.tipo}`, 'aria-hidden': 'true' });
}

function aggiornaRisultati(): void {
  const domanda = campo.value;
  pulisci.hidden = domanda.length === 0;
  try { sessionStorage.setItem(CHIAVE_RICERCA, domanda); } catch { /* navigazione privata */ }

  if (!normalizza(domanda).trim()) {
    risultati.replaceChildren();
    sfoglia.hidden = false;
    stato.textContent = `Scrivi per cercare tra ${archivio.dati.prodotti.length} prodotti.`;
    return;
  }
  const lista = cerca(indice, domanda);
  sfoglia.hidden = lista.length > 0;
  stato.textContent = lista.length === 0
    ? `Nessun prodotto per «${domanda.trim()}». Prova con una parola sola o con la marca.`
    : lista.length === 1 ? '1 prodotto' : `${lista.length} prodotti`;

  risultati.replaceChildren(...lista.map((p) => h('li', null,
    h('a', { class: 'risultato', href: hrefProdotto(p), 'data-id': p.id },
      segno(p),
      h('span', { class: 'risultato-testo' },
        h('span', { class: 'risultato-nome' }, p.nome),
        h('span', { class: 'risultato-marca' }, p.marca ?? '', h('span', { class: 'sr' }, p.tipo === 'bevanda' ? ', bevanda' : ', cibo')),
      ),
      h('span', { class: p.prezzo == null ? 'risultato-prezzo da-fare' : 'risultato-prezzo' }, prezzo(p.prezzo)),
    ),
  )));
  segnaRisultatoAttivo();
}

function segnaRisultatoAttivo(): void {
  const rotta = leggiRotta(location.hash);
  const id = rotta.vista === 'prodotto' ? String(rotta.id) : null;
  for (const a of risultati.querySelectorAll<HTMLAnchorElement>('a')) {
    if (a.dataset.id === id) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
}

function preparaRicerca(): void {
  const elenco = sfoglia.querySelector('ul') as HTMLUListElement;
  elenco.replaceChildren(...archivio.dati.famiglie.map((f) => {
    const quanti = archivio.dati.prodotti.filter((p) => p.famiglie.includes(f.id)).length;
    return h('li', null, h('a', { class: 'sfoglia-voce', href: hrefFamiglia(f) },
      h('span', { class: 'sfoglia-nome' }, f.nome),
      h('span', { class: 'sfoglia-conta' }, `${quanti} prodotti`),
    ));
  }));

  campo.addEventListener('input', aggiornaRisultati);
  modulo.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const primo = risultati.querySelector<HTMLAnchorElement>('a');
    campo.blur();
    if (primo) location.hash = primo.getAttribute('href') as string;
  });
  pulisci.addEventListener('click', () => {
    campo.value = '';
    aggiornaRisultati();
    campo.focus();
  });
  for (const b of document.querySelectorAll<HTMLButtonElement>('.scorciatoie button')) {
    b.addEventListener('click', () => {
      campo.value = b.dataset.q ?? '';
      aggiornaRisultati();
      // Su tablet il fuoco torna al campo; su iPhone no, altrimenti la tastiera copre i risultati.
      if (tablet.matches) campo.focus();
    });
  }

  let salvata = '';
  try { salvata = sessionStorage.getItem(CHIAVE_RICERCA) ?? ''; } catch { /* navigazione privata */ }
  campo.value = salvata;
  aggiornaRisultati();
}

// ---------- avvio ----------

history.scrollRestoration = 'manual';

caricaDati()
  .then((a) => {
    archivio = a;
    viste = new Viste(a);
    indice = creaIndice(a);
    preparaRicerca();
    document.body.classList.add('pronto');
    gestisciRotta();
  })
  .catch((errore: unknown) => {
    stato.textContent = 'Il listino non si è caricato.';
    const v = new Viste({} as Archivio).errore(String(errore instanceof Error ? errore.message : errore));
    document.body.dataset.vista = 'errore';
    vista.replaceChildren(v.contenuto);
  });

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch(() => { /* senza service worker il sito funziona lo stesso, solo non offline */ });
  });
}
